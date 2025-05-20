import express from "express";

import {
  createUserTryonResult,
  getUserTryonResults,
  getMostRecentTryonResult,
  deleteTryonResult,
} from "../controllers/tryonResultController.js";

const router = express.Router();

router.post("/", createUserTryonResult);
router.get("/:userId", getUserTryonResults);
router.get("/recent/:userId", getMostRecentTryonResult);
router.delete("/:id", deleteTryonResult);

export default router;
