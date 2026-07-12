import express from 'express';
import * as teamsController from '../controllers/teams.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Team CRUD
router.post('/',              authMiddleware,         teamsController.createTeam);
router.get('/',               optionalAuthMiddleware, teamsController.getTeams);
// ⚠️ Specific routes MUST be before /:id wildcards
router.get('/my-teams',       authMiddleware,         teamsController.getMyTeams);
router.get('/:id',            optionalAuthMiddleware, teamsController.getTeamDetail);
router.put('/:id',            authMiddleware,         teamsController.updateTeam);
router.delete('/:id',         authMiddleware,         teamsController.deleteTeam);  // leader delete

// Member actions
router.post('/:id/leave',                                authMiddleware, teamsController.leaveTeam);
router.post('/:id/members',                              authMiddleware, teamsController.addMember);
router.delete('/:id/members/:memberId',                  authMiddleware, teamsController.kickMember);

// Join requests
router.post('/:teamId/join',                             authMiddleware, teamsController.postJoinRequest);
router.get('/:teamId/requests',                          authMiddleware, teamsController.getTeamRequests);
router.post('/:teamId/requests/:requestId/accept',       authMiddleware, teamsController.acceptJoinRequest);
router.post('/:teamId/requests/:requestId/reject',       authMiddleware, teamsController.rejectJoinRequest);

export default router;
