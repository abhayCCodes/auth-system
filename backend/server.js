require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// Security Middleware
// ========================
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// ========================
// Core Middleware
// ========================
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(morgan('dev')); // HTTP request logging

// ========================
// Database Connection
// ========================
connectDB(); // Your existing DB connection

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);

// ========================
// Status Routes
// ========================
app.get('/', (req, res) => {
  res.json({
    status: '✅ Auth System API is running',
    version: '1.0.0',
    docs: process.env.API_DOCS_URL || 'No docs URL set'
  });
});

// ========================
// Error Handlers
// ========================
// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================
// Server Start
// ========================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`📚 API Docs: ${process.env.API_DOCS_URL || 'Not configured'}\n`);
});