import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── Authenticated route (10 req/hr per user) ────────────────────────────────
router.post('/generate-ideas', authMiddleware, aiController.generateProjectIdeas);

// ── Public route (5 req/hr per IP — no login needed) ────────────────────────
router.post('/generate-ideas-public', aiController.generateProjectIdeasPublic);

export default router;
