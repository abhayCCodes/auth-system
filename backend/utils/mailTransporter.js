//auth-system\backend\utils\mailTransporter.js
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === "465", // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");
    return transporter;
  } catch (err) {
    console.error("❌ SMTP verification failed:", err);
    transporter = null;
    throw new Error("SMTP connection failed");
  }
};

module.exports = getTransporter;
