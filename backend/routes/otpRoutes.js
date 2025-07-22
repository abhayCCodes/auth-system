// backend/routes/otpRoutes.js
const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP } = require("../controllers/otpController");

console.log("verifyOTP exists?", verifyOTP);

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;

