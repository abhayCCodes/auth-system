const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateOTP, verifyOTP } = require("../utils/otpStore");

// Mock OTP sending (console log)
const sendOtp = (req, res) => {
  const { emailOrMobile } = req.body;
  if (!emailOrMobile) return res.status(400).json({ message: "Missing input." });

  const otp = generateOTP(emailOrMobile);
  console.log(`📤 OTP for ${emailOrMobile}: ${otp}`);

  res.status(200).json({ message: "OTP sent successfully." });
};

const verifyOtp = async (req, res) => {
  const { emailOrMobile, otp } = req.body;
  const isValid = verifyOTP(emailOrMobile, otp);
  if (!isValid) return res.status(400).json({ message: "Invalid or expired OTP." });

  const existingUser = await User.findOne({ emailOrMobile });
  if (existingUser) {
    res.status(200).json({ message: "OTP verified. User exists.", userExists: true });
  } else {
    res.status(200).json({ message: "OTP verified. New user.", userExists: false });
  }
};

const registerUser = async (req, res) => {
  const { name, emailOrMobile, password } = req.body;

  const existingUser = await User.findOne({ emailOrMobile });
  if (existingUser) return res.status(400).json({ message: "User already exists." });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    emailOrMobile,
    password: hashedPassword,
  });

  res.status(201).json({ message: "User registered successfully.", user });
};

const loginUser = async (req, res) => {
  const { emailOrMobile, password } = req.body;

  const user = await User.findOne({ emailOrMobile });
  if (!user) return res.status(400).json({ message: "User not found." });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Incorrect password." });

  res.status(200).json({ message: `Welcome, ${user.name}!`, user });
};

const resetPassword = async (req, res) => {
  const { emailOrMobile, newPassword } = req.body;

  const user = await User.findOne({ emailOrMobile });
  if (!user) return res.status(400).json({ message: "User not found." });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({ message: "Password reset successfully." });
};

module.exports = {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  resetPassword,
};
