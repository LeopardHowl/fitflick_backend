import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CartItem'
  }],
  totalAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Method to recalculate total amount
cartSchema.methods.calculateTotalAmount = async function() {
  let total = 0;
  
  // Populate items with product details
  await this.populate({
    path: 'items',
    populate: {
      path: 'productId',
      select: 'price'
    }
  });
  
  // Calculate total
  for (const item of this.items) {
    total += item.productId.price * item.quantity;
  }
  
  this.totalAmount = total;
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
