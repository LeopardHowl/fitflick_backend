import express from "express";

import {
  createUserTryonResult,
  getUserTryonResults,
  getMostRecentTryonResult,
} from "../controllers/tryonResultController.js";

const router = express.Router();

router.post("/", createUserTryonResult);
router.get("/:userId", getUserTryonResults);
router.get("/recent/:userId", getMostRecentTryonResult);

export default router;
