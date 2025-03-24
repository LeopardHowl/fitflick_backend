import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  updateInventory,
  // getTrendingProducts,
  getProductsByCategory
} from '../controllers/productController.js';

const router = express.Router();
// Public routes
router.get('/', getAllProducts);
// router.get('/trending', getTrendingProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
// router.get('/trending', getTrendingProducts);

// Protected routes (admin only)
router.post('/', createProduct);
router.put('/:id',  updateProduct);
router.delete('/:id',  deleteProduct);
router.delete('/:id/permanent',  hardDeleteProduct);
router.patch('/:id/inventory',  updateInventory);


export default router;
