const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine for product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'trove/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Storage engine for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'trove/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }],
  },
});

// Storage engine for review images
const reviewStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'trove/reviews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }],
  },
});

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array('images', 8); // max 8 images per product

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('avatar');

const uploadReviewImages = multer({
  storage: reviewStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 4);

/**
 * Delete image from Cloudinary by public_id
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadAvatar,
  uploadReviewImages,
  deleteImage,
};
