const mongoose = require('mongoose');

/**
 * Review schema — verified-purchase product reviews with optional photos
 */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    images: [
      {
        url:      { type: String },
        publicId: { type: String },
      },
    ],
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Helpfulness votes
    helpful: {
      count: { type: Number, default: 0 },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    // Admin moderation
    isApproved: { type: Boolean, default: true },
    isHidden:   { type: Boolean, default: false },
    // Seller response
    sellerResponse: {
      comment:     { type: String, maxlength: 1000 },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// ───────── One review per user per product ─────────
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ product: 1, createdAt: -1 });

// ───────── Post-save: update product ratings aggregate ─────────
const updateProductRating = async (productId) => {
  const Product = mongoose.model('Product');
  const result = await mongoose.model('Review').aggregate([
    { $match: { product: productId, isApproved: true, isHidden: false } },
    {
      $group: {
        _id: '$product',
        ratingsAverage: { $avg: '$rating' },
        ratingsCount:   { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: result[0].ratingsAverage,
      ratingsCount:   result[0].ratingsCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsCount:   0,
    });
  }
};

reviewSchema.post('save', async function () {
  await updateProductRating(this.product);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updateProductRating(doc.product);
});

reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) await updateProductRating(doc.product);
});

module.exports = mongoose.model('Review', reviewSchema);
