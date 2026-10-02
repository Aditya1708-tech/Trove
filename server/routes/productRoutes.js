const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { protect, optionalAuth, restrict } = require('../middleware/auth');
const { uploadProductImages, uploadReviewImages } = require('../config/cloudinary');

// ── Public routes ──
router.get('/search/autocomplete', productController.autocomplete);
router.get('/pincode-estimate',    productController.deliveryEstimate);
router.get('/',                    productController.getProducts);
router.get('/:slug',               optionalAuth, productController.getProductBySlug);
router.get('/:id/similar',         productController.getSimilarProducts);

// ── Reviews ──
router.get('/:productId/reviews',   reviewController.getProductReviews);
router.post(
  '/:productId/reviews',
  protect,
  uploadReviewImages,
  reviewController.addReview
);

// ── Protected (seller / admin) ──
router.post(
  '/',
  protect,
  restrict('seller', 'admin'),
  uploadProductImages,
  productController.createProduct
);
router.patch(
  '/:id',
  protect,
  restrict('seller', 'admin'),
  uploadProductImages,
  productController.updateProduct
);
router.delete(
  '/:id',
  protect,
  restrict('seller', 'admin'),
  productController.deleteProduct
);

module.exports = router;
