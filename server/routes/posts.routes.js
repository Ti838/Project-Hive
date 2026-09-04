import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import {
  getFeed, createPost, deletePost, editPost,
  reactToPost, getComments, addComment, deleteComment, editComment,
  getPostById, scrapeMetadata, getUserPosts,
  savePost, getSavedPosts, votePoll,
} from '../controllers/posts.controller.js';

const router = Router();

// Feed & Read Routes (optionalAuth allows browsing)
router.get('/feed',  optionalAuthMiddleware, getFeed);
router.get('/posts', optionalAuthMiddleware, getFeed);

// Saved Posts
router.get('/posts/saved', authMiddleware, getSavedPosts);   // ⚠️ must be before /posts/:id

// Utilities
router.get('/utils/scrape-metadata', optionalAuthMiddleware, scrapeMetadata);

// Posts CRUD
router.post('/posts',             authMiddleware, createPost);
router.get('/posts/user/:userId', optionalAuthMiddleware, getUserPosts); // must be before /:id
router.get('/posts/:id',          optionalAuthMiddleware, getPostById);
router.patch('/posts/:id',        authMiddleware, editPost);
router.delete('/posts/:id',       authMiddleware, deletePost);

// Reactions & Polls
router.post('/posts/:id/react',   authMiddleware, reactToPost);
router.post('/posts/:id/vote',    authMiddleware, votePoll);

// Save / Unsave
router.post('/posts/:id/save',    authMiddleware, savePost);

// Comments
router.get('/posts/:id/comments',         optionalAuthMiddleware, getComments);
router.post('/posts/:id/comments',        authMiddleware, addComment);
router.patch('/posts/:id/comments/:cid',  authMiddleware, editComment);
router.delete('/posts/:id/comments/:cid', authMiddleware, deleteComment);

export default router;
