const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Address sub-schema (embedded in User)
 */
const addressSchema = new mongoose.Schema({
  fullName:    { type: String, required: true },
  phone:       { type: String, required: true },
  addressLine1:{ type: String, required: true },
  addressLine2:{ type: String, default: '' },
  city:        { type: String, required: true },
  state:       { type: String, required: true },
  pincode:     { type: String, required: true },
  country:     { type: String, default: 'India' },
  isDefault:   { type: Boolean, default: false },
  type:        { type: String, enum: ['home', 'work', 'other'], default: 'home' },
}, { _id: true });

/**
 * Main User schema
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'],
      sparse: true,
    },
    passwordHash: {
      type: String,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    avatar: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    // OTP for phone/email login
    otp: {
      code:      { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
    // Refresh token storage
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },
    isVerified:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    sellerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.otp;
        return ret;
      },
    },
  }
);

// ───────── Pre-save: hash password ─────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ───────── Instance methods ─────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.generateOtp = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code,
    expiresAt: new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000),
  };
  return code;
};

userSchema.methods.verifyOtp = function (code) {
  return this.otp?.code === code && this.otp?.expiresAt > new Date();
};

module.exports = mongoose.model('User', userSchema);
