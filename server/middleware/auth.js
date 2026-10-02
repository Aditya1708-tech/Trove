const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Middleware: protect routes — requires valid JWT access token
 * Token can be in Authorization header or httpOnly cookie
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fall back to cookie
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Not authenticated. Please log in.', 401);
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please log in again.', 401);
    }
    throw new AppError('Invalid token. Please log in again.', 401);
  }

  // Fetch user (ensure they still exist and are active)
  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.isActive) {
    throw new AppError('User no longer exists or is inactive.', 401);
  }

  req.user = user;
  next();
});

/**
 * Middleware: optionally attach user to req if token present (no error if missing)
 * Useful for routes that have different behavior for guests vs. logged-in users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch {
      // Silently ignore invalid token in optional auth
    }
  }
  next();
});

/**
 * Middleware: restrict to specific roles
 * Usage: restrict('admin', 'seller')
 */
const restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403)
      );
    }
    next();
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  protect,
  optionalAuth,
  restrict,
};
