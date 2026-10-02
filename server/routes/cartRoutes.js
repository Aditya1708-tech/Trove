const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth, protect } = require('../middleware/auth');

// Cart routes work for both guests and logged-in users
router.get('/',                    optionalAuth, cartController.getCart);
router.post('/add',                optionalAuth, cartController.addToCart);
router.patch('/update',            optionalAuth, cartController.updateCartItem);
router.delete('/:itemId',          optionalAuth, cartController.removeFromCart);
router.patch('/:itemId/save-for-later', protect, cartController.saveForLater);
router.post('/apply-coupon',       protect,      cartController.applyCoupon);
router.delete('/coupon',           protect,      cartController.removeCoupon);

module.exports = router;
