import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate-ideas', authMiddleware, aiController.generateProjectIdeas);

export default router;
