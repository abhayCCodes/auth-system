const crypto = require("crypto");
const { format } = require("date-fns"); 
const validator = require("validator"); 
const sendEmailViaApi = require("../utils/mailTransporter"); // Import our new Resend function
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
    
    // Delete old OTPs
    const deleteResult = await Otp.deleteMany({ email });
    console.log(`- Deleted ${deleteResult.deletedCount} old OTPs`);

    // Save new OTP
    const newOtpDoc = new Otp({ email, otp, expiresAt });
    const savedOtp = await newOtpDoc.save();

    // Immediate Verification
    const dbCheck = await Otp.findOne({ _id: savedOtp._id });
    if (!dbCheck) {
      throw new Error("OTP failed to persist in database");
    }

    // 5. Email Sending via Resend API
    console.log("\n=== EMAIL PROCESS ===");
    const htmlContent = `<h3>Your OTP is: <strong>${otp}</strong></h3>
                         <p>Expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`;

    // Calls Resend directly (Bypasses SMTP ports completely)
    await sendEmailViaApi(email, "🔐 Your OTP for Verification", htmlContent);

    // 6. Response
    res.status(200).json({
      message: "OTP sent successfully",
      expiresAt: format(expiresAt, "yyyy-MM-dd HH:mm:ss")
    });

  } catch (error) {
    console.error("\n=== OPERATION FAILED ===");
    console.error("Error:", error.message);
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