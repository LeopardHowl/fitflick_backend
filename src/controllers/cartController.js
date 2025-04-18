import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";

// Get user's cart
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("Fetching cart for user:", userId);

    // Find cart with populated items
    const cart = await Cart.findOne({ userId }).populate({
      path: "items",
      populate: {
        path: "productId",
        model: "Product",
        populate: { path: "brand", model: "Brand" },
      },
    });

    if (!cart) {
      return res.status(200).json({ items: [], totalAmount: 0 });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    console.log("Adding product to cart:", { userId, productId, quantity });

    // Find or create cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [], totalAmount: 0 });
    }

    // Check if product already in cart
    const existingCartItem = await CartItem.findOne({
      cartId: cart._id,
      productId,
    });

    if (existingCartItem) {
      // Update quantity if product already exists
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
    } else {
      // Create new cart item
      const newCartItem = new CartItem({
        cartId: cart._id,
        productId,
        quantity,
      });
      await newCartItem.save();

      // Add item to cart
      cart.items.push(newCartItem._id);
    }

    // Update total amount (you'll need to fetch product price)
    // This is simplified - you should calculate based on product prices
    await cart.save();

    // Return updated cart with populated items
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: {
        path: "productId",
        populate: { path: "brand", model: "Brand" },
      },
    });

    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quantity of cart item
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, cartItemId, quantity } = req.body;
    console.log("Updating cart item quantity:", {
      userId,
      cartItemId,
      quantity,
    });

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Update cart item quantity
    const cartItem = await CartItem.findById(cartItemId);

    if (!cartItem || !cart.items.includes(cartItemId)) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: {
        path: "productId",
        populate: { path: "brand", model: "Brand" },
      },
    });

    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, cartItemId } = req.body;

    // Find cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove item from cart
    cart.items = cart.items.filter((item) => item.toString() !== cartItemId);
    await cart.save();

    // Delete cart item
    await CartItem.findByIdAndDelete(cartItemId);

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: {
        path: "productId",
      },
    });

    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Delete all cart items
    await CartItem.deleteMany({ cartId: cart._id });

    // Clear cart items array
    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
