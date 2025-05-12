import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { timestamps: true });

// Middleware to update cart total after saving cart item
cartItemSchema.post('save', async function() {
  try {
    const Cart = mongoose.model('Cart');
    const cart = await Cart.findById(this.cartId);
    if (cart) {
      await cart.calculateTotalAmount();
    }
  } catch (error) {
    console.error('Error updating cart total:', error);
  }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;
