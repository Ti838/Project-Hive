import express from 'express';
import { authMiddleware as authenticate } from '../middleware/auth.js';
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  getFollowers,
  getFollowing,
  getBlockedUsers,
  getDMHistory,
  getRecommendedFriends,
  unfriendUser,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getRelationshipStatus,
} from '../controllers/friends.controller.js';

const router = express.Router();

router.use(authenticate);

// Friend request management
router.post('/request/:userId',         sendFriendRequest);
router.delete('/request/:userId/cancel',cancelFriendRequest);
router.post('/accept/:requestId',       acceptFriendRequest);
router.post('/reject/:requestId',       rejectFriendRequest);

// Friendship deletion
router.delete('/:userId',               unfriendUser);

// Follow management
router.post('/follow/:userId',          followUser);
router.delete('/follow/:userId',        unfollowUser);

// Block management
router.post('/block/:userId',            blockUser);
router.delete('/block/:userId',          unblockUser);

// Relationship state engine
router.get('/relationship/:userId',     getRelationshipStatus);

// Retrieval lists
router.get('/',                         getFriends);
router.get('/requests',                 getPendingRequests);
router.get('/requests/sent',            getSentRequests);
router.get('/followers',                getFollowers);
router.get('/following',                getFollowing);
router.get('/blocked',                  getBlockedUsers);
router.get('/recommendations',          getRecommendedFriends);
router.get('/dm/:friendId',             getDMHistory);

export default router;
