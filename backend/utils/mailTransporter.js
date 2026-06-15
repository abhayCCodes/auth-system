// backend/utils/mailTransporter.js
const axios = require('axios');

const sendEmailViaApi = async (to, subject, htmlContent) => {
  try {
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "Auth System", email: process.env.SENDER_EMAIL },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent, 
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    console.log("✅ Email sent successfully via Brevo! ID:", response.data.messageId);
    return response.data;
  } catch (err) {
    console.error("❌ Brevo API failed:", err.response ? err.response.data : err.message);
    throw new Error("Email delivery failed");
  }
};

module.exports = sendEmailViaApi;
