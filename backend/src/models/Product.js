const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: [true, "SKU is required"],
            unique: true,
            trim: true,
            uppercase: true
        },

        attributes: {
            type: Map,
            of: String,
            default: {}
        },

        price: {
            type: Number,
            required: [true, "Variant price is required"],
            min: 0
        },

        compareAtPrice: {
            type: Number,
            min: 0
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        images: {
            type: [String],
            default: []
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        _id: true
    }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: 2,
            maxlength: 200
        },

        slug: {
            type: String,
            required: [true, "Product slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true
        },

        shortDescription: {
            type: String,
            trim: true,
            maxlength: 500
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            index: true
        },

        images: {
            type: [String],
            default: []
        },

        variants: {
            type: [variantSchema],
            validate: {
                validator: function (variants) {
                    return variants.length > 0;
                },
                message: "At least one product variant is required"
            }
        },

        tags: {
            type: [String],
            default: [],
            index: true
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            default: 0,
            min: 0
        },

        isFeatured: {
            type: Boolean,
            default: false,
            index: true
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        seo: {
            title: {
                type: String,
                trim: true,
                maxlength: 200
            },

            description: {
                type: String,
                trim: true,
                maxlength: 500
            },

            keywords: {
                type: [String],
                default: []
            }
        }
    },
    {
        timestamps: true
    }
);

// Useful for search
productSchema.index({
    name: "text",
    description: "text",
    tags: "text"
});

// Price filtering/sorting ke liye
productSchema.index({
    category: 1,
    isActive: 1,
    createdAt: -1
});

module.exports = mongoose.model("Product", productSchema);