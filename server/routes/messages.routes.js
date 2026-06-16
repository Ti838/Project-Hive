import express from 'express';
import * as mc from '../controllers/messages.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Conversations & DMs
router.get('/conversations',        authMiddleware, mc.getConversations);
router.post('/read',                authMiddleware, mc.markAsRead);
router.post('/dm',                  authMiddleware, mc.sendDirectMessage);  // friend-check + request

// Message Requests (Facebook-style)
router.get('/requests',             authMiddleware, mc.getMessageRequests);
router.post('/requests/:id/accept', authMiddleware, mc.acceptMessageRequest);
router.post('/requests/:id/decline',authMiddleware, mc.declineMessageRequest);

// Team messages
router.get('/teams/:teamId',        authMiddleware, mc.getTeamMessages);
router.get('/team/:teamId',         authMiddleware, mc.getTeamMessages);

// DM history by friendId  (must come BEFORE POST /)
router.get('/:friendId',            authMiddleware, mc.getDmHistory);

// Save message via REST (socket fallback)
router.post('/',                    authMiddleware, mc.saveMessage);

export default router;
