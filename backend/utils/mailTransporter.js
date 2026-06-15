// backend/utils/mailTransporter.js
const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailViaApi = async (to, subject, htmlContent) => {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: htmlContent,
    });
    
    console.log("✅ Email sent successfully via Resend! ID:", data.id);
    return data;
  } catch (err) {
    console.error("❌ Resend API failed:", err);
    throw new Error("Email delivery failed");
  }
};

module.exports = sendEmailViaApi;