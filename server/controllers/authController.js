const User = require('../models/User');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ─── Email transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Helper: Set refresh token in httpOnly cookie
 */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Helper: build login response (tokens + user data)
 */
const sendAuthResponse = async (user, statusCode, res, sessionId = null) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in DB
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken },
    lastLoginAt: new Date(),
  });

  setRefreshCookie(res, refreshToken);

  // Merge guest cart into user cart on login
  if (sessionId) {
    await mergeGuestCart(sessionId, user._id);
  }

  const userData = user.toJSON();

  res.status(statusCode).json({
    status: 'success',
    data: {
      accessToken,
      user: {
        _id:        userData._id,
        name:       userData.name,
        email:      userData.email,
        phone:      userData.phone,
        role:       userData.role,
        avatar:     userData.avatar,
        isVerified: userData.isVerified,
      },
    },
  });
};

/**
 * Merge guest cart into user cart after login/register
 */
const mergeGuestCart = async (sessionId, userId) => {
  try {
    const [guestCart, userCart] = await Promise.all([
      Cart.findOne({ sessionId }),
      Cart.findOne({ user: userId }),
    ]);

    if (!guestCart || guestCart.items.length === 0) return;

    if (!userCart) {
      // Simply reassign guest cart to this user
      guestCart.user = userId;
      guestCart.sessionId = undefined;
      await guestCart.save();
      return;
    }

    // Merge: add guest items that don't already exist in user cart
    for (const guestItem of guestCart.items) {
      const exists = userCart.items.find(
        (i) =>
          i.product.toString() === guestItem.product.toString() &&
          i.variantId.toString() === guestItem.variantId.toString()
      );
      if (!exists) {
        userCart.items.push(guestItem);
      }
    }

    await userCart.save();
    await Cart.findByIdAndDelete(guestCart._id);
  } catch (err) {
    console.error('Cart merge error:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// @desc    Register with email + password
// ─────────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, sessionId } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already registered. Please log in.', 409);
  }

  const user = new User({
    name,
    email,
    phone,
    passwordHash: password, // pre-save hook hashes this
    role: 'customer',
  });
  await user.save();

  await sendAuthResponse(user, 201, res, sessionId);
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// @desc    Login with email + password
// ─────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, sessionId } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  await sendAuthResponse(user, 200, res, sessionId);
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/send-otp
// @access  Public
// @desc    Send OTP to email (for passwordless login)
// ─────────────────────────────────────────────────────────────────────
exports.sendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required', 400);

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Auto-create account on first OTP
    user = new User({ name: email.split('@')[0], email, isVerified: false });
  }

  const otp = user.generateOtp();
  await user.save({ validateBeforeSave: false });

  // Send OTP email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Trove Login OTP',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #4E4FEB;">Your Trove OTP</h2>
          <p>Use the code below to log in. It expires in 10 minutes.</p>
          <div style="background: #f0f0ff; border-radius: 8px; padding: 24px; text-align: center;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2A2A72;">${otp}</span>
          </div>
          <p style="color: #888; margin-top: 16px;">Do not share this code with anyone.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — OTP still works if email fails (for dev/testing)
  }

  res.json({
    status: 'success',
    message: `OTP sent to ${email}`,
    // Only expose OTP in dev mode
    ...(process.env.NODE_ENV === 'development' && { otp }),
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @access  Public
// @desc    Verify OTP and return tokens
// ─────────────────────────────────────────────────────────────────────
exports.verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp, sessionId } = req.body;
  if (!email || !otp) throw new AppError('Email and OTP are required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+otp');
  if (!user) throw new AppError('User not found', 404);

  if (!user.verifyOtp(otp)) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  // Clear OTP
  user.otp = undefined;
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  await sendAuthResponse(user, 200, res, sessionId);
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/refresh
// @access  Public (uses httpOnly cookie)
// @desc    Refresh access token using refresh token
// ─────────────────────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('No refresh token found', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens?.includes(token)) {
    throw new AppError('Refresh token is no longer valid. Please log in.', 401);
  }

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefreshToken);

  res.json({
    status: 'success',
    data: { accessToken: generateAccessToken(user._id, user.role) },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
// @desc    Logout — clear cookie and invalidate refresh token
// ─────────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: token },
    });
  }

  res.clearCookie('refreshToken');
  res.json({ status: 'success', message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
// @desc    Get current user profile
// ─────────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('sellerProfile');
  res.json({ status: 'success', data: { user } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/auth/me
// @access  Private
// @desc    Update profile (name, phone, avatar)
// ─────────────────────────────────────────────────────────────────────
exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name)  updates.name  = name;
  if (phone) updates.phone = phone;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ status: 'success', data: { user } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/auth/change-password
// @access  Private
// @desc    Change password
// ─────────────────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Both current and new password are required', 400);
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  user.passwordHash = newPassword; // pre-save will hash it
  await user.save();

  res.json({ status: 'success', message: 'Password updated successfully' });
});
