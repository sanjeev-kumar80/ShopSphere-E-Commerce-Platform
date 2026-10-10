const express = require("express");

const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
} = require("../controllers/wishlistController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// Get user's wishlist
router.get(
    "/",
    protect,
    getWishlist
);


// Add product
router.post(
    "/:productId",
    protect,
    addToWishlist
);


// Remove product
router.delete(
    "/:productId",
    protect,
    removeFromWishlist
);


// Clear wishlist
router.delete(
    "/",
    protect,
    clearWishlist
);


module.exports = router;