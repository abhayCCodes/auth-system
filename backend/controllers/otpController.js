const getTransporter = require("../utils/mailTransporter");
const Otp = require("../models/Otp");
const User = require("../models/User");
const validator = require("validator");
const crypto = require("crypto");

const OTP_EXPIRY_MINUTES = 5;

// Generate a secure OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Send OTP to Email
const sendEmailOTP = async (email, otp) => {
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Secure OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>OTP Verification</h2>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>Valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p><em>Do not share this code.</em></p>
      </div>
    `,
  });
};

// ✅ Send OTP Controller
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({ email, otp, expiresAt });
    await sendEmailOTP(email, otp);

    return res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Send OTP error:", error.message);
    return res.status(500).json({
      error: "Failed to process OTP request",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
};

// ✅ Verify OTP Controller

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("--- START VERIFY OTP ---");
    console.log("Received for verification - Email:", email, "OTP:", otp);

    if (!email || !otp) {
        console.log("Error: Email or OTP missing in request body.");
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Log the current time for expiry comparison reference
    const currentTime = new Date();
    console.log("Current server time:", currentTime.toISOString()); // ISO string is good for debugging

    const validOtp = await Otp.findOne({
      email,
      otp,
      expiresAt: { $gt: currentTime }, // Use the logged currentTime
    });

    if (!validOtp) {
        // This is the critical log for the 400 error!
        console.log("OTP verification failed for:", email);
        // Try to find the OTP without the expiry check to see if it just expired or was wrong
        const foundOtpButMaybeExpired = await Otp.findOne({ email, otp });
        if (foundOtpButMaybeExpired) {
            console.log("OTP found but likely expired. Stored Expiry:", foundOtpButMaybeExpired.expiresAt.toISOString());
        } else {
            console.log("No matching OTP record found for email or OTP itself is incorrect.");
            // Further debug: Check if *any* OTP for this email exists at all
            const anyOtpForEmail = await Otp.findOne({ email });
            if (anyOtpForEmail) {
                console.log("An OTP exists for this email, but the provided OTP does not match:", anyOtpForEmail.otp);
            } else {
                console.log("No OTP record found for this email at all.");
            }
        }
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // If we reach here, it's a success
    console.log("OTP successfully validated for email:", email);
    console.log("Deleting OTP records for email:", email);
    await Otp.deleteMany({ email }); // Delete all OTPs for this email for security/cleanup

    const userExists = await User.exists({ email });
    console.log("Checking user existence for email:", email, ". User exists:", userExists);

    return res.json({
      success: true,
      isRegistered: userExists, // Renamed from 'userExists' to 'isRegistered' for clarity in frontend
      message: userExists ? "User verified" : "New user",
    });
  } catch (error) {
    console.error("Verify OTP error - CATCH BLOCK:", error);
    return res.status(500).json({
      error: "Server error during verification",
      ...(process.env.NODE_ENV === "development" && { details: error.stack }),
    });
  }
};

module.exports = { sendOTP, verifyOTP };

// (Optional) Test SMTP on dev start
if (process.env.NODE_ENV === "development") {
  (async () => {
    try {
      await getTransporter();
    } catch (err) {
      console.error("SMTP failed. Check your .env email config.");
    }
  })();
}
