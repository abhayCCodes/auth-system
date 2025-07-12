// backend/controllers/otpController.js
const Otp = require("../models/Otp");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Email Function
const sendEmailOTP = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Auth System" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code",
    html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Send OTP Controller
const sendOTP = async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ message: "Identifier required" });

  const otp = generateOTP();

  try {
    await Otp.create({ identifier, otp });

    if (identifier.includes("@")) {
      await sendEmailOTP(identifier, otp);
      return res.status(200).json({ message: "OTP sent to email." });
    } else {
      console.log(`📱 OTP for ${identifier} is ${otp}`);
      return res.status(200).json({ message: "OTP sent to mobile (console)." });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP Controller
const verifyOTP = async (req, res) => {
  const { identifier, otp } = req.body;

  try {
    const validOtp = await Otp.findOne({ identifier, otp });
    if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

    await Otp.deleteMany({ identifier });

    const existingUser = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }],
    });

    if (existingUser) {
      return res.status(200).json({ 
        message: "User exists. Ask for password.",
        isRegistered: true,
      });
    } else {
      return res.status(200).json({
        message: "User not registered.",
        isRegistered: false,
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
