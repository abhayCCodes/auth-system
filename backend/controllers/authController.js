const getTransporter = require("../utils/mailTransporter");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateOTP, verifyOTP } = require("../utils/otpStore");

// ✅ Send OTP to Email only
const sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const otp = generateOTP(email);

    const transporter = await getTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>OTP Verification</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>Valid for 5 minutes.</p>
          <p style="color: #888;">Do not share this code with anyone.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Email Send Error:", err);
    res.status(500).json({
      error: "Failed to send OTP",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// ✅ Register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ success: true, message: "User registered", user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ✅ Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// ✅ Reset password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
};

module.exports = {
  sendOTP,
  registerUser,
  login,
  resetPassword,
};
