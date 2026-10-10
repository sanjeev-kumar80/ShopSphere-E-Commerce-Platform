const User = require("../models/User");
const jwt = require("jsonwebtoken");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/token");

const {
    generateRandomToken,
    hashToken
} = require("../utils/randomToken");

const { sendEmail } = require("../services/emailService");



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

        const verificationToken = generateRandomToken();

        user.emailVerificationToken = hashToken(verificationToken);

        user.emailVerificationExpires =
            Date.now() + 15 * 60 * 1000;

        await user.save({
            validateBeforeSave: false
        });

        const verificationUrl =
        `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        await sendEmail({
            to: user.email,
            subject: "Verify your ShopSphere account",
            html: `
                <h2>Welcome to ShopSphere</h2>

                <p>Hello ${user.name},</p>

                <p>
                    Please verify your email address by clicking the button below.
                </p>

                <a href="${verificationUrl}">
                    Verify Email
                </a>

                <p>
                    This link expires in 15 minutes.
                </p>
            `
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

        // if (!user.isEmailVerified) {
        //   return res.status(403).json({
        //       success: false,
        //       message: "Please verify your email before logging in"
        //   });
// }

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





const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required"
            });
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: {
                $gt: new Date()
            }
        }).select(
            "+emailVerificationToken +emailVerificationExpires"
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            });
        }

        user.isEmailVerified = true;

        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save({
            validateBeforeSave: false
        });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error("Verify email error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+passwordResetToken +passwordResetExpires");

        // Security: user exist karta hai ya nahi, reveal nahi karna
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account exists, a password reset email has been sent"
            });
        }

        const resetToken = generateRandomToken();

        user.passwordResetToken = hashToken(resetToken);

        user.passwordResetExpires =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save({
            validateBeforeSave: false
        });

        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: "Reset your ShopSphere password",
            html: `
                <h2>Password Reset</h2>

                <p>Hello ${user.name},</p>

                <p>
                    We received a request to reset your ShopSphere password.
                </p>

                <a href="${resetUrl}">
                    Reset Password
                </a>

                <p>
                    This link expires in 15 minutes.
                </p>

                <p>
                    If you did not request this, you can safely ignore this email.
                </p>
            `
        });

        return res.status(200).json({
            success: true,
            message: "If an account exists, a password reset email has been sent"
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                $gt: new Date()
            }
        }).select(
            "+passwordResetToken +passwordResetExpires +refreshToken"
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // New password
        user.password = password;

        // Reset token ko invalidate karo
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Purana refresh token bhi invalidate
        user.refreshToken = undefined;

        // Password change time
        user.passwordChangedAt = new Date();

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters"
            });
        }

        const user = await User.findById(req.user._id)
            .select("+password +refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordValid =
            await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        user.password = newPassword;
        user.passwordChangedAt = new Date();

        // Existing refresh session invalidate
        user.refreshToken = undefined;

        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please login again."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        }).select(
            "+emailVerificationToken +emailVerificationExpires"
        );

        // Don't reveal whether account exists
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists, a verification email has been sent"
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Generate new verification token
        const verificationToken = generateRandomToken();

        user.emailVerificationToken = hashToken(verificationToken);

        user.emailVerificationExpires =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save({
            validateBeforeSave: false
        });

        const verificationUrl =
            `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        await sendEmail({
            to: user.email,
            subject: "Verify your ShopSphere account",
            html: `
                <h2>Verify your ShopSphere account</h2>

                <p>Hello ${user.name},</p>

                <p>
                    Please click the button below to verify your email address.
                </p>

                <a href="${verificationUrl}">
                    Verify Email
                </a>

                <p>
                    This link expires in 15 minutes.
                </p>

                <p>
                    If you did not request this email, you can safely ignore it.
                </p>
            `
        });

        return res.status(200).json({
            success: true,
            message:
                "If an account exists, a verification email has been sent"
        });

    } catch (error) {
        console.error("Resend verification error:", error);

        return res.status(500).json({
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
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    resendVerificationEmail,
    getMe
};