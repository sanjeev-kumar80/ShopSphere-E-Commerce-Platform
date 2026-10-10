const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        slug: {
            type: String,
            required: [true, "Category slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500
        },

        image: {
            type: String,
            default: ""
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        sortOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Category", categorySchema);