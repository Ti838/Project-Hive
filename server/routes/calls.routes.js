// ─── ProjectHive — Calls Routes ───────────────────────────────────────────────
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getCallToken, endCall, getCallHistory } from '../controllers/calls.controller.js';

const router = Router();

// Generate LiveKit room token with permission verification
router.post('/token', authMiddleware, getCallToken);

// Terminate active call and update metadata
router.post('/end', authMiddleware, endCall);

// Retrieve user's call history
router.get('/history', authMiddleware, getCallHistory);

export default router;
