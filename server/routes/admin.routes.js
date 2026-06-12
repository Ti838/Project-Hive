import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getStats, getUsers, banUser, changeRole, deleteUser,
  getTeams, deleteTeam,
} from '../controllers/admin.controller.js';

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

// DEV HELPER — POST /api/admin/promote-me  (no admin guard, just auth)
// Lets a logged-in user promote themselves to admin for testing
import User from '../models/User.js';
const devRouter = express.Router();
devRouter.use(authMiddleware);
devRouter.post('/promote-me', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not available in production' });
  const user = await User.findByIdAndUpdate(req.user.id, { role: 'admin' }, { new: true }).select('-passwordHash -refreshTokens');
  res.json({ message: 'You are now admin! Please log out and log back in.', role: user.role });
});
export { devRouter as adminDevRouter };

