const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/users/wishlist
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'name slug images variants ratingsAverage discountPercent brand',
    populate: { path: 'seller', select: 'businessName displayName' },
  });

  res.json({ status: 'success', data: { wishlist: user.wishlist } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/users/wishlist/:productId
// @access  Private
// @desc    Add product to wishlist (toggle)
// ─────────────────────────────────────────────────────────────────────
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const user = await User.findById(req.user._id);
  const isInWishlist = user.wishlist.some((id) => id.toString() === productId);

  if (isInWishlist) {
    user.wishlist.pull(productId);
  } else {
    user.wishlist.push(productId);
  }

  await user.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    message: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist',
    data: { inWishlist: !isInWishlist },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/users/addresses
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.json({ status: 'success', data: { addresses: user.addresses } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/users/addresses
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, type, isDefault } = req.body;

  const user = await User.findById(req.user._id);

  // If setting as default, clear existing default
  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push({ fullName, phone, addressLine1, addressLine2, city, state, pincode, type, isDefault });

  // Auto-set first address as default
  if (user.addresses.length === 1) {
    user.addresses[0].isDefault = true;
  }

  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 'success',
    data: { address: user.addresses[user.addresses.length - 1] },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/users/addresses/:addressId
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new AppError('Address not found', 404);

  const fields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'type'];
  fields.forEach((f) => { if (req.body[f] !== undefined) address[f] = req.body[f]; });

  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }

  await user.save({ validateBeforeSave: false });
  res.json({ status: 'success', data: { address } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new AppError('Address not found', 404);

  address.deleteOne();
  await user.save({ validateBeforeSave: false });

  res.json({ status: 'success', message: 'Address deleted' });
});

// ─────────────────────────────────────────────────────────────────────
// ADMIN: User management
// ─────────────────────────────────────────────────────────────────────

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({ status: 'success', data: { users, pagination: { page: Number(page), limit: Number(limit), total } } });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot deactivate admin accounts', 403);

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({ status: 'success', message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});
