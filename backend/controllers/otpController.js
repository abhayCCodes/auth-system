const crypto = require("crypto");
const { format } = require("date-fns"); // For more robust date formatting if needed (example)
const validator = require("validator"); // For email validation
const getTransporter = require("../utils/mailTransporter"); // SMTP transporter setup
const Otp = require("../models/Otp"); // Mongoose model for OTPs
const User = require("../models/User"); // Mongoose model for Users
const { generateOTP, verifyOTP: verifyStoredOTP } = require("../utils/otpStore");

const OTP_EXPIRY_MINUTES = 15; // How long an OTP is valid

// =========================== SEND OTP =============================
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const savedOtpDoc = await Otp.findOneAndUpdate(
      { email },
      {
        otp,
        createdAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true }
    );

    const transporter = getTransporter();
    
    // ✅ SMTP Connection Test
    transporter.verify(function (error, success) {
      if (error) {
        console.error("❌ SMTP Connection Error:", error);
        return res.status(500).json({ error: "SMTP connection failed." });
      } else {
        console.log("✅ SMTP Server is ready to send messages");
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🔐 Your OTP for Verification",
      html: `<h3>Your OTP is: <strong>${otp}</strong></h3><p>This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 OTP for ${email} is ${otp}`);

    res.status(200).json({
      message: "OTP sent successfully",
      expiresAt: format(expiresAt, "yyyy-MM-dd HH:mm:ss"),
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// =========================== VERIFY OTP =============================
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const isValid = await verifyStoredOTP(email, otp);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
