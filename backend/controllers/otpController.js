const crypto = require("crypto");
const { format } = require("date-fns"); 
const validator = require("validator"); 
const axios = require("axios"); // 🚀 Simple, reliable, and breaks the loop!
const Otp = require("../models/Otp"); 
const User = require("../models/User"); 
const mongoose = require("mongoose");

const OTP_EXPIRY_MINUTES = 15; 

// =========================== SEND OTP =============================
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Email Validation
    if (!email || !validator.isEmail(email)) {
      console.error("Invalid email:", email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 2. Database Connection Check
    console.log("\n=== DATABASE STATUS ===");
    console.log("- Connection state:", ["disconnected","connected","connecting","disconnecting"][mongoose.connection.readyState]);
    
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not ready!");
      await mongoose.connection.asPromise().catch(() => {});
    }

    // 3. OTP Generation
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    console.log("\n=== OTP DETAILS ===");
    console.log("- OTP:", otp);
    console.log("- Expires:", expiresAt);

    // 4. Database Operations
    console.log("\n=== DATABASE OPERATIONS ===");
    
    const deleteResult = await Otp.deleteMany({ email });
    console.log(`- Deleted ${deleteResult.deletedCount} old OTPs`);

    const newOtpDoc = new Otp({ email, otp, expiresAt });
    const savedOtp = await newOtpDoc.save();

    const dbCheck = await Otp.findOne({ _id: savedOtp._id });
    if (!dbCheck) {
      throw new Error("OTP failed to persist in database");
    }

    // 5. Direct HTTPS call to Brevo API via Axios
    console.log("\n=== EMAIL PROCESS ===");
    
    const response = await axios.post('https://brevo.com', {
      sender: { name: "Secure Auth System", email: process.env.SENDER_EMAIL },
      to: [{ email: email }],
      subject: "🔐 Your OTP for Verification",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Verification Code</h2>
          <p>Hello,</p>
          <p>Your security verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4F46E5; background-color: #F3F4F6; padding: 10px 20px; border-radius: 4px;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #666;">This code is valid for ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      timeout: 5000
    });

    console.log(`✅ OTP email sent successfully via Brevo. ID: ${response.data.messageId}`);

    // 6. Response
    res.status(200).json({
      message: "OTP sent successfully",
      expiresAt: format(expiresAt, "yyyy-MM-dd HH:mm:ss")
    });

  } catch (error) {
    console.error("\n=== OPERATION FAILED ===");
    console.error("Error:", error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// =========================== VERIFY OTP =============================
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const existingOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!existingOtp) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (existingOtp.otp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const userExists = await User.findOne({ email });
    await Otp.deleteMany({ email });

    return res.status(200).json({
      message: "OTP verified successfully",
      userExists: !!userExists,
    });
  } catch (err) {
    console.error("❌ Error verifying OTP:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { sendOTP, verifyOTP };
