const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, category, status = 'all' } = req.query;
  const query = {};
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (category) query.category = category;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { brand: { $regex: search, $options: 'i' } },
    { sku: { $regex: search, $options: 'i' } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'businessName displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  res.json({ status: 'success', data: { products, pagination: { page: Number(page), limit: Number(limit), total } } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/admin/dashboard
// @access  Private (admin)
// @desc    Sales analytics dashboard data
// ─────────────────────────────────────────────────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    monthOrders,
    totalUsers,
    monthUsers,
    totalProducts,
    recentOrders,
    topProducts,
    ordersByStatus,
    revenueByDay,
  ] = await Promise.all([
    // Total revenue (all-time paid orders)
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    // This month's revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    // Last month's revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startOfMonth } }),
    Product.countDocuments({ isActive: true }),
    // Recent orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('orderNumber user totalAmount orderStatus createdAt'),
    // Top selling products
    Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name slug images soldCount ratingsAverage'),
    // Orders by status
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    // Revenue by day (last 30 days)
    Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const thisMonthRevenue = monthRevenue[0]?.total || 0;
  const prevMonthRevenue = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = prevMonthRevenue
    ? (((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
    : 100;

  res.json({
    status: 'success',
    data: {
      stats: {
        totalRevenue:   totalRevenue[0]?.total || 0,
        monthRevenue:   thisMonthRevenue,
        revenueGrowth:  Number(revenueGrowth),
        totalOrders,
        monthOrders,
        totalUsers,
        monthUsers,
        totalProducts,
      },
      recentOrders,
      topProducts,
      ordersByStatus,
      revenueByDay,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// Category management
// ─────────────────────────────────────────────────────────────────────
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('parentCategory', 'name slug')
    .sort({ level: 1, order: 1 });
  res.json({ status: 'success', data: { categories } });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, parentCategory, icon, order, isFeatured } = req.body;

  let level = 0;
  let ancestors = [];

  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) throw new AppError('Parent category not found', 404);
    level = parent.level + 1;
    ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name, slug: parent.slug }];
  }

  const image = req.file
    ? { url: req.file.path, publicId: req.file.filename }
    : {};

  const category = await Category.create({
    name, slug, description, parentCategory, icon, order, isFeatured,
    level, ancestors, image,
  });

  res.status(201).json({ status: 'success', data: { category } });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const updates = req.body;
  if (req.file) {
    updates.image = { url: req.file.path, publicId: req.file.filename };
  }
  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ status: 'success', data: { category } });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const hasChildren = await Category.exists({ parentCategory: req.params.id });
  if (hasChildren) throw new AppError('Cannot delete category with sub-categories', 400);

  const hasProducts = await Product.exists({ category: req.params.id });
  if (hasProducts) throw new AppError('Cannot delete category with existing products', 400);

  await category.deleteOne();
  res.json({ status: 'success', message: 'Category deleted' });
});

// ─────────────────────────────────────────────────────────────────────
// Coupon management
// ─────────────────────────────────────────────────────────────────────
exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ status: 'success', data: { coupons } });
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ status: 'success', data: { coupon } });
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ status: 'success', data: { coupon } });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ status: 'success', message: 'Coupon deleted' });
});

// ─────────────────────────────────────────────────────────────────────
// Banner management
// ─────────────────────────────────────────────────────────────────────
exports.getBanners = asyncHandler(async (req, res) => {
  const { position } = req.query;
  const query = {};
  if (position) query.position = position;
  const banners = await Banner.find(query).sort({ order: 1 });
  res.json({ status: 'success', data: { banners } });
});

exports.createBanner = asyncHandler(async (req, res) => {
  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : req.body.image;
  const banner = await Banner.create({ ...req.body, image, createdBy: req.user._id });
  res.status(201).json({ status: 'success', data: { banner } });
});

exports.updateBanner = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.image = { url: req.file.path, publicId: req.file.filename };
  const banner = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!banner) throw new AppError('Banner not found', 404);
  res.json({ status: 'success', data: { banner } });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ status: 'success', message: 'Banner deleted' });
});

// ─────────────────────────────────────────────────────────────────────
// Low stock report
// ─────────────────────────────────────────────────────────────────────
exports.getLowStockReport = asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold || 10);

  const products = await Product.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$variants' },
    { $match: { 'variants.stock': { $lte: threshold } } },
    {
      $project: {
        name: 1,
        slug: 1,
        brand: 1,
        'variants.sku':   1,
        'variants.stock': 1,
        'variants.size':  1,
        'variants.color': 1,
      },
    },
    { $sort: { 'variants.stock': 1 } },
    { $limit: 50 },
  ]);

  res.json({ status: 'success', data: { products, threshold } });
});
