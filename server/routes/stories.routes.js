import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getStories, createStory, viewStory, deleteStory, getStoryViews,
} from '../controllers/stories.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/',          getStories);       // GET  /api/stories
router.post('/',         createStory);      // POST /api/stories
router.post('/:id/view', viewStory);        // POST /api/stories/:id/view
router.get('/:id/views', getStoryViews);   // GET  /api/stories/:id/views
router.delete('/:id',    deleteStory);      // DELETE /api/stories/:id

export default router;
