const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");


const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Logging
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/wishlist", wishlistRoutes);


// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ShopSphere API is running"
    });
});

module.exports = app;