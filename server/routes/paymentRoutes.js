const express = require('express');
const router = express.Router();
const { verifyWebhookSignature } = require('../config/razorpay');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   POST /api/payments/webhook
 * @access  Public (Razorpay server-to-server)
 * @desc    Razorpay webhook handler
 *
 * Razorpay sends webhooks for events like payment.captured, payment.failed, etc.
 * We verify the signature using the webhook secret and update order status.
 *
 * IMPORTANT: This route needs raw body, so it must be registered BEFORE
 * express.json() middleware (handled in server.js with rawBody).
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody; // set by rawBody middleware in server.js

    if (!signature || !body) {
      return res.status(400).json({ status: 'error', message: 'Missing signature or body' });
    }

    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.warn('⚠️  Invalid Razorpay webhook signature');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body;
    console.log('📦 Razorpay webhook event:', event.event);

    switch (event.event) {
      case 'payment.captured': {
        const { order_id, id: paymentId } = event.payload.payment.entity;
        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus     = 'paid';
          order.razorpayPaymentId = paymentId;
          order.orderStatus       = 'confirmed';
          order.statusHistory.push({
            status:  'confirmed',
            message: 'Payment captured via webhook',
          });
          await order.save();
        }
        break;
      }

      case 'payment.failed': {
        const { order_id } = event.payload.payment.entity;
        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (order) {
          order.paymentStatus = 'failed';
          order.statusHistory.push({ status: 'cancelled', message: 'Payment failed' });
          await order.save();
        }
        break;
      }

      case 'refund.created': {
        const { entity } = event.payload.refund;
        const order = await Order.findOne({ razorpayPaymentId: entity.payment_id });
        if (order) {
          order.paymentStatus = 'refunded';
          order.refundAmount  = entity.amount / 100;
          order.refundedAt    = new Date();
          await order.save();
        }
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }

    // Always respond 200 to Razorpay promptly
    res.json({ status: 'ok' });
  })
);

module.exports = router;
