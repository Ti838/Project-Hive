import express from 'express';
import { authMiddleware as authenticate } from '../middleware/auth.js';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  getDMHistory,
  getRecommendedFriends,
} from '../controllers/friends.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/request/:userId',      sendFriendRequest);
router.post('/accept/:requestId',    acceptFriendRequest);
router.post('/reject/:requestId',    rejectFriendRequest);
router.get('/',                      getFriends);
router.get('/requests',              getPendingRequests);
router.get('/recommendations',       getRecommendedFriends);
router.get('/dm/:friendId',          getDMHistory);

export default router;

