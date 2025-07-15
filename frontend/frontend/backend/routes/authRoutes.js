const express = require("express");
const router = express.Router();
const {
  sendOTP,
  registerUser,
  login,
  resetPassword,
} = require("../controllers/authController");
const { verifyOTP } = require("../controllers/otpController");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/signup", registerUser);
router.post("/login", login);
router.post("/reset-password", resetPassword);

module.exports = router;
