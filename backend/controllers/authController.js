const getTransporter = require("../utils/mailTransporter");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateOTP, verifyOTP } = require("../utils/otpStore");


// ✅ Define everything as named constants
const sendOTP = async (req, res) => {
  const { emailOrMobile } = req.body;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrMobile)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const otp = generateOTP(emailOrMobile);
    
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: emailOrMobile,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>OTP Verification</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>Valid for 5 minutes.</p>
          <p style="color: #888;">Do not share this code with anyone.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    console.error("Email Send Error:", err);
    res.status(500).json({
      error: "Failed to send OTP",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// ✅ Define other functions too (as you already did)
const registerUser = async (req, res) => { /* your code */ };
const login = async (req, res) => { /* your code */ };
const resetPassword = async (req, res) => { /* your code */ };

// ✅ Final correct export
module.exports = {
  sendOTP,
  verifyOTP,
  registerUser,
  login,
  resetPassword
};
