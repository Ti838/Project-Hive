import express from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, usersController.listUsers);  // GET /api/users?limit=N
router.get('/me', authMiddleware, usersController.getCurrentUser);
router.get('/search', optionalAuthMiddleware, usersController.searchUsers);
router.get('/global-search', authMiddleware, usersController.globalSearch);
router.get('/:id', optionalAuthMiddleware, usersController.getUserProfile);

router.put('/me', authMiddleware, usersController.updateProfile);
router.patch('/me', authMiddleware, usersController.updateProfile);  // PATCH alias
router.put('/me/skills', authMiddleware, usersController.updateSkills);
router.patch('/me/skills', authMiddleware, usersController.updateSkills);

router.post('/me/skills', authMiddleware, usersController.addSkill);
router.delete('/me/skills', authMiddleware, usersController.removeSkill);

// Password change
router.patch('/me/password', authMiddleware, usersController.changePassword);

export default router;
