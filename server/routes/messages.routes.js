import express from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/conversations — Load active conversations
router.get('/conversations', authMiddleware, messagesController.getConversations);

// POST /api/messages/read — Mark conversation as read
router.post('/read', authMiddleware, messagesController.markAsRead);

// GET /api/messages/teams/:teamId  — Load message history
router.get('/teams/:teamId', authMiddleware, messagesController.getTeamMessages);

// Also support /api/messages/team/:teamId (frontend compat)
router.get('/team/:teamId', authMiddleware, messagesController.getTeamMessages);

// POST /api/messages  — Save a message via REST (fallback when socket is down)
router.post('/', authMiddleware, messagesController.saveMessage);

export default router;
