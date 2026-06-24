import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes — no CAPTCHA
router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/refresh',  authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Email verification
router.get('/verify-email',       authController.verifyEmail);        // ?token=xxx
router.post('/resend-verification', authController.resendVerification);

// ─── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google',          authController.googleInitiate);       // → returns OAuth URL
router.post('/google/callback', authController.googleCallback);     // ← frontend posts Supabase session
router.post('/google/code',     authController.googleCodeExchange); // ← frontend posts PKCE code for server-side exchange

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me',      authMiddleware, authController.getMe);

export default router;

