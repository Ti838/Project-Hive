import express from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, usersController.getCurrentUser);
router.get('/search', optionalAuthMiddleware, usersController.searchUsers);
router.get('/:id', optionalAuthMiddleware, usersController.getUserProfile);

router.put('/me', authMiddleware, usersController.updateProfile);
router.put('/me/skills', authMiddleware, usersController.updateSkills);

router.post('/me/skills', authMiddleware, usersController.addSkill);
router.delete('/me/skills', authMiddleware, usersController.removeSkill);

export default router;
