import express from 'express';
import * as projectsController from '../controllers/projects.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/',         authMiddleware,         projectsController.submitProject);
router.get('/saved',     authMiddleware,         projectsController.getSavedProjects);  // ⚠️ before /:id
router.get('/',          optionalAuthMiddleware, projectsController.getProjects);
router.get('/:id',       optionalAuthMiddleware, projectsController.getProjectDetail);
router.put('/:id',       authMiddleware,         projectsController.updateProject);
router.delete('/:id',    authMiddleware,         projectsController.deleteProject);

router.post('/:id/like', authMiddleware,         projectsController.likeProject);
router.post('/:id/save', authMiddleware,         projectsController.saveProject);

export default router;
