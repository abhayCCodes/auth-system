require('dotenv').config({ path: __dirname + '/.env' }); // Absolute path to .env
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const nodemailer = require('nodemailer'); // Add this line
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB
connectDB();

// Debug Environment Variables
console.log('[ENV] SMTP Config:', {
  host: process.env.EMAIL_HOST || 'MISSING',
  port: process.env.EMAIL_PORT || 'MISSING',
  user: process.env.EMAIL_USER ? '*****' : 'MISSING'
});

// Middleware 
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json());

// SMTP Verification
connectDB().then(() => {
  if (process.env.EMAIL_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false } // For testing only
    });

    transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ SMTP Connection Failed:', {
          code: error.code,
          command: error.command,
          response: error.response
        });
      } else {
        console.log('✅ SMTP Server Ready');
      }
    });
  }
});

// Routes (Keep your original)
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);

// Server Start (Keep your original)
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 http://localhost:${PORT}`);
});