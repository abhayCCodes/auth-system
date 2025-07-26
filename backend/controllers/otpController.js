//auth-system\backend\controllers\otpController.js
const crypto = require("crypto");
const { format } = require("date-fns"); // For more robust date formatting if needed (example)
const validator = require("validator"); // For email validation
const getTransporter = require("../utils/mailTransporter"); // SMTP transporter setup
const Otp = require("../models/Otp"); // Mongoose model for OTPs
const User = require("../models/User"); // Mongoose model for Users
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const mongoose = require("mongoose");


const OTP_EXPIRY_MINUTES = 15; // How long an OTP is valid

// =========================== SEND OTP =============================
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Email Validation (Original Logic Preserved)
    if (!email || !validator.isEmail(email)) {
      console.error("Invalid email:", email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 2. Database Connection Check (New Safety Layer)
    console.log("\n=== DATABASE STATUS ===");
    console.log("- Connection state:", ["disconnected","connected","connecting","disconnecting"][mongoose.connection.readyState]);
    
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not ready!");
      // Attempt reconnect if needed (won't break your existing flow)
      await mongoose.connection.asPromise().catch(() => {});
    }

    // 3. OTP Generation (Original Logic Preserved)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    console.log("\n=== OTP DETAILS ===");
    console.log("- OTP:", otp);
    console.log("- Expires:", expiresAt);

    // 4. OTP Storage (Enhanced Version of Your Logic)
    console.log("\n=== DATABASE OPERATIONS ===");
    
    // 4a. Delete old OTPs (Your Original Logic)
    const deleteResult = await Otp.deleteMany({ email });
    console.log(`- Deleted ${deleteResult.deletedCount} old OTPs`);

    // 4b. Save new OTP (Your Logic + Safety Wrappers)
    const newOtpDoc = new Otp({ 
      email,  // Preserving your exact schema
      otp,    // as used in other files
      expiresAt 
    });

    const savedOtp = await newOtpDoc.save();
    console.log("- Saved OTP Document:", {
      _id: savedOtp._id,
      email: savedOtp.email,
      expiresAt: savedOtp.expiresAt
    });

    // 4c. Immediate Verification (Your Check + Enhanced)
    const dbCheck = await Otp.findOne({ _id: savedOtp._id });
    if (!dbCheck) {
      throw new Error("OTP failed to persist in database");
    }
    console.log("- Database Verification:", !!dbCheck);

    // 5. Email Sending (Original Logic Preserved + Error Handling)
    console.log("\n=== EMAIL PROCESS ===");
    const transporter = await getTransporter();
    
    // 5a. SMTP Check (Your Original Logic)
    await new Promise((resolve, reject) => {
      transporter.verify((error) => {
        if (error) {
          console.error("- SMTP Error:", error.message);
          reject(new Error("SMTP verification failed"));
        } else {
          console.log("- SMTP Connection Verified");
          resolve();
        }
      });
    });

    // 5b. Send Email (Your Original Template Preserved)
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🔐 Your OTP for Verification",
      html: `<h3>Your OTP is: <strong>${otp}</strong></h3>
             <p>Expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`- Email sent to ${email}`);

    // 6. Response (Your Original Format + Debug Info)
    res.status(200).json({
      message: "OTP sent successfully",
      expiresAt: format(expiresAt, "yyyy-MM-dd HH:mm:ss"), // Your original format
      debug: process.env.NODE_ENV === 'development' ? { otpId: savedOtp._id } : undefined
    });

  } catch (error) {
    console.error("\n=== OPERATION FAILED ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    // Preserving your original error response structure
    res.status(500).json({ 
      error: "Failed to send OTP",
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

// =========================== VERIFY OTP =============================
// controllers/otpController.js
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("📩 Received in verifyOTP:", { email, otp }); // ✅ already added
    console.log("🔍 Raw req.body:", req.body);                // ✅ Add this line right after destructuring

    // ✅ Step 1: Validate inputs
    if (!email || !otp) {
      console.log("🚫 Missing email or OTP");
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // ✅ Step 2: Fetch latest OTP from DB
    const existingOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });

    console.log("🧪 existingOtp:", existingOtp);               // ✅ Add this right after fetching OTP

    if (!existingOtp) {
      console.log("🚫 No OTP record found for this email in DB");
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    console.log("🆚 comparing:", existingOtp.otp, otp);        // ✅ Add this before comparing OTPs

    // ✅ Step 3: Compare OTP
    if (existingOtp.otp.toString() !== otp.toString()) {
      console.log(
        `🚫 OTP mismatch: expected=${existingOtp.otp}, received=${otp}`
      );
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Step 4: Check if user exists
    const userExists = await User.findOne({ email });
    console.log("✅ OTP verified. User exists:", !!userExists);

    // ✅ Step 5: Clean up OTP
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

module.exports = {
  sendOTP,
  verifyOTP
};


