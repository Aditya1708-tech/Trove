const mongoose = require('mongoose');

/**
 * Order item sub-schema
 */
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  // Snapshot fields — stored at time of order (in case product changes later)
  name:       { type: String, required: true },
  image:      { type: String, required: true },
  price:      { type: Number, required: true }, // final price after discount
  mrp:        { type: Number, required: true },
  size:       { type: String },
  color:      { type: String },
  sku:        { type: String },
  quantity:   { type: Number, required: true, min: 1 },
  // Per-item return/cancel status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'return_requested', 'returned'],
    default: 'active',
  },
}, { _id: true });

/**
 * Status history entry
 */
const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  message:   { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

/**
 * Main Order schema
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },
    // Snapshot of the shipping address
    shippingAddress: {
      fullName:     { type: String, required: true },
      phone:        { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city:         { type: String, required: true },
      state:        { type: String, required: true },
      pincode:      { type: String, required: true },
      country:      { type: String, default: 'India' },
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod', 'wallet'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    // Razorpay fields
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String, select: false },
    // Shiprocket fields
    shiprocketOrderId:    { type: String },
    shiprocketShipmentId: { type: String },
    trackingUrl:          { type: String },
    awbCode:              { type: String }, // air waybill code
    // Order status
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned'],
      default: 'placed',
    },
    statusHistory: [statusHistorySchema],
    // Pricing breakdown
    itemsTotal:       { type: Number, required: true }, // sum of (price × qty)
    shippingCharges:  { type: Number, default: 0 },
    discount:         { type: Number, default: 0 }, // coupon discount
    taxAmount:        { type: Number, default: 0 },
    totalAmount:      { type: Number, required: true }, // final payable amount
    couponCode:       { type: String, uppercase: true },
    couponDiscount:   { type: Number, default: 0 },
    // COD confirmation
    isCodConfirmed:   { type: Boolean, default: false },
    // Delivery slot
    deliverySlot: {
      date:    { type: Date },
      timeSlot:{ type: String }, // e.g. "9AM - 1PM"
    },
    // Cancellation/return
    cancellationReason: { type: String },
    returnReason:       { type: String },
    returnImages:       [{ url: String }],
    refundAmount:       { type: Number, default: 0 },
    refundedAt:         { type: Date },
    // Expected delivery date
    expectedDelivery:   { type: Date },
    deliveredAt:        { type: Date },
  },
  { timestamps: true }
);

// ───────── Pre-save: generate order number ─────────
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `TRV${Date.now().toString().slice(-6)}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ───────── Indexes ─────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Order', orderSchema);
