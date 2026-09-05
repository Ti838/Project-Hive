import express from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  getStats, getUsers, banUser, changeRole, deleteUser,
  getTeams, deleteTeam,
  getProjects, deleteProject, featureProject,
  getSystemFlags, updateFlags,
  getAdminPosts, deleteAdminPost,
  getTickets, resolveTicket, deleteTicket,
  getModerationQueue, resolveReport,
  getUserStrikes, issueStrike,
  getAuditLogs, getAdminHealth, getClientTelemetry,
} from '../controllers/admin.controller.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Enforce Live Database-Backed Admin Authentication across all routes
router.use(adminAuthMiddleware);

// ── System KPIs & Telemetry ────────────────────────────
router.get('/stats',                    getStats);
router.get('/health',                   getAdminHealth);
router.get('/client-telemetry',         getClientTelemetry);

// ── User Directory & Disciplinary Sanctions ────────────
router.get('/users',                    getUsers);
router.patch('/users/:id/ban',          banUser);
router.patch('/users/:id/role',         changeRole);
router.delete('/users/:id',             deleteUser);
router.get('/users/:id/strikes',        getUserStrikes);
router.post('/users/:id/strikes',       issueStrike);

// ── Content Moderation Matrix ──────────────────────────
router.get('/reports',                  getModerationQueue);
router.patch('/reports/:id/resolve',    resolveReport);
router.get('/posts',                    getAdminPosts);
router.delete('/posts/:id',             deleteAdminPost);

// ── Squads & Hubs ──────────────────────────────────────
router.get('/teams',                    getTeams);
router.delete('/teams/:id',             deleteTeam);

// ── Projects Showcase ──────────────────────────────────
router.get('/projects',                 getProjects);
router.delete('/projects/:id',          deleteProject);
router.patch('/projects/:id/feature',   featureProject);

// ── Support Tickets ────────────────────────────────────
router.get('/tickets',                  getTickets);
router.patch('/tickets/:id/resolve',    resolveTicket);
router.delete('/tickets/:id',           deleteTicket);

// ── System Flags & Platform Controls ───────────────────
router.get('/flags',                    getSystemFlags);
router.patch('/flags',                  updateFlags);

// ── Audit Ledger ───────────────────────────────────────
router.get('/audit-logs',               getAuditLogs);

export default router;

// DEV HELPER — POST /api/admin/promote-me (Strictly Development Only)
const devRouter = express.Router();
devRouter.use(authMiddleware);
devRouter.post('/promote-me', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Administrative self-escalation is disabled in production' });
  }
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({ role: 'admin' })
    .eq('id', req.user.id)
    .select('id, first_name, last_name, email, role')
    .single();
  if (error) return res.status(500).json({ error: 'Failed to promote' });
  res.json({ message: 'You are now admin! Please log out and log back in.', role: user.role });
});
export { devRouter as adminDevRouter };
