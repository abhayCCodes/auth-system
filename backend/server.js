require('dotenv').config({ path: __dirname + '/.env' }); // Load .env from backend root
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Clean Production Debug Log
console.log('[ENV] Email Configuration:', {
  service: process.env.RESEND_API_KEY ? 'Resend API (Active)' : 'MISSING RESEND_API_KEY'
});

// ✅ Allowed Origins for CORS (Vercel, local, previews)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
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

// ✅ Handle raw JSON fallback wrapper
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

// ✅ Root route (Returns HTML template for Railway health status checker)
app.get('/', (req, res) => {
  res.status(200).send("<h1>🚀 Auth API Backend is Live and Healthy!</h1>");
});

// ✅ Connect Database & Initialize Server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'production'} mode`);
    console.log(`🔗 Listening on port: ${PORT}`);
  });
}).catch(err => {
  console.error("❌ Critical Database Connection Failure:", err);
  process.exit(1);
});