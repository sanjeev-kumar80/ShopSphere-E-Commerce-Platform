const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
            index: true
        },

        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"]
        },

        title: {
            type: String,
            required: [true, "Review title is required"],
            trim: true,
            maxlength: [120, "Review title cannot exceed 120 characters"]
        },

        comment: {
            type: String,
            required: [true, "Review comment is required"],
            trim: true,
            maxlength: [2000, "Review comment cannot exceed 2000 characters"]
        },

        isVerifiedPurchase: {
            type: Boolean,
            default: false
        },

        images: {
            type: [
                {
                    url: {
                        type: String,
                        required: true
                    },
                    publicId: {
                        type: String,
                        default: ""
                    }
                }
            ],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate reviews for the same product by the same user
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to recalculate and update product rating and review count
reviewSchema.statics.calculateAverageRating = async function (productId) {
    if (!productId) return null;
    const Product = mongoose.model("Product");
    return await Product.recalculateRatings(productId);
};

// Post hooks for auto-updating rating
reviewSchema.post("save", function () {
    this.constructor.calculateAverageRating(this.product);
});

reviewSchema.post("findOneAndDelete", function (doc) {
    if (doc) {
        doc.constructor.calculateAverageRating(doc.product);
    }
});

module.exports = mongoose.model("Review", reviewSchema);
