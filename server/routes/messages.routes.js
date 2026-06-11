import express from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/teams/:teamId  — Load message history
router.get('/teams/:teamId', authMiddleware, messagesController.getTeamMessages);

// Also support /api/messages/team/:teamId (frontend compat)
router.get('/team/:teamId', authMiddleware, messagesController.getTeamMessages);

// POST /api/messages  — Save a message via REST (fallback when socket is down)
router.post('/', authMiddleware, messagesController.saveMessage);

export default router;
