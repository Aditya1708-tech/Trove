const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrict } = require('../middleware/auth');

// Customer routes
router.use(protect);
router.post('/',               orderController.createOrder);
router.post('/verify-payment', orderController.verifyPayment);
router.get('/my',              orderController.getMyOrders);
router.get('/:id',             orderController.getOrderById);
router.post('/:id/cancel',     orderController.cancelOrder);

// Admin routes
router.get('/admin/all',       restrict('admin'), orderController.getAllOrders);
router.patch('/:id/status',    restrict('admin', 'seller'), orderController.updateOrderStatus);

module.exports = router;
