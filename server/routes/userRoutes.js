const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const { protect, restrict } = require('../middleware/auth');

router.use(protect);

// Wishlist
router.get('/wishlist',                    userController.getWishlist);
router.post('/wishlist/:productId',        userController.toggleWishlist);

// Addresses
router.get('/addresses',                   userController.getAddresses);
router.post('/addresses',                  userController.addAddress);
router.patch('/addresses/:addressId',      userController.updateAddress);
router.delete('/addresses/:addressId',     userController.deleteAddress);

// Reviews
router.delete('/reviews/:id',              reviewController.deleteReview);
router.post('/reviews/:id/helpful',        reviewController.markHelpful);

// Admin: user management
router.get('/',                            restrict('admin'), userController.getAllUsers);
router.patch('/:id/toggle-status',         restrict('admin'), userController.toggleUserStatus);

module.exports = router;
