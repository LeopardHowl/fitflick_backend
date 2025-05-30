import express from "express";
import {
  getAllProducts,
  getActiveProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  updateInventory,
  getTrendingProducts,
  getProductsByCategory,
} from "../controllers/productController.js";
import { zaraProductController } from "../controllers/zaraProductController.js";

const router = express.Router();
// Public routes
router.get("/", getAllProducts);
router.get("/active", getActiveProducts);
router.get("/trending", getTrendingProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProductById);

// Protected routes (admin only)
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.delete("/:id/permanent", hardDeleteProduct);
router.patch("/:id/inventory", updateInventory);
router.post("/zara", zaraProductController);

export default router;
