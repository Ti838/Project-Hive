import express from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, notificationsController.getNotifications);
router.put('/:id/read', authMiddleware, notificationsController.markAsRead);
router.put('/read-all', authMiddleware, notificationsController.markAllAsRead);
router.delete('/:id', authMiddleware, notificationsController.deleteNotification);

export default router;
