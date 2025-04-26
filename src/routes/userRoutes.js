import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  checkUserExists,
  addFriend,
  removeFriend,
  getUserFriends,
  updateFcmToken
} from '../controllers/userController.js';

const router = express.Router();

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.route('/exists/:id').get(checkUserExists);

// FCM token update route
router.route('/:firebaseId/fcm-token')
  .put(updateFcmToken);

// Friend management routes
router.route('/:id/friends')
  .get(getUserFriends)
  .post(addFriend);

router.route('/:id/friends/remove')
  .post(removeFriend);

export default router;