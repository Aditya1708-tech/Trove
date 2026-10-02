/**
 * Trove E-Commerce Marketplace — Express Server
 * Entry point: server.js
 */
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB       = require('./config/db');
const globalErrorHandler = require('./middleware/errorHandler');
const AppError        = require('./utils/AppError');

// ── Import routes ──
const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const cartRoutes    = require('./routes/cartRoutes');
const userRoutes    = require('./routes/userRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// ─── Security middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const configuredOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
    const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || origin === configuredOrigin || (process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin is not allowed by CORS'));
    }
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ─── Rate limiting ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      200,
  message:  { status: 'error', message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { status: 'error', message: 'Too many auth attempts. Please try again later.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// ─── Raw body capture for Razorpay webhook ───────────────────────────
// Webhook route must be registered BEFORE express.json() to get the raw body
app.use('/api/payments/webhook', (req, res, next) => {
  let rawBody = '';
  req.on('data', (chunk) => { rawBody += chunk.toString(); });
  req.on('end', () => {
    req.rawBody = rawBody;
    try { req.body = JSON.parse(rawBody); } catch {}
    next();
  });
});

// ─── Body parsing & cookies ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Request logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:  'ok',
    message: 'Trove API is running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ─── Mount routes ────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/payments', paymentRoutes);

// ─── Serve frontend in production ───────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  
  });
}

// ─── 404 handler ────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global error handler ────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Start server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server;

connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`🚀 Trove server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
});

// ─── Unhandled rejection safety net ─────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app; // for testing
