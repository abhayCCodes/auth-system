const otpMap = new Map(); // emailOrMobile -> { otp, expiresAt }

exports.generateOTP = (emailOrMobile) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry
  otpMap.set(emailOrMobile, { otp, expiresAt });
  return otp;
};

exports.verifyOTP = (emailOrMobile, enteredOtp) => {
  const data = otpMap.get(emailOrMobile);
  if (!data) return false;
  const { otp, expiresAt } = data;
  if (Date.now() > expiresAt || otp !== enteredOtp) return false;
  otpMap.delete(emailOrMobile);
  return true;
};