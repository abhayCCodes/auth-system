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

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const validOtp = await Otp.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() },
    });

    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email });

    const userExists = await User.exists({ email });

    return res.json({
      success: true,
      isRegistered: userExists,
      message: userExists ? "User verified" : "New user",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
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
