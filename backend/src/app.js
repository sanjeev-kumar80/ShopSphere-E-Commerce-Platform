const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

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

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ShopSphere API is running"
    });
});

module.exports = app;