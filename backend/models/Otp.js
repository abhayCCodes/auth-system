const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String, // can be email or mobile
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // auto delete after 5 minutes (300 seconds)
  },
});

module.exports = mongoose.model("Otp", otpSchema);
