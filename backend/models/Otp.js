const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: "Invalid email format"
    }
  },
  otp: { 
    type: String, 
    required: true,
    validate: {
      validator: (v) => /^\d{6}$/.test(v),
      message: "OTP must be 6 digits"
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15*60*1000), // 15 mins from now
    index: { expires: 0 } // Auto-delete at exact expiry time
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster querying during verification
otpSchema.index({ email: 1, otp: 1 }); 

// Pre-save hook to maintain consistency
otpSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 15*60*1000);
  }
  next();
});

// Add document lifecycle logging
otpSchema.post('save', function(doc) {
  console.log(`✅ OTP saved for ${doc.email}`, {
    id: doc._id,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt
  });
});

otpSchema.post('remove', function(doc) {
  console.log(`🗑️ OTP deleted for ${doc.email}`);
});

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;