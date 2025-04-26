import express from "express";

import {
  createUserTryonResult,
  getUserTryonResults,
} from "../controllers/tryonResultController.js";

const router = express.Router();

router.post("/", createUserTryonResult);
router.get("/:userId", getUserTryonResults);

export default router;
