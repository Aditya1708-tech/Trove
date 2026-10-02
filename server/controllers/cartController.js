const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper: get the cart for logged-in user or guest session
 */
const getCartQuery = (req) => {
  if (req.user) return { user: req.user._id };
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  if (!sessionId) throw new AppError('Session ID required for guest cart', 400);
  return { sessionId };
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/cart
// @access  Public (guest with session) / Private (logged-in)
// @desc    Get current cart with populated products
// ─────────────────────────────────────────────────────────────────────
exports.getCart = asyncHandler(async (req, res) => {
  const query = getCartQuery(req);
  const cart = await Cart.findOne(query).populate({
    path: 'items.product',
    select: 'name slug images variants brand seller isActive',
    populate: { path: 'seller', select: 'businessName displayName' },
  });

  if (!cart) {
    return res.json({ status: 'success', data: { cart: { items: [], total: 0 } } });
  }

  // Filter out items whose products are no longer active
  const activeItems = cart.items.filter(
    (item) => item.product?.isActive !== false
  );

  // Calculate totals
  const totals = activeItems.reduce(
    (acc, item) => {
      const variant = item.product?.variants?.id?.(item.variantId);
      if (variant) {
        acc.itemsTotal += variant.price * item.quantity;
        acc.mrpTotal   += variant.mrp   * item.quantity;
        acc.savings    += (variant.mrp - variant.price) * item.quantity;
      }
      return acc;
    },
    { itemsTotal: 0, mrpTotal: 0, savings: 0 }
  );

  totals.shippingCharges = totals.itemsTotal > 499 ? 0 : 40;
  totals.total = totals.itemsTotal + totals.shippingCharges;

  res.json({
    status: 'success',
    data: {
      cart: {
        _id:     cart._id,
        items:   activeItems,
        appliedCoupon: cart.appliedCoupon,
        ...totals,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/cart/add
// @access  Public / Private
// @desc    Add an item to cart (or increase quantity)
// ─────────────────────────────────────────────────────────────────────
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId || !variantId) {
    throw new AppError('productId and variantId are required', 400);
  }

  // Validate product and variant
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError('Product not found', 404);

  const variant = product.variants.id(variantId);
  if (!variant || !variant.isActive) throw new AppError('Variant not available', 404);
  if (variant.stock < quantity) {
    throw new AppError(`Only ${variant.stock} unit(s) in stock`, 400);
  }

  const cartQuery = getCartQuery(req);
  let cart = await Cart.findOne(cartQuery);

  if (!cart) {
    cart = new Cart(cartQuery);
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (i) =>
      i.product.toString() === productId &&
      i.variantId.toString() === variantId &&
      !i.isSavedForLater
  );

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + Number(quantity);
    if (newQty > 10) throw new AppError('Cannot add more than 10 of the same item', 400);
    if (newQty > variant.stock) throw new AppError(`Only ${variant.stock} in stock`, 400);
    cart.items[existingItemIndex].quantity = newQty;
  } else {
    cart.items.push({ product: productId, variantId, quantity: Number(quantity) });
  }

  await cart.save();
  res.json({ status: 'success', message: 'Added to cart', data: { itemCount: cart.items.filter(i => !i.isSavedForLater).length } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/cart/update
// @access  Public / Private
// @desc    Update item quantity in cart
// ─────────────────────────────────────────────────────────────────────
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;
  if (!itemId || quantity === undefined) {
    throw new AppError('itemId and quantity are required', 400);
  }

  const cartQuery = getCartQuery(req);
  const cart = await Cart.findOne(cartQuery);
  if (!cart) throw new AppError('Cart not found', 404);

  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);

  if (quantity <= 0) {
    item.remove();
  } else {
    // Validate stock
    const product = await Product.findById(item.product);
    const variant = product?.variants?.id(item.variantId);
    if (variant && quantity > variant.stock) {
      throw new AppError(`Only ${variant.stock} unit(s) available`, 400);
    }
    item.quantity = Math.min(quantity, 10);
  }

  await cart.save();
  res.json({ status: 'success', message: 'Cart updated' });
});

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/cart/:itemId
// @access  Public / Private
// @desc    Remove item from cart
// ─────────────────────────────────────────────────────────────────────
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cartQuery = getCartQuery(req);
  const cart = await Cart.findOne(cartQuery);
  if (!cart) throw new AppError('Cart not found', 404);

  cart.items = cart.items.filter(
    (i) => i._id.toString() !== req.params.itemId
  );

  await cart.save();
  res.json({ status: 'success', message: 'Item removed from cart' });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/cart/:itemId/save-for-later
// @access  Private
// @desc    Toggle save-for-later on a cart item
// ─────────────────────────────────────────────────────────────────────
exports.saveForLater = asyncHandler(async (req, res) => {
  const cartQuery = getCartQuery(req);
  const cart = await Cart.findOne(cartQuery);
  if (!cart) throw new AppError('Cart not found', 404);

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new AppError('Item not found in cart', 404);

  item.isSavedForLater = !item.isSavedForLater;
  await cart.save();

  res.json({
    status: 'success',
    message: item.isSavedForLater ? 'Saved for later' : 'Moved to cart',
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/cart/apply-coupon
// @access  Private
// @desc    Apply a coupon to the cart
// ─────────────────────────────────────────────────────────────────────
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError('Coupon code is required', 400);

  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({
    code:      code.toUpperCase(),
    isActive:  true,
    expiryDate: { $gt: new Date() },
  });

  if (!coupon) throw new AppError('Invalid or expired coupon', 400);

  const cartQuery = getCartQuery(req);
  const cart = await Cart.findOne(cartQuery).populate('items.product');
  if (!cart) throw new AppError('Cart not found', 404);

  // Calculate cart total
  const itemsTotal = cart.items
    .filter((i) => !i.isSavedForLater)
    .reduce((sum, item) => {
      const variant = item.product?.variants?.id(item.variantId);
      return sum + (variant?.price || 0) * item.quantity;
    }, 0);

  if (itemsTotal < coupon.minOrderValue) {
    throw new AppError(`Minimum order value ₹${coupon.minOrderValue} required for this coupon`, 400);
  }

  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else {
    discount = Math.round((itemsTotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  cart.appliedCoupon = { code: coupon.code, discount };
  await cart.save();

  res.json({
    status: 'success',
    message: `Coupon applied! You save ₹${discount}`,
    data: { discount, couponCode: coupon.code },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/cart/coupon
// @access  Private
// @desc    Remove applied coupon
// ─────────────────────────────────────────────────────────────────────
exports.removeCoupon = asyncHandler(async (req, res) => {
  const cartQuery = getCartQuery(req);
  await Cart.findOneAndUpdate(cartQuery, { $unset: { appliedCoupon: '' } });
  res.json({ status: 'success', message: 'Coupon removed' });
});
