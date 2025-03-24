import express from 'express';
import { 
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  getUserCart,
  clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// Get user's cart
router.get('/:userId', getUserCart);

// Add product to cart
router.post('/add', addToCart);

// Update quantity of a cart item
router.put('/update', updateCartItemQuantity);

// Remove item from cart
router.delete('/remove', removeFromCart);

// Clear entire cart
router.delete('/clear/:userId', clearCart);

export default router;
