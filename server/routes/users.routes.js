import express from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/',             authMiddleware,         usersController.listUsers);
router.get('/me',           authMiddleware,         usersController.getCurrentUser);
router.get('/search',       optionalAuthMiddleware, usersController.searchUsers);
router.get('/global-search',authMiddleware,         usersController.globalSearch);
router.get('/:id',          optionalAuthMiddleware, usersController.getUserProfile);

router.put('/me',           authMiddleware, usersController.updateProfile);
router.patch('/me',         authMiddleware, usersController.updateProfile);
router.put('/me/skills',    authMiddleware, usersController.updateSkills);
router.patch('/me/skills',  authMiddleware, usersController.updateSkills);

router.post('/me/skills',   authMiddleware, usersController.addSkill);
router.delete('/me/skills', authMiddleware, usersController.removeSkill);

// Password change
router.patch('/me/password', authMiddleware, usersController.changePassword);

// Skill endorsement — POST toggles on/off
router.post('/:userId/skills/:skillId/endorse', authMiddleware, usersController.endorseSkill);

// Support Ticket creation
router.post('/tickets', authMiddleware, usersController.createSupportTicket);

// Self account deletion (requires auth — can only delete own account)
router.delete('/:id', authMiddleware, usersController.deleteOwnAccount);

export default router;
