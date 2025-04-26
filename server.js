import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./src/config/db.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Import routes
import userRoutes from "./src/routes/userRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import backgroundRoutes from "./src/routes/backgroundRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import brandRoutes from "./src/routes/brandRoutes.js";
import authAuthRoutes from "./src/routes/adminAuthRoutes.js";
import messageRoutes from "./src/routes/messageRouter.js";
import tryonResultRoutes from "./src/routes/tryonResultRoutes.js";
import pollRoutes from "./src/routes/pollRoutes.js";
import groupRoutes from "./src/routes/groupRoutes.js";

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/backgrounds", backgroundRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/auth", authAuthRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/tryonresults", tryonResultRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/groups", groupRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
