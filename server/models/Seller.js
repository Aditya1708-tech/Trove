const mongoose = require('mongoose');

/**
 * Seller schema — linked 1:1 to a User with role "seller"
 */
const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    displayName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GST number',
      ],
      sparse: true,
    },
    logo: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // Aggregate rating from all products
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSales:    { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    bankDetails: {
      accountHolder: String,
      accountNumber: { type: String, select: false },
      ifscCode:      String,
      bankName:      String,
    },
    address: {
      addressLine1: String,
      city:         String,
      state:        String,
      pincode:      String,
    },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    joinedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sellerSchema.index({ businessName: 'text' });

module.exports = mongoose.model('Seller', sellerSchema);
