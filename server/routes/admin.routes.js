import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getStats, getUsers, banUser, changeRole, deleteUser,
  getTeams, deleteTeam,
} from '../controllers/admin.controller.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Admin guard middleware
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.use(authMiddleware, requireAdmin);

router.get('/stats',              getStats);
router.get('/users',              getUsers);
router.patch('/users/:id/ban',    banUser);
router.patch('/users/:id/role',   changeRole);
router.delete('/users/:id',       deleteUser);
router.get('/teams',              getTeams);
router.delete('/teams/:id',       deleteTeam);

export default router;

// DEV HELPER — POST /api/admin/promote-me (no admin guard, just auth)
// Lets a logged-in user promote themselves to admin for testing
const devRouter = express.Router();
devRouter.use(authMiddleware);
devRouter.post('/promote-me', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not available in production' });
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
