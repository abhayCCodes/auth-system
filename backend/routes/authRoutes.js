const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  resetPassword,
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);

module.exports = router;
