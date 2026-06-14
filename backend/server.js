require('dotenv').config({ path: __dirname + '/.env' }); // Load .env from backend root
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SMTP Debug Log
console.log('[ENV] SMTP Config:', {
  host: process.env.EMAIL_HOST || 'MISSING',
  port: process.env.EMAIL_PORT || 'MISSING',
  user: process.env.EMAIL_USER ? '*****' : 'MISSING'
});

// ✅ Allowed Origins for CORS (Vercel, local, previews)
const allowedOrigins = [
  'http://localhost:3000',
  'https://auth-frontend.vercel.app',
  'https://auth-frontend-psi-livid.vercel.app',
  /^https:\/\/auth-frontend(-[a-z0-9]+)?(-abhay-chauhans-projects-[a-z0-9]+)?\.vercel\.app$/,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.some(allowed =>
        typeof allowed === 'string'
          ? origin === allowed
          : allowed instanceof RegExp && allowed.test(origin)
      )
    ) {
      return callback(null, true);
    }
    console.error(`🚫 CORS Blocked: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// ✅ Global Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// ✅ Handle raw JSON in curl/Powershell (just in case)
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

// ✅ Routes
app.use("/api/auth", authRoutes);  // login, register, reset-password
app.use("/api/otp", otpRoutes);    // send-otp, verify-otp

// ✅ Root route
app.get('/', (req, res) => {
  res.json({ message: 'Auth API is running', status: 'ok' });
});

// ✅ Connect DB + Verify SMTP once
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
      tls: { rejectUnauthorized: false } // For dev only
    });

    transporter.verify((error, success) => {
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


// ✅ Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 http://localhost:${PORT}`);
});
