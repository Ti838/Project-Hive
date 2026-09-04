import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import * as githubController from '../controllers/github.controller.js';

const router = express.Router();

// User GitHub Account Connection
router.get('/status', authMiddleware, githubController.getGitHubStatus);
router.post('/connect', authMiddleware, githubController.connectGitHub);
router.post('/disconnect', authMiddleware, githubController.disconnectGitHub);
router.get('/user/:username', optionalAuthMiddleware, githubController.getUserProfile);

// Repository Details & Workspace Explorer
router.get('/repo/:owner/:repo', optionalAuthMiddleware, githubController.getRepoOverview);
router.get('/repo/:owner/:repo/readme', optionalAuthMiddleware, githubController.getRepoReadme);
router.get('/repo/:owner/:repo/tree', optionalAuthMiddleware, githubController.getRepoTree);
router.get('/repo/:owner/:repo/file', optionalAuthMiddleware, githubController.getRepoFile);
router.get('/repo/:owner/:repo/commits', optionalAuthMiddleware, githubController.getRepoCommits);
router.get('/repo/:owner/:repo/branches', optionalAuthMiddleware, githubController.getRepoBranches);
router.get('/repo/:owner/:repo/issues', optionalAuthMiddleware, githubController.getRepoIssues);
router.get('/repo/:owner/:repo/pulls', optionalAuthMiddleware, githubController.getRepoPulls);
router.get('/repo/:owner/:repo/pulls/:pullNumber', optionalAuthMiddleware, githubController.getPullRequestDetail);
router.get('/repo/:owner/:repo/actions', optionalAuthMiddleware, githubController.getRepoActions);
router.get('/repo/:owner/:repo/releases', optionalAuthMiddleware, githubController.getRepoReleases);
router.get('/repo/:owner/:repo/health', optionalAuthMiddleware, githubController.getProjectHealth);

// AI Code & PR Intelligence
router.post('/ai-review', authMiddleware, githubController.performAiCodeReview);

// Webhook Ingestion (Signature verified)
router.post('/webhook', express.json({ type: 'application/json' }), githubController.handleGitHubWebhook);

export default router;

