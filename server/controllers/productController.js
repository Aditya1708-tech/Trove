const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/products
// @access  Public
// @desc    List products with filtering, sorting, and pagination
// ─────────────────────────────────────────────────────────────────────
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    discount,
    sort = '-createdAt',
    search,
    isFeatured,
    isBestSeller,
    isNewArrival,
    seller,
    inStock,
  } = req.query;

  const query = { isActive: true };

  // ── Category filter ──
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) query.category = cat._id;
  }
  if (subcategory) {
    const subCat = await Category.findOne({ slug: subcategory });
    if (subCat) query.subCategory = subCat._id;
  }

  // ── Brand filter ──
  if (brand) {
    query.brand = { $in: brand.split(',').map((b) => new RegExp(b.trim(), 'i')) };
  }

  // ── Price range filter (on variants) ──
  if (minPrice || maxPrice) {
    query['variants.price'] = {};
    if (minPrice) query['variants.price'].$gte = Number(minPrice);
    if (maxPrice) query['variants.price'].$lte = Number(maxPrice);
  }

  // ── Rating filter ──
  if (minRating) {
    query.ratingsAverage = { $gte: Number(minRating) };
  }

  // ── Discount filter ──
  if (discount) {
    query.discountPercent = { $gte: Number(discount) };
  }

  // ── Feature flags ──
  if (isFeatured   === 'true') query.isFeatured   = true;
  if (isBestSeller === 'true') query.isBestSeller = true;
  if (isNewArrival === 'true') query.isNewArrival = true;

  // ── Seller filter ──
  if (seller) query.seller = seller;

  // ── In-stock filter ──
  if (inStock === 'true') {
    query['variants.stock'] = { $gt: 0 };
  }

  // ── Full-text search ──
  if (search) {
    query.$text = { $search: search };
  }

  // ── Sort mapping ──
  const sortMap = {
    price_asc:    { 'variants.price': 1 },
    price_desc:   { 'variants.price': -1 },
    rating:       { ratingsAverage: -1 },
    popular:      { soldCount: -1 },
    newest:       { createdAt: -1 },
    discount:     { discountPercent: -1 },
    relevance:    search ? { score: { $meta: 'textScore' } } : { soldCount: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'businessName displayName rating')
      .select('-specifications -description')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: skip + products.length < total,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/products/:slug
// @access  Public
// @desc    Get single product by slug
// ─────────────────────────────────────────────────────────────────────
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug ancestors')
    .populate('subCategory', 'name slug')
    .populate('seller', 'businessName displayName rating logo');

  if (!product) throw new AppError('Product not found', 404);

  // Increment view count (fire-and-forget)
  Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

  res.json({ status: 'success', data: { product } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/products/:id/similar
// @access  Public
// @desc    Get similar products (same category, excluding current)
// ─────────────────────────────────────────────────────────────────────
exports.getSimilarProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('category brand');
  if (!product) throw new AppError('Product not found', 404);

  const similar = await Product.find({
    _id:      { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .populate('seller', 'businessName displayName')
    .select('name slug images variants ratingsAverage discountPercent brand')
    .limit(12)
    .lean();

  res.json({ status: 'success', data: { products: similar } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/products/search/autocomplete
// @access  Public
// @desc    Autocomplete suggestions for search bar
// ─────────────────────────────────────────────────────────────────────
exports.autocomplete = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ status: 'success', data: { suggestions: [] } });
  }

  const products = await Product.find({
    name: { $regex: q, $options: 'i' },
    isActive: true,
  })
    .select('name slug images brand')
    .limit(8)
    .lean();

  const brands = await Product.distinct('brand', {
    brand: { $regex: q, $options: 'i' },
    isActive: true,
  }).limit(3);

  res.json({
    status: 'success',
    data: {
      suggestions: products.map((p) => ({
        type:  'product',
        label: p.name,
        slug:  p.slug,
        image: p.images?.[0]?.url,
        brand: p.brand,
      })),
      brands: brands.slice(0, 3),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/products  [admin/seller]
// @access  Private (seller, admin)
// @desc    Create a new product
// ─────────────────────────────────────────────────────────────────────
exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name, description, shortDescription, category, subCategory,
    brand, variants, highlights, specifications, tags,
    isFeatured, weight, dimensions,
  } = req.body;

  // Build images array from uploaded files
  const images = (req.files || []).map((file, idx) => ({
    url:       file.path,
    publicId:  file.filename,
    alt:       `${name} image ${idx + 1}`,
    isPrimary: idx === 0,
  }));
  if (images.length === 0 && req.body.imageUrl) {
    images.push({ url: req.body.imageUrl, alt: `${name} image`, isPrimary: true });
  }

  // Determine seller: sellers use their own profile; admins can specify
  let sellerId;
  if (req.user.role === 'seller') {
    const { Seller } = require('../models/Seller');
    const sellerDoc = await require('../models/Seller').findOne({ user: req.user._id });
    if (!sellerDoc) throw new AppError('Seller profile not found', 404);
    sellerId = sellerDoc._id;
  } else {
    sellerId = req.body.seller;
    if (!sellerId) throw new AppError('Seller ID is required', 400);
  }

  // Parse variants (may come as JSON string from multipart form)
  const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;

  // Calculate aggregate discount from first variant
  const firstVariant = parsedVariants[0];
  const discountPercent = firstVariant?.mrp
    ? Math.round(((firstVariant.mrp - firstVariant.price) / firstVariant.mrp) * 100)
    : 0;

  const product = await Product.create({
    name,
    description,
    shortDescription,
    category,
    subCategory,
    seller: sellerId,
    brand,
    images,
    variants: parsedVariants,
    highlights: typeof highlights === 'string' ? JSON.parse(highlights) : highlights,
    specifications: typeof specifications === 'string' ? JSON.parse(specifications) : specifications,
    tags: typeof tags === 'string' ? JSON.parse(tags) : tags,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    weight,
    dimensions: typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions,
    discountPercent,
  });

  res.status(201).json({ status: 'success', data: { product } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   PATCH /api/products/:id  [admin/seller]
// @access  Private
// @desc    Update a product
// ─────────────────────────────────────────────────────────────────────
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  // Sellers can only update their own products
  if (req.user.role === 'seller') {
    const sellerDoc = await require('../models/Seller').findOne({ user: req.user._id });
    if (!sellerDoc || product.seller.toString() !== sellerDoc._id.toString()) {
      throw new AppError('Not authorized to update this product', 403);
    }
  }

  const allowedUpdates = [
    'name', 'description', 'shortDescription', 'brand', 'variants',
    'highlights', 'specifications', 'tags', 'isFeatured', 'isActive',
    'weight', 'dimensions', 'category', 'subCategory',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      let val = req.body[field];
      if (['variants', 'highlights', 'specifications', 'tags', 'dimensions'].includes(field) && typeof val === 'string') {
        val = JSON.parse(val);
      }
      product[field] = val;
    }
  });

  // Handle new images
  if (req.files?.length > 0) {
    const newImages = req.files.map((file, idx) => ({
      url:      file.path,
      publicId: file.filename,
      alt:      `${product.name} image`,
      isPrimary: product.images.length === 0 && idx === 0,
    }));
    product.images.push(...newImages);
  }

  await product.save();
  res.json({ status: 'success', data: { product } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/products/:id  [admin/seller]
// @access  Private
// @desc    Soft-delete a product (set isActive = false)
// ─────────────────────────────────────────────────────────────────────
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  product.isActive = false;
  await product.save();

  res.json({ status: 'success', message: 'Product deactivated' });
});

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/products/pincode-estimate
// @access  Public
// @desc    Get delivery estimate for a pincode (mock logic)
// ─────────────────────────────────────────────────────────────────────
exports.deliveryEstimate = asyncHandler(async (req, res) => {
  const { pincode } = req.query;

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    throw new AppError('Valid 6-digit pincode is required', 400);
  }

  // Mock delivery estimate logic
  const firstDigit = pincode[0];
  const metroZones = ['1', '2', '4', '5', '6']; // Delhi, Mumbai, Bangalore, etc.
  const isMetro = metroZones.includes(firstDigit);

  const today = new Date();
  const minDays = isMetro ? 2 : 4;
  const maxDays = isMetro ? 4 : 7;

  const minDate = new Date(today);
  const maxDate = new Date(today);
  minDate.setDate(today.getDate() + minDays);
  maxDate.setDate(today.getDate() + maxDays);

  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  res.json({
    status: 'success',
    data: {
      pincode,
      deliveryBy: `${formatDate(minDate)} – ${formatDate(maxDate)}`,
      isCodAvailable: true,
      isFreeShipping: true,
      shippingCharge: 0,
    },
  });
});
