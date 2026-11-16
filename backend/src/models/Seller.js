const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        storeName: {
            type: String,
            required: [true, "Store name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100
        },
        businessAddress: {
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            country: { type: String, default: "India" },
            pincode: { type: String, default: "" }
        },
        businessDescription: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },
        businessCategory: {
            type: String,
            trim: true,
            default: "General Retail"
        },
        gstin: {
            type: String,
            trim: true,
            default: ""
        },
        logo: {
            url: { type: String, default: "" },
            publicId: { type: String, default: "" }
        },
        banner: {
            url: { type: String, default: "" },
            publicId: { type: String, default: "" }
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
            default: "PENDING",
            index: true
        },
        rejectionReason: {
            type: String,
            default: ""
        },
        approvedAt: {
            type: Date
        },
        rating: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        totalSales: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Seller", sellerSchema);
