const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay instance (initialized lazily so missing env doesn't crash server)
let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise (INR × 100)
 * @param {string} receipt - Unique receipt ID (usually our DB order ID)
 * @param {object} notes - Optional metadata
 */
const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount,            // in paise
    currency: 'INR',
    receipt,
    notes,
    payment_capture: true,
  });
  return order;
};

/**
 * Verify Razorpay payment signature
 * Called after frontend sends paymentId, orderId, signature
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  getRazorpay,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
