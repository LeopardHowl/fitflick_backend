import express from "express";
import {
  createPoll,
  getPolls,
  getPollById,
  votePoll,
  updatePoll,
  deletePoll,
  closePoll,
  getPollResults,
  getUserPolls,
  getVotedPolls,
  getGroupPolls
} from "../controllers/pollController.js";

const router = express.Router();

// Poll routes
router.route("/")
  .post(createPoll)
  .get(getPolls);

router.route("/:id")
  .get(getPollById)
  .put(updatePoll)
  .delete(deletePoll);

router.route("/:id/vote")
  .post(votePoll);

router.route("/:id/close")
  .put(closePoll);

router.route("/:id/results")
  .get(getPollResults);

router.route("/user/:userId")
  .get(getUserPolls);

router.route("/voted/:userId")
  .get(getVotedPolls);

router.route("/group/:groupId")
  .get(getGroupPolls);

export default router;