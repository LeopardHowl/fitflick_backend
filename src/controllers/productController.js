import Product from "../models/productModel.js";
import Brand from "../models/brandModel.js";
import { ApiError } from "../utils/errorUtil.js";
import { ApiResponse } from "../utils/responseUtil.js";

// Get all products with filtering and sorting
export const getAllProducts = async (req, res) => {
  try {
    console.log("Received request to get all products");
    const {
      sort = "-createdAt",
      category,
      brand,
      minPrice,
      maxPrice,
      sizes,
      colors,
      search,
      isActive,
      gender,
    } = req.query;

    const query = {};

    // Apply filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (gender) query.gender = gender;

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (sizes) {
      const sizeArray = sizes.split(",");
      query.sizes = { $in: sizeArray };
    }

    // Color filter
    if (colors) {
      const colorArray = colors.split(",");
      query["colors.name"] = { $in: colorArray };
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with sorting and populate brand information
    const products = await Product.find(query)
      .populate("brand", "name logo website")
      .sort(sort);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { products }, "Products fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching products");
  }
};

// Get only active products
export const getActiveProducts = async (req, res) => {
  try {
    console.log("Received request to get active products");
    const {
      sort = "-createdAt",
      category,
      brand,
      minPrice,
      maxPrice,
      sizes,
      colors,
      search,
      gender,
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (gender) query.gender = gender;

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (sizes) {
      const sizeArray = sizes.split(",");
      query.sizes = { $in: sizeArray };
    }

    // Color filter
    if (colors) {
      const colorArray = colors.split(",");
      query["colors.name"] = { $in: colorArray };
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with sorting and populate brand information
    const products = await Product.find(query)
      .populate("brand", "name logo website")
      .sort(sort);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { products },
          "Active products fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while fetching active products"
    );
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("brand");

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched successfully"));
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
      gender,
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !price || !brand || !gender) {
      throw new ApiError(400, "All required fields must be provided");
    }

    // Check if brand exists
    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      throw new ApiError(404, "Brand not found");
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
      gender,
      isActive: true,
    });

    // Increment brand product count
    brandExists.productsCount += 1;
    await brandExists.save();

    // Populate brand information in the response
    await product.populate("brand");

    return res
      .status(201)
      .json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while creating product");
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log("This is updated data from admin ", updateData);

    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check if brand is being changed
    const oldBrandId = product.brand.toString();
    const newBrandId = updateData.brand
      ? updateData.brand.toString()
      : oldBrandId;

    // Update product fields
    Object.keys(updateData).forEach((key) => {
      product[key] = updateData[key];
    });

    // Save the updated product
    const updatedProduct = await product.save();

    // If brand has changed, update product counts for both old and new brands
    if (newBrandId !== oldBrandId) {
      // Decrement old brand product count
      const oldBrand = await Brand.findById(oldBrandId);
      if (oldBrand) {
        oldBrand.productsCount = Math.max(0, oldBrand.productsCount - 1);
        await oldBrand.save();
      }

      // Increment new brand product count
      const newBrand = await Brand.findById(newBrandId);
      if (newBrand) {
        newBrand.productsCount += 1;
        await newBrand.save();
      }
    }

    // Populate brand information in the response
    await updatedProduct.populate("brand");

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while updating product");
  }
};

// Delete product (soft delete by setting isActive to false)
export const deleteProduct = async (req, res) => {
  try {
    console.log("Received request to delete product");
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // If product is already inactive, no need to update brand count
    if (product.isActive) {
      // Soft delete
      product.isActive = false;
      await product.save();

      // Decrement brand product count
      const brand = await Brand.findById(product.brand);
      if (brand) {
        brand.productsCount = Math.max(0, brand.productsCount - 1);
        await brand.save();
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully"));
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

    // Get brand ID before deleting the product
    const brandId = product.brand;

    // Hard delete
    await Product.findByIdAndDelete(id);

    // Decrement brand product count if product was active
    if (product.isActive) {
      const brand = await Brand.findById(brandId);
      if (brand) {
        brand.productsCount = Math.max(0, brand.productsCount - 1);
        await brand.save();
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product permanently deleted"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while permanently deleting product"
    );
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

    // Populate brand information in the response
    await product.populate("brand");

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Inventory updated successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while updating inventory");
  }
};

// Get trending products
export const getTrendingProducts = async (req, res) => {
  try {
    const { active, gender } = req.query;

    let query = {};

    // If active parameter is provided, add it to the query
    if (active !== undefined) {
      query.isActive = active === "true";
    } else {
      // By default, only return active products
      query.isActive = true;
    }

    // Add gender filter if provided
    if (gender) {
      query.gender = gender;
    }

    const products = await Product.find(query)
      .populate("brand", "name description logo website productsCount")
      .sort({ favoritesCount: -1 })
      .limit(10);

    return res
      .status(200)
      .json(
        new ApiResponse(200, products, "Trending products fetched successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while fetching trending products"
    );
  }
};

// Get products by category with pagination
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { sort = "-createdAt", active, page = 1, limit = 20, gender } = req.query;
    console.log("Category:", category);

    let query = { category };

    // If active parameter is provided, add it to the query
    if (active !== undefined) {
      query.isActive = active === "true";
    }
    
    // Add gender filter if provided
    if (gender) {
      query.gender = gender;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("brand", "name description logo website productsCount")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
        `Products in ${category} category fetched successfully`
      )
    );
  } catch (error) {
    console.log("Error:", error);
    throw new ApiError(
      500,
      error?.message || "Error while fetching products by category"
    );
  }
};
