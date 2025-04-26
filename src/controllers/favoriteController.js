import Favorite from "../models/favoriteModel.js";
import Product from "../models/productModel.js";

// @desc    Add a product to user's favorites
// @route   POST /api/favorites
// @access  Private
export const addFavorite = async (req, res) => {
  try {
    console.log("Received request to🤣 add favorite:", req.body);

    const { productId, userId } = req.body;

    // Create new favorite
    await Favorite.create({ user: userId, product: productId });

    // Increment product's favorites count
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.favoritesCount += 1;
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added to favorites",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a product from user's favorites
// @route   DELETE /api/favorites/:productId
// @access  Private
export const removeFavorite = async (req, res) => {
  try {
    console.log("Received request to 😢 remove favorite:", req.body);

    const { productId, userId } = req.body;

    // Find and delete the favorite
    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!favorite) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    // Decrement product's favorites count
    const product = await Product.findById(productId);
    if (product) {
      product.favoritesCount = Math.max(0, product.favoritesCount - 1);
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: "Product removed from favorites",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.params.id;

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: "product",
        populate: {
          path: "brand",
          model: "Brand",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if a product is in user's favorites
// @route   GET /api/favorites/check/:productId
// @access  Private
export const checkFavorite = async (req, res) => {
  try {
    const { productId, userId } = req.params;
    console.log("Received request to check favorite:", req.body);
    const favorite = await Favorite.findOne({
      user: userId,
      product: productId,
    });

    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
