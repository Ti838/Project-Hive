import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import {
  getUserTickets,
  createTicket,
  getTicketById,
  replyToTicket,
  resolveUserTicket,
  getAdminTickets,
  replyAdminTicket,
  updateAdminTicketStatus,
  getSupportStats
} from '../controllers/support.controller.js';

const router = Router();

// ── User Help Center Routes (Authenticated Users) ─────────────
router.get('/my-tickets', authMiddleware, getUserTickets);
router.post('/tickets', authMiddleware, createTicket);
router.get('/tickets/:id', authMiddleware, getTicketById);
router.post('/tickets/:id/reply', authMiddleware, replyToTicket);
router.patch('/tickets/:id/close', authMiddleware, resolveUserTicket);

// ── Admin Support Center Routes (Designated Admins Only) ───────
router.get('/admin/tickets', adminAuthMiddleware, getAdminTickets);
router.get('/admin/stats', adminAuthMiddleware, getSupportStats);
router.post('/admin/tickets/:id/reply', adminAuthMiddleware, replyAdminTicket);
router.patch('/admin/tickets/:id/status', adminAuthMiddleware, updateAdminTicketStatus);

export default router;

