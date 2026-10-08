const User = require("../models/User");
const jwt = require("jsonwebtoken");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/token");


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password
        });

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token in DB
        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false
        });

        // Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Response
        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                accessToken
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Find user
        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password +refreshToken");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is disabled"
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        user.refreshToken = refreshToken;
        user.lastLoginAt = new Date();

        await user.save({
            validateBeforeSave: false
        });

        // Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Response
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                accessToken
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================

const refreshAccessToken = async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token missing"
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // Find user and include refresh token
        const user = await User.findById(decoded.userId)
            .select("+refreshToken");

        // Token must match DB token
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Check account
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is disabled"
            });
        }

        // Generate new access token
        const accessToken = generateAccessToken(user);

        res.status(200).json({
            success: true,
            message: "Access token refreshed",
            data: {
                accessToken
            }
        });

    } catch (error) {
        console.error("Refresh token error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        // Remove refresh token from DB
        if (refreshToken) {
            await User.findOneAndUpdate(
                { refreshToken },
                {
                    $unset: {
                        refreshToken: 1
                    }
                }
            );
        }

        // Remove cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        console.error("Logout error:", error);

        res.status(500).json({
            success: false,
            message: "Logout failed"
        });
    }
};


// =====================================================
// GET CURRENT USER
// =====================================================

const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user
            }
        });

    } catch (error) {
        console.error("Get me error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login,
    refreshAccessToken,
    logout,
    getMe
};