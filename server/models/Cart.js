const mongoose = require('mongoose');

/**
 * Cart item sub-schema
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Cannot add more than 10 of the same item'],
    default: 1,
  },
  isSavedForLater: {
    type: Boolean,
    default: false,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

/**
 * Cart schema — supports both guest (sessionId) and authenticated (user) carts
 * Guest carts are merged into user cart on login.
 */
const cartSchema = new mongoose.Schema(
  {
    // Exactly one of user or sessionId must be set
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    sessionId: {
      type: String,
      sparse: true,
    },
    items: [cartItemSchema],
    // Applied coupon (before order is placed)
    appliedCoupon: {
      code:     { type: String },
      discount: { type: Number, default: 0 },
    },
    // Cart expires after 30 days of inactivity (for guests)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// ───────── Indexes ─────────
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for guests

module.exports = mongoose.model('Cart', cartSchema);
