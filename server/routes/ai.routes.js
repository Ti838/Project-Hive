import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── Centralized Hive AI Capability Execution (All 11 modes) ─────────────────
router.post('/execute', authMiddleware, aiController.executeHiveAICapability);

// ── Chat (free-form Q&A) ─────────────────────────────────────────────────────
router.post('/chat', authMiddleware, aiController.chatWithAI);

// ── Authenticated route (legacy project generator) ──────────────────────────
router.post('/generate-ideas', authMiddleware, aiController.generateProjectIdeas);

// ── Public route (5 req/hr per IP — no login needed) ────────────────────────
router.post('/generate-ideas-public', aiController.generateProjectIdeasPublic);

export default router;
