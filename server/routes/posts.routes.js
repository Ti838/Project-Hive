import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getFeed, createPost, deletePost,
  reactToPost, getComments, addComment, deleteComment, getPostById
} from '../controllers/posts.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Feed
router.get('/feed', getFeed);

// Posts
router.post('/posts', createPost);
router.get('/posts/:id', getPostById);
router.delete('/posts/:id', deletePost);


// Reactions
router.post('/posts/:id/react', reactToPost);

// Comments
router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', addComment);
router.delete('/posts/:id/comments/:cid', deleteComment);

export default router;
