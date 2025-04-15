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
  getUserFriends
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

// Friend management routes
router.route('/:id/friends')
  .get(getUserFriends)
  .post(addFriend);

router.route('/:id/friends/remove')
  .post(removeFriend);

export default router;
