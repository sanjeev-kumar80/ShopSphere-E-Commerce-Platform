const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ]
    },
    {
        timestamps: true
    }
);

// Prevent duplicate products inside one wishlist
wishlistSchema.path("products").validate(function (products) {
    const ids = products.map((id) => id.toString());

    return ids.length === new Set(ids).size;
}, "Product already exists in wishlist");

module.exports = mongoose.model("Wishlist", wishlistSchema);