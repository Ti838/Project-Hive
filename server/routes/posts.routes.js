import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getFeed, createPost, deletePost,
  reactToPost, getComments, addComment, deleteComment, getPostById, scrapeMetadata, getUserPosts
} from '../controllers/posts.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Feed
router.get('/feed', getFeed);

// Utilities
router.get('/utils/scrape-metadata', scrapeMetadata);

// Posts
router.post('/posts', createPost);
router.get('/posts/user/:userId', getUserPosts); // user profile activity — must be before /:id
router.get('/posts/:id', getPostById);
router.delete('/posts/:id', deletePost);


// Reactions
router.post('/posts/:id/react', reactToPost);

// Comments
router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', addComment);
router.delete('/posts/:id/comments/:cid', deleteComment);

export default router;
