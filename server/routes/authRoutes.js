const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',         authController.register);
router.post('/login',            authController.login);
router.post('/send-otp',         authController.sendOtp);
router.post('/verify-otp',       authController.verifyOtp);
router.post('/refresh',          authController.refreshToken);
router.post('/logout',           protect, authController.logout);
router.get('/me',                protect, authController.getMe);
router.patch('/me',              protect, authController.updateMe);
router.patch('/change-password', protect, authController.changePassword);

module.exports = router;
