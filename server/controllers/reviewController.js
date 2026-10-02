const Review = require('../models/Review');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/products/:productId/reviews
// @access  Public
// @desc    Get reviews for a product (paginated)
// ─────────────────────────────────────────────────────────────────────
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest', rating } = req.query;

  const query = {
    product:    req.params.productId,
    isApproved: true,
    isHidden:   false,
  };
  if (rating) query.rating = Number(rating);

  const sortMap = {
    newest:   { createdAt: -1 },
    helpful:  { 'helpful.count': -1 },
    rating_h: { rating: -1 },
    rating_l: { rating: 1 },
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name avatar')
      .lean(),
    Review.countDocuments(query),
  ]);

  // Ratings distribution
  const distribution = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  res.json({
    status: 'success',
    data: {
      reviews,
      distribution,
      pagination: { page: Number(page), limit: Number(limit), total },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/products/:productId/reviews
// @access  Private
// @desc    Add a review (verified purchase check)
// ─────────────────────────────────────────────────────────────────────
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, orderId } = req.body;

  // Check for existing review from this user for this product
  const existing = await Review.findOne({
    user:    req.user._id,
    product: req.params.productId,
  });
  if (existing) throw new AppError('You have already reviewed this product', 400);

  // Check if it's a verified purchase
  let verifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id:           orderId,
      user:          req.user._id,
      'items.product': req.params.productId,
      orderStatus:   'delivered',
    });
    verifiedPurchase = !!order;
  } else {
    // Check any delivered order with this product
    const order = await Order.findOne({
      user:            req.user._id,
      'items.product': req.params.productId,
      orderStatus:     'delivered',
    });
    verifiedPurchase = !!order;
  }

  // Build review images from uploaded files
  const images = (req.files || []).map((file) => ({
    url:      file.path,
    publicId: file.filename,
  }));

  const review = await Review.create({
    user:             req.user._id,
    product:          req.params.productId,
    order:            orderId,
    rating:           Number(rating),
    title,
    comment,
    images,
    verifiedPurchase,
  });

  await review.populate('user', 'name avatar');

  res.status(201).json({ status: 'success', data: { review } });
});

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/reviews/:id/helpful
// @access  Private
// @desc    Mark review as helpful (toggle)
// ─────────────────────────────────────────────────────────────────────
exports.markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const userId = req.user._id;
  const alreadyMarked = review.helpful.users.some(
    (u) => u.toString() === userId.toString()
  );

  if (alreadyMarked) {
    review.helpful.users.pull(userId);
    review.helpful.count = Math.max(0, review.helpful.count - 1);
  } else {
    review.helpful.users.push(userId);
    review.helpful.count += 1;
  }

  await review.save();
  res.json({
    status: 'success',
    data: { helpful: review.helpful.count, marked: !alreadyMarked },
  });
});

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/reviews/:id
// @access  Private (owner or admin)
// @desc    Delete a review
// ─────────────────────────────────────────────────────────────────────
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  if (
    req.user.role !== 'admin' &&
    review.user.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to delete this review', 403);
  }

  await review.deleteOne();
  res.json({ status: 'success', message: 'Review deleted' });
});
