const mongoose = require('mongoose');

/**
 * Category schema — supports nested categories (parent/child)
 * e.g. Electronics > Smartphones > Android Phones
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    icon: {
      type: String, // emoji or icon class name
      default: '🛍️',
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // null = top-level category
    },
    // Cached list of ancestor IDs for efficient tree queries
    ancestors: [
      {
        _id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        name: String,
        slug: String,
      },
    ],
    level: {
      type: Number,
      default: 0, // 0 = root, 1 = sub, 2 = sub-sub
    },
    order:      { type: Number, default: 0 }, // display order
    isFeatured: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    // SEO
    metaTitle:       { type: String, maxlength: 120 },
    metaDescription: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ───────── Virtual: children ─────────
// (not stored, computed when populated)
categorySchema.virtual('children', {
  ref:          'Category',
  localField:   '_id',
  foreignField: 'parentCategory',
});

// ───────── Indexes ─────────
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
