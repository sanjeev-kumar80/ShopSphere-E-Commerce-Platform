const express = require("express");

const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCart);

router.post("/items", protect, addToCart);

router.put("/items/:id", protect, updateCartItem);

router.delete("/items/:id", protect, removeFromCart);

router.delete("/", protect, clearCart);

module.exports = router;