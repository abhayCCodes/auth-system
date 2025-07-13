const Otp = require("../models/Otp");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const validator = require("validator");
const crypto = require("crypto");

// Constants
const OTP_EXPIRY_MINUTES = 5;

// Generate cryptographically secure OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Create and verify transporter (singleton pattern)
let transporter;
const getTransporter = async () => {
  if (transporter) return transporter; // Reuse if already exists

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");
    return transporter;
  } catch (error) {
    console.error("❌ SMTP verification failed:", error);
    transporter = null; // Reset for next attempt
    throw new Error("SMTP connection failed");
  }
};

// Send OTP Email
const sendEmailOTP = async (email, otp) => {
  try {
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
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email delivery failed");
  }
};

// Send OTP Controller
const sendOTP = async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: "Email or mobile required" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({ identifier, otp, expiresAt });

    if (validator.isEmail(identifier)) {
      await sendEmailOTP(identifier, otp);
      return res.json({ success: true, message: "OTP sent to email" });
    } else {
      console.log(`OTP for ${identifier}: ${otp}`);
      return res.json({ 
        success: true, 
        message: "OTP generated (configure SMS for production)",
        ...(process.env.NODE_ENV === "development" && { otp }), // Dev-only
      });
    }
  } catch (error) {
    console.error("Send OTP error:", error.message);
    return res.status(500).json({ 
      error: "Failed to process OTP request",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
};

// Verify OTP Controller
const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const validOtp = await Otp.findOne({
      identifier,
      otp,
      expiresAt: { $gt: new Date() },
    });

    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ identifier });

    const userExists = await User.exists({
      $or: [{ email: identifier }, { mobile: identifier }],
    });

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

// Optional: Test SMTP on startup in development
if (process.env.NODE_ENV === "development") {
  (async () => {
    try {
      await getTransporter();
    } catch (error) {
      console.error("SMTP initialization failed. Check your .env config!");
    }
  })();
}