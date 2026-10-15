const express = require("express");

const {
    register,
    login,
    logout,
    refreshAccessToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    resendVerificationEmail,
    validateResetToken,
    getMe,
    getProfile,
    updateProfile
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

router.get("/verify-email/:token", verifyEmail);
router.post("/verify-email/:token", verifyEmail);
router.post("/verify-email", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.get("/reset-password/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);
router.post("/reset-password", resetPassword);

router.post("/change-password", protect, changePassword);
router.post("/resend-verification", resendVerificationEmail);

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;