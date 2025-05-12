import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember
} from "../controllers/groupController.js";

const router = express.Router();

// Group routes
router.route("/")
  .post(createGroup)
  .get(getGroups);

router.route("/:id")
  .get(getGroupById)
  .put(updateGroup)
  .delete(deleteGroup);

router.route("/:id/members")
  .post(addMember);

router.route("/:id/members/:userId")
  .delete(removeMember);

export default router;