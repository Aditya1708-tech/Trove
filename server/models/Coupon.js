const mongoose = require('mongoose');

/**
 * Coupon schema — supports flat and percentage discounts
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, 'Code cannot exceed 30 characters'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    discountType: {
      type: String,
      enum: ['flat', 'percent'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value must be positive'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // applies only for 'percent' type (cap the discount)
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    // Category or product restrictions (empty = applicable to all)
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    // Usage limits
    usageLimit:    { type: Number, default: null }, // null = unlimited
    usagePerUser:  { type: Number, default: 1 },
    usageCount:    { type: Number, default: 0 },
    // Validity
    startDate:  { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    // Who used it
    usedBy: [
      {
        user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
        count:  { type: Number, default: 1 },
      },
    ],
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ───────── Virtual: isExpired ─────────
couponSchema.virtual('isExpired').get(function () {
  return this.expiryDate < new Date();
});

// ───────── Indexes ─────────
couponSchema.index({ expiryDate: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
