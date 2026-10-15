const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { uploadImage } = require("../services/cloudinaryService");

/**
 * @desc    Submit a review for a product
 * @route   POST /api/reviews
 * @route   POST /api/products/:productId/reviews
 * @access  Private
 */
const createReview = async (req, res) => {
    try {
        const productId = req.params.productId || req.body.productId || req.body.product;
        const { rating, title, comment } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required"
            });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Validate rating
        const numRating = Number(rating);
        if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
            return res.status(400).json({
                success: false,
                message: "Rating must be an integer between 1 and 5"
            });
        }

        // Validate title
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Review title is required"
            });
        }

        if (title.trim().length > 120) {
            return res.status(400).json({
                success: false,
                message: "Review title cannot exceed 120 characters"
            });
        }

        // Validate comment
        if (!comment || typeof comment !== "string" || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "Review comment is required"
            });
        }

        if (comment.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Review comment cannot exceed 2000 characters"
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            user: req.user._id,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product. You can edit your existing review."
            });
        }

        // Check verified purchase status: user placed an order containing this product that is not cancelled
        const verifiedOrder = await Order.findOne({
            user: req.user._id,
            "items.product": productId,
            orderStatus: { $ne: "CANCELLED" }
        });

        const isVerifiedPurchase = Boolean(verifiedOrder);

        // Process optional review photos (uploaded files or image URLs)
        const reviewImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploaded = await uploadImage(file.buffer, "shopsphere/reviews");
                    reviewImages.push({ url: uploaded.url, publicId: uploaded.publicId });
                } catch (uploadErr) {
                    console.warn("Cloudinary upload failed, storing data URL:", uploadErr.message);
                    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
                    reviewImages.push({ url: base64Data, publicId: "" });
                }
            }
        } else if (req.body.images) {
            let parsedImages = req.body.images;
            if (typeof parsedImages === "string") {
                try {
                    parsedImages = JSON.parse(parsedImages);
                } catch (e) {
                    parsedImages = [parsedImages];
                }
            }
            if (Array.isArray(parsedImages)) {
                parsedImages.forEach((img) => {
                    if (typeof img === "string" && img.trim()) {
                        reviewImages.push({ url: img.trim(), publicId: "" });
                    } else if (img && typeof img === "object" && img.url) {
                        reviewImages.push({ url: img.url, publicId: img.publicId || "" });
                    }
                });
            }
        }

        const review = await Review.create({
            user: req.user._id,
            product: productId,
            rating: numRating,
            title: title.trim(),
            comment: comment.trim(),
            isVerifiedPurchase,
            images: reviewImages
        });

        // Recalculate average rating on Product
        await Review.calculateAverageRating(productId);

        const populatedReview = await Review.findById(review._id).populate(
            "user",
            "name email"
        );

        // Fetch updated product rating data
        const updatedProduct = await Product.findById(productId, "rating reviewCount");

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: {
                review: populatedReview,
                productRating: updatedProduct?.rating || numRating,
                productReviewCount: updatedProduct?.reviewCount || 1
            }
        });
    } catch (error) {
        console.error("Create review error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * @desc    Get all reviews for a product with rating statistics and breakdown
 * @route   GET /api/reviews/product/:productId
 * @route   GET /api/products/:productId/reviews
 * @access  Public
 */
const getProductReviews = async (req, res) => {
    try {
        const productId = req.params.productId || req.params.id;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required"
            });
        }

        const product = await Product.findById(productId, "name rating reviewCount");
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Pagination and sorting
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const sortQuery = req.query.sort || "newest";
        let sortOption = { createdAt: -1 };

        switch (sortQuery) {
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "highest":
                sortOption = { rating: -1, createdAt: -1 };
                break;
            case "lowest":
                sortOption = { rating: 1, createdAt: -1 };
                break;
            case "newest":
            default:
                sortOption = { createdAt: -1 };
                break;
        }

        // Filter by rating if specified
        const filter = { product: productId };
        if (req.query.rating) {
            const filterRating = Number(req.query.rating);
            if (filterRating >= 1 && filterRating <= 5) {
                filter.rating = filterRating;
            }
        }

        // Only verified reviews filter
        if (req.query.verified === "true") {
            filter.isVerifiedPurchase = true;
        }

        const [reviews, totalMatchingReviews] = await Promise.all([
            Review.find(filter)
                .populate("user", "name email")
                .sort(sortOption)
                .skip(skip)
                .limit(limit),
            Review.countDocuments(filter)
        ]);

        // Calculate breakdown across ALL reviews for this product
        const allProductReviews = await Review.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            }
        ]);

        const breakdownCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalAllReviews = 0;
        let ratingSum = 0;

        allProductReviews.forEach((item) => {
            if (item._id >= 1 && item._id <= 5) {
                breakdownCounts[item._id] = item.count;
                totalAllReviews += item.count;
                ratingSum += item._id * item.count;
            }
        });

        const calculatedAvg = totalAllReviews > 0 ? Math.round((ratingSum / totalAllReviews) * 10) / 10 : 0;

        const breakdown = [5, 4, 3, 2, 1].map((stars) => {
            const count = breakdownCounts[stars] || 0;
            const percentage = totalAllReviews > 0 ? Math.round((count / totalAllReviews) * 100) : 0;
            return {
                stars,
                count,
                percentage
            };
        });

        const totalPages = Math.ceil(totalMatchingReviews / limit) || 1;

        return res.status(200).json({
            success: true,
            data: {
                reviews,
                stats: {
                    averageRating: product.rating || calculatedAvg,
                    totalReviews: product.reviewCount || totalAllReviews,
                    breakdown
                },
                pagination: {
                    currentPage: page,
                    reviewsPerPage: limit,
                    totalReviews: totalMatchingReviews,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error("Get product reviews error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reviews"
        });
    }
};

/**
 * @desc    Get the authenticated user's review for a product (if any)
 * @route   GET /api/reviews/product/:productId/my-review
 * @access  Private
 */
const getUserProductReview = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required"
            });
        }

        const review = await Review.findOne({
            user: req.user._id,
            product: productId
        }).populate("user", "name email");

        // Also check if user has purchased this product
        const verifiedOrder = await Order.findOne({
            user: req.user._id,
            "items.product": productId,
            orderStatus: { $ne: "CANCELLED" }
        });

        return res.status(200).json({
            success: true,
            data: {
                hasReviewed: Boolean(review),
                review: review || null,
                isVerifiedPurchase: Boolean(verifiedOrder)
            }
        });
    } catch (error) {
        console.error("Get user product review error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, title, comment } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid review ID is required"
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Authorization: Only the review author can update the review
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to edit this review"
            });
        }

        // Validate rating if provided
        if (rating !== undefined) {
            const numRating = Number(rating);
            if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be an integer between 1 and 5"
                });
            }
            review.rating = numRating;
        }

        // Validate title if provided
        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Review title cannot be empty"
                });
            }
            if (title.trim().length > 120) {
                return res.status(400).json({
                    success: false,
                    message: "Review title cannot exceed 120 characters"
                });
            }
            review.title = title.trim();
        }

        // Validate comment if provided
        if (comment !== undefined) {
            if (typeof comment !== "string" || !comment.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Review comment cannot be empty"
                });
            }
            if (comment.trim().length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: "Review comment cannot exceed 2000 characters"
                });
            }
            review.comment = comment.trim();
        }

        // Re-check verified purchase status in case order was placed later
        const verifiedOrder = await Order.findOne({
            user: req.user._id,
            "items.product": review.product,
            orderStatus: { $ne: "CANCELLED" }
        });
        if (verifiedOrder) {
            review.isVerifiedPurchase = true;
        }

        // Optional images update
        if (req.files && req.files.length > 0) {
            const newImages = [];
            for (const file of req.files) {
                try {
                    const uploaded = await uploadImage(file.buffer, "shopsphere/reviews");
                    newImages.push({ url: uploaded.url, publicId: uploaded.publicId });
                } catch (uploadErr) {
                    console.warn("Cloudinary upload failed, storing data URL:", uploadErr.message);
                    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
                    newImages.push({ url: base64Data, publicId: "" });
                }
            }
            review.images = newImages;
        } else if (req.body.images !== undefined) {
            let parsedImages = req.body.images;
            if (typeof parsedImages === "string") {
                try {
                    parsedImages = JSON.parse(parsedImages);
                } catch (e) {
                    parsedImages = [parsedImages];
                }
            }
            if (Array.isArray(parsedImages)) {
                review.images = parsedImages
                    .map((img) => (typeof img === "string" ? { url: img, publicId: "" } : img))
                    .filter((img) => img && img.url);
            }
        }

        await review.save();

        // Recalculate average rating on Product
        await Review.calculateAverageRating(review.product);

        const populatedReview = await Review.findById(review._id).populate(
            "user",
            "name email"
        );

        const updatedProduct = await Product.findById(review.product, "rating reviewCount");

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: {
                review: populatedReview,
                productRating: updatedProduct?.rating,
                productReviewCount: updatedProduct?.reviewCount
            }
        });
    } catch (error) {
        console.error("Update review error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid review ID is required"
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Authorization: Only the review author or an ADMIN can delete the review
        const isAuthor = review.user.toString() === req.user._id.toString();
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(req.user.role);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this review"
            });
        }

        const productId = review.product;

        await Review.findByIdAndDelete(id);

        // Recalculate average rating on Product
        await Review.calculateAverageRating(productId);

        const updatedProduct = await Product.findById(productId, "rating reviewCount");

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: {
                productRating: updatedProduct?.rating || 0,
                productReviewCount: updatedProduct?.reviewCount || 0
            }
        });
    } catch (error) {
        console.error("Delete review error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    getUserProductReview,
    updateReview,
    deleteReview
};
