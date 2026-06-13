import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { turnstileMiddleware } from '../middleware/turnstile.js';

const router = express.Router();

// Public routes (with CAPTCHA on sensitive endpoints)
router.post('/register', turnstileMiddleware, authController.register);
router.post('/login',    turnstileMiddleware, authController.login);
router.post('/refresh',  authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Email verification
router.get('/verify-email',       authController.verifyEmail);        // ?token=xxx
router.post('/resend-verification', authController.resendVerification);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me',      authMiddleware, authController.getMe);

export default router;
