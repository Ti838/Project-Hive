import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getFeed, createPost, deletePost, editPost,
  reactToPost, getComments, addComment, deleteComment, editComment,
  getPostById, scrapeMetadata, getUserPosts,
  savePost, getSavedPosts, votePoll,
} from '../controllers/posts.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Feed
router.get('/feed', getFeed);

// Saved Posts
router.get('/posts/saved', getSavedPosts);   // ⚠️ must be before /posts/:id

// Utilities
router.get('/utils/scrape-metadata', scrapeMetadata);

// Posts CRUD
router.post('/posts',             createPost);
router.get('/posts/user/:userId', getUserPosts); // must be before /:id
router.get('/posts/:id',          getPostById);
router.patch('/posts/:id',        editPost);     // ✅ NEW — edit own post
router.delete('/posts/:id',       deletePost);

// Reactions
router.post('/posts/:id/react',   reactToPost);
router.post('/posts/:id/vote',    votePoll); // ✅ NEW — poll voting

// Save / Unsave
router.post('/posts/:id/save',    savePost);     // ✅ NEW — bookmark toggle

// Comments
router.get('/posts/:id/comments',          getComments);
router.post('/posts/:id/comments',         addComment);
router.patch('/posts/:id/comments/:cid',   editComment);  // ✅ NEW — edit comment
router.delete('/posts/:id/comments/:cid',  deleteComment);

export default router;
