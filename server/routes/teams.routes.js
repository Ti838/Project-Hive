import express from 'express';
import * as teamsController from '../controllers/teams.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Team CRUD
router.post('/', authMiddleware, teamsController.createTeam);
router.get('/', optionalAuthMiddleware, teamsController.getTeams);
router.get('/:id', optionalAuthMiddleware, teamsController.getTeamDetail);
router.put('/:id', authMiddleware, teamsController.updateTeam);

// Join requests
router.post('/:teamId/join', authMiddleware, teamsController.postJoinRequest);
router.get('/:teamId/requests', authMiddleware, teamsController.getTeamRequests);
router.post('/:teamId/requests/:requestId/accept', authMiddleware, teamsController.acceptJoinRequest);
router.post('/:teamId/requests/:requestId/reject', authMiddleware, teamsController.rejectJoinRequest);

export default router;
