const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrict } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Multer upload for category/banner images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'trove/misc', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});
const uploadImage = multer({ storage: imageStorage }).single('image');

// Public read routes for categories and banners
router.get('/categories', adminController.getCategories);
router.get('/banners',    adminController.getBanners);

// Protected admin-only routes
router.use(protect, restrict('admin'));

// Dashboard
router.get('/dashboard',    adminController.getDashboard);
router.get('/low-stock',    adminController.getLowStockReport);
router.get('/products',     adminController.getProducts);
router.post('/categories',       uploadImage, adminController.createCategory);
router.patch('/categories/:id',  uploadImage, adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Coupons
router.get('/coupons',        adminController.getCoupons);
router.post('/coupons',       adminController.createCoupon);
router.patch('/coupons/:id',  adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// Banners
router.post('/banners',       uploadImage, adminController.createBanner);
router.patch('/banners/:id',  uploadImage, adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

module.exports = router;
