// --- Node.js Built-in Imports ---
const crypto = require("crypto");
const { format } = require("date-fns"); // For more robust date formatting if needed (example)

// --- Third-Party Imports ---
const validator = require("validator"); // For email validation

// --- Local Module Imports ---
const getTransporter = require("../utils/mailTransporter"); // SMTP transporter setup
const Otp = require("../models/Otp"); // Mongoose model for OTPs
const User = require("../models/User"); // Mongoose model for Users

const OTP_EXPIRY_MINUTES = 5; // How long an OTP is valid

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendEmailOTP = async (email, otp) => {
    try {
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Your Secure OTP Code",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333;">OTP Verification</h2>
                    <p style="font-size: 16px; color: #555;">Your One-Time Password (OTP) for verification is:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #007bff; background-color: #e9f5ff; padding: 10px; border-radius: 5px; text-align: center;">${otp}</p>
                    <p style="font-size: 14px; color: #777;">This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
                    <p style="font-size: 14px; color: #777; font-style: italic;">Please do not share this code with anyone.</p>
                    <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
                </div>
            `,
        });
        console.log(`[sendEmailOTP] OTP sent to ${email}`);
    } catch (error) {
        console.error(`[sendEmailOTP] Error sending email to ${email}:`, error);
        throw new Error("Failed to send OTP email."); // Re-throw to be caught by the controller
    }
};

// --- Controller Functions ---
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const otp = generateOTP();
        // Calculate expiry time in milliseconds from now
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Save OTP to database (overwrite existing ones for this email for security)
        await Otp.findOneAndUpdate(
            { email }, 
            { otp, expiresAt }, 
            { upsert: true, new: true, setDefaultsOnInsert: true } 
        );
        console.log(`[sendOTP] OTP saved to DB for ${email}. OTP: ${otp}`); // For debugging only, remove OTP from logs in production!

        // Send the email
        await sendEmailOTP(email, otp);

        return res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        console.error("[sendOTP] Controller error:", error); // Log full error object
        const errorMessage = error.message.includes("Failed to send OTP email")
            ? "Failed to send OTP email. Please try again."
            : "Failed to process OTP request.";

        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === "development" && { details: error.message }),
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // --- DEBUGGING LOGS (KEEP FOR NOW, REMOVE IN PRODUCTION) ---
        console.log("--- START VERIFY OTP ---");
        console.log(`Received for verification - Email: ${email}, OTP: ${otp}`);
        const currentTime = new Date();
        console.log("Current server time:", currentTime.toISOString());

        if (!email || !otp) {
            console.log("[verifyOTP] Error: Email or OTP missing in request body.");
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const validOtp = await Otp.findOne({
            email,
            otp,
            expiresAt: { $gt: currentTime },
        });

        if (!validOtp) {
            
            console.log(`[verifyOTP] OTP verification failed for: ${email}`);
            const foundOtpRecord = await Otp.findOne({ email }); // Find any OTP for this email
            if (foundOtpRecord) {
                console.log(`[verifyOTP] Found OTP record for email. Stored OTP: ${foundOtpRecord.otp}, Stored Expiry: ${foundOtpRecord.expiresAt ? foundOtpRecord.expiresAt.toISOString() : 'N/A'}`);
                if (foundOtpRecord.otp !== otp) {
                    console.log("[verifyOTP] Reason: OTP MISMATCH.");
                } else if (foundOtpRecord.expiresAt && currentTime > new Date(foundOtpRecord.expiresAt)) {
                    console.log("[verifyOTP] Reason: OTP EXPIRED.");
                } else {
                    console.log("[verifyOTP] Reason: Unknown (could be date comparison issue or data type mismatch).");
                }
            } else {
                console.log("[verifyOTP] Reason: No OTP record found for this email at all.");
            }
            // --- END DETAILED DEBUGGING LOGS ---
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // OTP successfully validated
        console.log(`[verifyOTP] OTP successfully validated for email: ${email}`);

        // Clean up: Delete all OTPs for this email after successful verification
        // This ensures the OTP cannot be reused and keeps the DB clean.
        await Otp.deleteMany({ email });
        console.log(`[verifyOTP] Deleted OTP records for email: ${email}`);

        // Check if the user already exists in your main User collection
        const userExists = await User.exists({ email }); // More efficient than findOne for just checking existence
        console.log(`[verifyOTP] Checking user existence for email: ${email}. User exists: ${userExists}`);

        // Respond based on user existence (for frontend redirection)
        return res.json({
            success: true,
            isRegistered: userExists, // Renamed 'userExists' to 'isRegistered' for clarity on frontend
            message: userExists ? "User verified and found" : "OTP verified for new user",
        });

    } catch (error) {
        console.error("[verifyOTP] Controller error - CATCH BLOCK:", error); // Log full error object
        return res.status(500).json({
            error: "Server error during verification",
            ...(process.env.NODE_ENV === "development" && { details: error.message }), // Use error.message for more relevant detail
        });
    }
};

// --- Export Controllers ---
module.exports = { sendOTP, verifyOTP };

// --- Development-only SMTP Connection Test (Optional: can be moved to server.js or a dedicated health check) ---
// This ensures your mailer configuration is correct when the app starts in development
if (process.env.NODE_ENV === "development") {
    (async () => {
        try {
            console.log("Attempting SMTP connection test...");
            await getTransporter();
            console.log("✅ SMTP connection verified successfully.");
        } catch (err) {
            console.error("❌ SMTP connection failed. Check your .env email configuration.", err);
        }
    })();
}