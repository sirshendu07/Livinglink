const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const {
  registerOwnerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { rateLimit } = require('../middlewares/rateLimiter.middleware');

// Rate limiting for auth and OTP routes to prevent brute-force attacks
const authLimiter = rateLimit('rl:auth', 15, 60);
const otpLimiter = rateLimit('rl:otp', 5, 60);

router.post('/register', authLimiter, validate(registerOwnerSchema), authController.register);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Authenticated user routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout-all', authenticate, authController.logoutAll);

module.exports = router;
