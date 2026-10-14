const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Get Cart
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate("items.product", "name slug images variants");

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    total: 0
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: cart
        });

    } catch (error) {
        console.error("Get cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get cart"
        });
    }
};


// Add Item To Cart
const addToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(productId) ||
            !mongoose.Types.ObjectId.isValid(variantId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or variant ID"
            });
        }

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const variant = product.variants.id(variantId);

        if (!variant || !variant.isActive) {
            return res.status(404).json({
                success: false,
                message: "Variant not found"
            });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: [],
                total: 0
            });
        }

        const existingItem = cart.items.find(
            (item) =>
                item.product.toString() === productId &&
                item.variantId.toString() === variantId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > variant.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds available stock"
                });
            }

            existingItem.quantity = newQuantity;
            existingItem.price = variant.price;

        } else {
            cart.items.push({
                product: productId,
                variantId,
                quantity,
                price: variant.price
            });
        }

        cart.total = cart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item added to cart",
            data: cart
        });

    } catch (error) {
        console.error("Add to cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add item to cart"
        });
    }
};


// Update Cart Item
const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid cart item ID"
            });
        }

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.id(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        const product = await Product.findById(item.product);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const variant = product.variants.id(item.variantId);

        if (!variant || !variant.isActive) {
            return res.status(404).json({
                success: false,
                message: "Variant not found"
            });
        }

        if (quantity > variant.stock) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        item.quantity = quantity;
        item.price = variant.price;

        cart.total = cart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            data: cart
        });

    } catch (error) {
        console.error("Update cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update cart"
        });
    }
};


// Remove Item From Cart
const removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid cart item ID"
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.id(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        item.deleteOne();

        cart.total = cart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item removed from cart",
            data: cart
        });

    } catch (error) {
        console.error("Remove cart item error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove cart item"
        });
    }
};


// Clear Cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = [];
        cart.total = 0;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            data: cart
        });

    } catch (error) {
        console.error("Clear cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to clear cart"
        });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};