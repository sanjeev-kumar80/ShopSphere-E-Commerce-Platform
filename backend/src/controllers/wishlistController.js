const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// GET /api/wishlist
const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({
            user: req.user._id
        }).populate({
            path: "products",
            select: "name slug images variants rating reviewCount isActive",
            populate: [
                {
                    path: "category",
                    select: "name slug"
                },
                {
                    path: "brand",
                    select: "name slug"
                }
            ]
        });

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                data: {
                    products: []
                }
            });
        }

        // Remove inactive products from response
        const activeProducts = wishlist.products.filter(
            (product) => product && product.isActive
        );

        return res.status(200).json({
            success: true,
            data: {
                products: activeProducts,
                count: activeProducts.length
            }
        });

    } catch (error) {
        console.error("Get wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist"
        });
    }
};


// POST /api/wishlist/:productId
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

       if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
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

        let wishlist = await Wishlist.findOne({
            user: req.user._id
        });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                products: [productId]
            });

            return res.status(201).json({
                success: true,
                message: "Product added to wishlist",
                data: wishlist
            });
        }

        const alreadyExists = wishlist.products.some(
            (id) => id.toString() === productId
        );

        if (alreadyExists) {
            return res.status(409).json({
                success: false,
                message: "Product already exists in wishlist"
            });
        }

        wishlist.products.push(productId);

        await wishlist.save();

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist",
            data: wishlist
        });

    } catch (error) {
        console.error("Add wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add product to wishlist"
        });
    }
};


// DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({
            user: req.user._id
        });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        const productExists = wishlist.products.some(
            (id) => id.toString() === productId
        );

        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: "Product is not in wishlist"
            });
        }

        wishlist.products = wishlist.products.filter(
            (id) => id.toString() !== productId
        );

        await wishlist.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist",
            data: wishlist
        });

    } catch (error) {
        console.error("Remove wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove product from wishlist"
        });
    }
};


// DELETE /api/wishlist
const clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOneAndUpdate(
            {
                user: req.user._id
            },
            {
                $set: {
                    products: []
                }
            },
            {
                new: true
            }
        );

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wishlist cleared",
            data: wishlist
        });

    } catch (error) {
        console.error("Clear wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to clear wishlist"
        });
    }
};


module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
};