const { format } = require("date-fns");
const validator = require("validator");
const getTransporter = require("../utils/mailTransporter");
const Otp = require("../models/Otp");
const User = require("../models/User");
const { generateOTP } = require("../utils/otpStore");

const OTP_EXPIRY_MINUTES = 15;

// --- Helper Functions ---
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
        console.log(`[OTP] Email sent to ${email}`);
    } catch (error) {
        console.error(`[OTP] Email failed for ${email}:`, error.message);
        throw new Error("Failed to send OTP email.");
    }
};

// --- Controllers ---
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        try {
            const savedOtpDoc = await Otp.findOneAndUpdate(
                { email },
                { otp, expiresAt },
                { upsert: true, new: true }
            );

            if (!savedOtpDoc) {
                console.error(`[OTP] Failed to save OTP for ${email}`);
                return res.status(500).json({ error: "Failed to save OTP" });
            }
        } catch (dbError) {
            console.error(`[OTP] DB error for ${email}:`, dbError.message);
            return res.status(500).json({ error: "Database error" });
        }

        await sendEmailOTP(email, otp);
        return res.json({ success: true, message: "OTP sent" });
    } catch (error) {
        console.error("[OTP] Controller error:", error.message);
        return res.status(500).json({
            error: error.message.includes("Failed to send") 
                ? "OTP email failed" 
                : "Server error",
            ...(process.env.NODE_ENV === "development" && { details: error.message }),
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const currentTime = new Date();

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        if (process.env.NODE_ENV === "development") {
            console.log(`[OTP] Verification request - Email: ${email}, OTP: ${otp}`);
            console.log("Current server time:", currentTime.toISOString());
        }

        const validOtp = await Otp.findOne({
            email,
            otp,
            expiresAt: { $gt: currentTime },
        });

        if (!validOtp) {
            if (process.env.NODE_ENV === "development") {
                const foundOtpRecord = await Otp.findOne({ email });
                console.log(`[OTP] Verification failed for ${email}`, {
                    storedOTP: foundOtpRecord?.otp,
                    expiry: foundOtpRecord?.expiresAt?.toISOString(),
                });
            }
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await Otp.deleteMany({ email });
        const userExists = await User.exists({ email });

        return res.json({
            success: true,
            isRegistered: userExists,
            message: userExists ? "User verified" : "OTP verified for new user",
        });
    } catch (error) {
        console.error("[OTP] Verification error:", error.message);
        return res.status(500).json({
            error: "Server error",
            ...(process.env.NODE_ENV === "development" && { details: error.message }),
        });
    }
};

// --- Development Checks ---
if (process.env.NODE_ENV === "development") {
    (async () => {
        try {
            console.log("Testing SMTP connection...");
            await getTransporter();
            console.log("✅ SMTP connected");
        } catch (err) {
            console.error("❌ SMTP failed:", err.message);
        }
    })();
}

module.exports = { sendOTP, verifyOTP };