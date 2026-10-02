const mongoose = require('mongoose');

/**
 * Banner schema — for homepage hero banners and promotional sections
 */
const bannerSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    image: {
      url:      { type: String, required: true },
      publicId: { type: String },
    },
    mobileImage: {
      url:      { type: String },
      publicId: { type: String },
    },
    linkUrl:  { type: String, default: '#' },
    linkText: { type: String, default: 'Shop Now' },
    position: {
      type: String,
      enum: ['hero', 'deals', 'category_top', 'sidebar'],
      default: 'hero',
    },
    bgColor: { type: String, default: '#2A2A72' }, // fallback background color
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate:   { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bannerSchema.index({ position: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
