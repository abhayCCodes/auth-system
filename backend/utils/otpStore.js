// backend/utils/otpStore.js
const otpMap = new Map();
const OTP_EXPIRY_MINUTES = 5;

class OTPStore {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  static storeOTP(email, otp) {
    if (!email || !otp) throw new Error('Email and OTP are required');
    otpMap.set(email, {
      otp,
      expiresAt: Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)
    });
  }

  static verifyOTP(email, otp) {
    const record = otpMap.get(email);
    if (!record) return false;
    
    const isValid = record.otp === otp && Date.now() < record.expiresAt;
    otpMap.delete(email); // One-time use
    return isValid;
  }

  static cleanup() {
    const now = Date.now();
    for (const [email, { expiresAt }] of otpMap.entries()) {
      if (now >= expiresAt) otpMap.delete(email);
    }
  }
}

// Cleanup expired OTPs every hour
setInterval(OTPStore.cleanup, 60 * 60 * 1000);

module.exports = OTPStore;