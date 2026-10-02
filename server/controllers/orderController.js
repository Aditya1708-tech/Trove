const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { createRazorpayOrder, verifyPaymentSignature } = require('../config/razorpay');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/orders
// @access  Private (customer)
// @desc    Create an order from the user's cart
// ─────────────────────────────────────────────────────────────────────
exports.createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod, couponCode, deliverySlot } = req.body;

  if (!addressId || !paymentMethod) {
    throw new AppError('Address and payment method are required', 400);
  }

  // ── Fetch user's address ──
  const user = req.user;
  const address = user.addresses.id(addressId);
  if (!address) throw new AppError('Address not found', 404);

  // ── Fetch cart ──
  const cart = await Cart.findOne({ user: user._id }).populate({
    path: 'items.product',
    populate: { path: 'seller', select: '_id businessName' },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  const activeItems = cart.items.filter((i) => !i.isSavedForLater);
  if (activeItems.length === 0) throw new AppError('No items in cart', 400);

  // ── Validate stock and build order items ──
  const orderItems = [];
  let itemsTotal = 0;

  for (const cartItem of activeItems) {
    const product = cartItem.product;
    if (!product || !product.isActive) {
      throw new AppError(`Product "${product?.name || 'unknown'}" is no longer available`, 400);
    }

    const variant = product.variants.id(cartItem.variantId);
    if (!variant || !variant.isActive) {
      throw new AppError(`Selected variant of "${product.name}" is unavailable`, 400);
    }

    if (variant.stock < cartItem.quantity) {
      throw new AppError(
        `Only ${variant.stock} unit(s) of "${product.name}" available in stock`,
        400
      );
    }

    const lineTotal = variant.price * cartItem.quantity;
    itemsTotal += lineTotal;

    orderItems.push({
      product:   product._id,
      seller:    product.seller._id,
      variantId: variant._id,
      name:      product.name,
      image:     product.images?.[0]?.url || '',
      price:     variant.price,
      mrp:       variant.mrp,
      size:      variant.size,
      color:     variant.color,
      sku:       variant.sku,
      quantity:  cartItem.quantity,
    });
  }

  // ── Validate and apply coupon ──
  let couponDiscount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() },
    });

    if (!coupon) throw new AppError('Invalid or expired coupon code', 400);
    if (itemsTotal < coupon.minOrderValue) {
      throw new AppError(`Minimum order value for this coupon is ₹${coupon.minOrderValue}`, 400);
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 400);
    }

    const userUsage = coupon.usedBy.find((u) => u.user.toString() === user._id.toString());
    if (userUsage && userUsage.count >= coupon.usagePerUser) {
      throw new AppError('You have already used this coupon the maximum number of times', 400);
    }

    if (coupon.discountType === 'flat') {
      couponDiscount = coupon.discountValue;
    } else {
      couponDiscount = Math.round((itemsTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
      }
    }
    appliedCoupon = coupon;
  }

  // ── Shipping & tax ──
  const shippingCharges = itemsTotal > 499 ? 0 : 40;
  const taxAmount = 0; // GST embedded in price (India B2C)
  const totalAmount = Math.max(0, itemsTotal - couponDiscount + shippingCharges);

  // ── Create order document ──
  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 4);

  const order = new Order({
    user: user._id,
    items: orderItems,
    shippingAddress: {
      fullName:     address.fullName,
      phone:        address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city:         address.city,
      state:        address.state,
      pincode:      address.pincode,
      country:      address.country,
    },
    paymentMethod,
    itemsTotal,
    shippingCharges,
    couponCode:     appliedCoupon?.code,
    couponDiscount,
    taxAmount,
    totalAmount,
    deliverySlot,
    expectedDelivery,
    statusHistory: [{ status: 'placed', message: 'Order placed successfully' }],
  });

  // ── For Razorpay: create payment order BEFORE saving our order ──
  let razorpayOrder = null;
  if (paymentMethod === 'razorpay') {
    razorpayOrder = await createRazorpayOrder(
      totalAmount * 100, // paise
      `receipt_${Date.now()}`,
      { userId: user._id.toString() }
    );
    order.razorpayOrderId = razorpayOrder.id;
  } else {
    // COD: mark as confirmed immediately
    order.paymentStatus = 'pending';
    order.orderStatus = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', message: 'Order confirmed (Cash on Delivery)' });
  }

  await order.save();

  // ── Deduct stock ──
  for (const item of orderItems) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'variants._id': item.variantId },
      {
        $inc: {
          'variants.$.stock': -item.quantity,
          soldCount: item.quantity,
        },
      }
    );
  }

  // ── Update coupon usage ──
  if (appliedCoupon) {
    const existingUse = appliedCoupon.usedBy.find(
      (u) => u.user.toString() === user._id.toString()
    );
    if (existingUse) {
      existingUse.count += 1;
    } else {
      appliedCoupon.usedBy.push({ user: user._id });
    }
    appliedCoupon.usageCount += 1;
    await appliedCoupon.save();
  }

  // ── Clear cart (remove active items, keep saved-for-later) ──
  cart.items = cart.items.filter((i) => i.isSavedForLater);
  cart.appliedCoupon = undefined;
  await cart.save();

  res.status(201).json({
    status: 'success',
    data: {
      order: {
        _id:           order._id,
        orderNumber:   order.orderNumber,
        totalAmount:   order.totalAmount,
        paymentMethod: order.paymentMethod,
        orderStatus:   order.orderStatus,
        expectedDelivery: order.expectedDelivery,
      },
      // Razorpay fields needed by frontend
      ...(razorpayOrder && {
        razorpay: {
          orderId:   razorpayOrder.id,
          amount:    razorpayOrder.amount,
          currency:  razorpayOrder.currency,
          keyId:     process.env.RAZORPAY_KEY_ID,
        },
      }),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/orders/verify-payment
// @access  Private
// @desc    Verify Razorpay payment and update order
// ─────────────────────────────────────────────────────────────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('All payment fields are required', 400);
  }

  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    throw new AppError('Payment verification failed. Possible fraud attempt.', 400);
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new AppError('Order not found', 404);

  order.paymentStatus     = 'paid';
  order.razorpayPaymentId = razorpayPaymentId;
  order.razorpaySignature = razorpaySignature;
  order.orderStatus       = 'confirmed';
  order.statusHistory.push({
    status:  'confirmed',
    message: 'Payment received. Order confirmed.',
  });

  await order.save();

  res.json({
    status: 'success',
    message: 'Payment verified successfully',
    data: { orderNumber: order.orderNumber, orderStatus: order.orderStatus },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/orders
// @access  Private (customer)
// @desc    Get current user's orders
// ─────────────────────────────────────────────────────────────────────
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.orderStatus = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-razorpaySignature')
      .populate('items.product', 'name slug images'),
    Order.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      orders,
      pagination: { page: Number(page), limit: Number(limit), total },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/:id
// @access  Private
// @desc    Get single order detail
// ─────────────────────────────────────────────────────────────────────
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'name slug images ratingsAverage')
    .populate('items.seller', 'businessName displayName')
    .select('-razorpaySignature');

  if (!order) throw new AppError('Order not found', 404);

  // Customers can only see their own orders
  if (req.user.role === 'customer' && order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this order', 403);
  }

  res.json({ status: 'success', data: { order } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/orders/:id/cancel
// @access  Private (customer)
// @desc    Cancel an order (only if not shipped yet)
// ─────────────────────────────────────────────────────────────────────
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new AppError('Order not found', 404);

  const cancellableStatuses = ['placed', 'confirmed', 'packed'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  order.orderStatus        = 'cancelled';
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({
    status:  'cancelled',
    message: order.cancellationReason,
    updatedBy: req.user._id,
  });

  // Restock items
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'variants._id': item.variantId },
      { $inc: { 'variants.$.stock': item.quantity, soldCount: -item.quantity } }
    );
  }

  // Handle refund for paid orders
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
    order.refundAmount  = order.totalAmount;
    order.refundedAt    = new Date();
    // TODO: trigger actual Razorpay refund via API
  }

  await order.save();
  res.json({ status: 'success', message: 'Order cancelled successfully', data: { order } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/orders/:id/status  [admin/seller]
// @access  Private
// @desc    Update order status (admin/seller)
// ─────────────────────────────────────────────────────────────────────
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const validStatuses = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  order.orderStatus = status;
  order.statusHistory.push({ status, message: message || `Order ${status}`, updatedBy: req.user._id });

  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
  }

  await order.save();
  res.json({ status: 'success', data: { order } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/admin/all  [admin]
// @access  Private (admin)
// @desc    Get all orders (admin dashboard)
// ─────────────────────────────────────────────────────────────────────
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   query.createdAt.$lte = new Date(dateTo);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email phone')
      .select('-razorpaySignature'),
    Order.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: { orders, pagination: { page: Number(page), limit: Number(limit), total } },
  });
});
