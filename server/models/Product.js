const mongoose = require('mongoose');

/**
 * Product variant sub-schema
 * Each variant = a specific combination of size/color/etc with its own price & stock
 */
const variantSchema = new mongoose.Schema({
  sku:           { type: String, required: true, trim: true },
  size:          { type: String, trim: true },
  color:         { type: String, trim: true },
  colorHex:      { type: String, trim: true }, // e.g. "#FF5733"
  storage:       { type: String, trim: true }, // e.g. "128GB"
  material:      { type: String, trim: true },
  price:         { type: Number, required: true, min: 0 },
  mrp:           { type: Number, required: true, min: 0 }, // maximum retail price
  stock:         { type: Number, required: true, min: 0, default: 0 },
  images:        [{ url: String, publicId: String }], // variant-specific images
  isActive:      { type: Boolean, default: true },
}, { _id: true });

/**
 * Specification entry sub-schema (for specs table)
 */
const specSchema = new mongoose.Schema({
  key:   { type: String, required: true },
  value: { type: String, required: true },
  group: { type: String, default: 'General' }, // e.g. "Display", "Camera"
}, { _id: false });

/**
 * Main Product schema
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [500, 'Product name cannot exceed 500 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    // Primary images (shown in gallery)
    images: [
      {
        url:      { type: String, required: true },
        publicId: { type: String },
        alt:      { type: String, default: '' },
        isPrimary:{ type: Boolean, default: false },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller is required'],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
    },
    // Variants (size/color combos). At least one is required.
    variants: {
      type: [variantSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Product must have at least one variant',
      },
    },
    // Highlights: short bullet points shown at top of PDP
    highlights: [{ type: String, maxlength: 200 }],
    // Full specs table
    specifications: [specSchema],
    // Aggregated rating (updated by post-save hooks on Review model)
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (v) => Math.round(v * 10) / 10,
    },
    ratingsCount: { type: Number, default: 0 },
    // Discount computed from default variant; stored for filter queries
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    // Flags
    isFeatured:   { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    // Analytics
    viewCount:    { type: Number, default: 0 },
    soldCount:    { type: Number, default: 0 },
    // Delivery & shipping
    weight:    { type: Number, default: 0 }, // in grams
    dimensions:{ length: Number, width: Number, height: Number }, // in cm
    // SEO
    metaTitle:       { type: String, maxlength: 120 },
    metaDescription: { type: String, maxlength: 300 },
    tags:            [{ type: String, lowercase: true, trim: true }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ───────── Pre-save: auto-generate slug ─────────
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    // Append a short ID to ensure uniqueness
    this.slug = `${this.slug}-${this._id.toString().slice(-6)}`;
  }
  next();
});

// ───────── Virtual: cheapest active variant price ─────────
productSchema.virtual('minPrice').get(function () {
  const variants = Array.isArray(this.variants) ? this.variants : [];
  const active = variants.filter((v) => v.isActive && v.stock > 0);
  if (!active.length) return null;
  return Math.min(...active.map((v) => v.price));
});

// ───────── Full-text search index ─────────
productSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });
// Filter indexes
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ ratingsAverage: -1 });
productSchema.index({ 'variants.price': 1 });
productSchema.index({ discountPercent: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
