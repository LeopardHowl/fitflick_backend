import express from "express";
import auth from "../middleware/auth.js";
import {
  getAllBackgrounds,
  getActiveBackgrounds,
  getBackgroundByCategory,
  getBackgroundById,
  createBackground,
  updateBackground,
  deleteBackground,
} from "../controllers/backgroundController.js";

const router = express.Router();

router.get("/", auth, getAllBackgrounds);
router.get("/active", getActiveBackgrounds);
router.get("/category/:category", getBackgroundByCategory);
router.get("/:id", getBackgroundById);
router.post("/", createBackground);
router.put("/:id", updateBackground);
router.delete("/:id", deleteBackground);

export default router;
