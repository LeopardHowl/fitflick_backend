import mongoose from "mongoose";
import TryonResult from "../models/tryonResultModel.js";
import { ApiResponse } from "../utils/responseUtil.js";
import { ApiError } from "../utils/errorUtil.js";

export const getUserTryonResults = async (req, res, next) => {
  try {
    const { userId } = req.params; // Fixed: changed req.param to req.params

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid user ID format"));
    }

    const tryonResults = await TryonResult.find({ userId }).populate({
      path: "product",
      select:
        "name price images description category colors sizes brand discountPrice rating",
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, tryonResults, "Tryon results fetched successfully")
      );
  } catch (error) {
    next(new ApiError(500, error?.message || "Error fetching tryon results"));
  }
};

export const createUserTryonResult = async (req, res, next) => {
  try {
    const { userId, productId, imageUrl } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid user ID format"));
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid product ID format"));
    }

    // Validate imageUrl
    if (!imageUrl || typeof imageUrl !== "string") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Image URL is required and must be a string"
          )
        );
    }

    const tryonResult = await TryonResult.create({
      userId,
      product: productId,
      imageUrl,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, tryonResult, "Tryon result created successfully")
      );
  } catch (error) {
    next(
      new ApiError(500, error?.message || "Error while creating tryon result")
    );
  }
};

export const getMostRecentTryonResult = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid user ID format"));
    }

    const mostRecentResult = await TryonResult.findOne({ userId })
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .populate({
        path: "product",
        select:
          "name price images description category colors sizes brand discountPrice rating",
      });

    if (!mostRecentResult) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No try-on results found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          mostRecentResult,
          "Most recent tryon result fetched successfully"
        )
      );
  } catch (error) {
    next(
      new ApiError(
        500,
        error?.message || "Error fetching most recent tryon result"
      )
    );
  }
};

export const deleteTryonResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid tryon result ID format"));
    }

    const tryonResult = await TryonResult.findByIdAndDelete(id);

    if (!tryonResult) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Tryon result not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Tryon result deleted successfully")
      );
  } catch (error) {
    next(new ApiError(500, error?.message || "Error deleting tryon result"));
  }
};
