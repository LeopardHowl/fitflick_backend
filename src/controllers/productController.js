import Product from '../models/productModel.js';
import { ApiError } from '../utils/errorUtil.js';
import { ApiResponse } from '../utils/responseUtil.js';


// Get all products with filtering and sorting
export const getAllProducts = async (req, res) => {
  try {
    const {
      sort = '-createdAt',
      category,
      brand,
      minPrice,
      maxPrice,
      sizes,
      colors,
      search,
      isActive
    } = req.query;

    const query = {};

    // Apply filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (sizes) {
      const sizeArray = sizes.split(',');
      query.sizes = { $in: sizeArray };
    }

    // Color filter
    if (colors) {
      const colorArray = colors.split(',');
      query['colors.name'] = { $in: colorArray };
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with sorting
    const products = await Product.find(query).sort(sort);

    return res.status(200).json(
      new ApiResponse(200, { products }, "Products fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching products");
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
      new ApiResponse(200, product, "Product fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching product");
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      images,
      colors,
      sizes,
      inventory,
      brand,  
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !price || !brand) {
      throw new ApiError(400, "All required fields must be provided");
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      category,
      price,
      discountPrice,
      images: images || [],
      colors: colors || [],
      sizes: sizes || [],
      inventory: inventory || [],
      brand,   
      isActive: true
    });

    return res.status(201).json(
      new ApiResponse(201, product, "Product created successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while creating product");
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json(
      new ApiResponse(200, updatedProduct, "Product updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while updating product");
  }
};

// Delete product (soft delete by setting isActive to false)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    return res.status(200).json(
      new ApiResponse(200, {}, "Product deleted successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while deleting product");
  }
};

// Hard delete product (admin only)
export const hardDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Hard delete
    await Product.findByIdAndDelete(id);

    return res.status(200).json(
      new ApiResponse(200, {}, "Product permanently deleted")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while permanently deleting product");
  }
};

// Update product inventory
export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;

    if (!inventory || !Array.isArray(inventory)) {
      throw new ApiError(400, "Valid inventory data is required");
    }

    const product = await Product.findById(id);
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Update inventory
    product.inventory = inventory;
    await product.save();

    return res.status(200).json(
      new ApiResponse(200, product, "Inventory updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while updating inventory");
  }
};

// Get trending products
// export const getTrendingProducts = async (req, res) => {
//   try {
//     const products = await Product.find({ isActive: true })
//       .sort({ trendingScore: -1 });

//     return res.status(200).json(
//       new ApiResponse(200, products, "Trending products fetched successfully")
//     );
//   } catch (error) {
//     throw new ApiError(500, error?.message || "Error while fetching trending products");
//   }
// };

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { sort = '-createdAt' } = req.query;

    const products = await Product.find({ category, isActive: true })
      .sort(sort);

    return res.status(200).json(
      new ApiResponse(200, { products }, `Products in ${category} category fetched successfully`)
    );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching products by category");
  }
};