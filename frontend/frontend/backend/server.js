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

// Debug Environment Variables
console.log('[ENV] SMTP Config:', {
  host: process.env.EMAIL_HOST || 'MISSING',
  port: process.env.EMAIL_PORT || 'MISSING',
  user: process.env.EMAIL_USER ? '*****' : 'MISSING'
});

// Middleware 
const allowedOrigins = [
  'http://localhost:3000',
  'https://auth-frontend.vercel.app', // main production domain
  // Allow all Vercel preview deployments dynamically
  /^https:\/\/auth-frontend(-[a-z0-9]+)?(-abhay-chauhans-projects-[a-z0-9]+)?\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server calls
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return origin === allowed;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    })) {
      return callback(null, true);
    }
    console.error(`🚨 CORS Blocked: ${origin}`); // Log blocked requests
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Required for cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow OPTIONS
}));

// Handle preflight requests explicitly
app.options('*', cors()); // Allow OPTIONS on all routes

app.use(morgan('dev'));

// ✅ Add fallback middleware to parse raw JSON from tools like PowerShell
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (
    req.headers['content-type'] === 'application/json' &&
    (typeof req.body === 'undefined' || Object.keys(req.body).length === 0)
  ) {
    let rawData = '';
    req.on('data', chunk => { rawData += chunk });
    req.on('end', () => {
      try {
        req.body = JSON.parse(rawData);
      } catch (err) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});


// Routes (grouped after middlewares)
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

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

// Server Start (Keep your original)
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 http://localhost:${PORT}`);
});



