const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },

                productName: {
                    type: String,
                    required: true
                },

                sku: {
                    type: String,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0
                },

                subtotal: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine: String,
            city: String,
            state: String,
            pincode: String,
            landmark: String
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        shippingFee: {
            type: Number,
            default: 0,
            min: 0
        },

        total: {
            type: Number,
            required: true,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "RAZORPAY"],
            required: true
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
            default: "PENDING"
        },
        razorpayOrderId: {
                type: String,
                default: null,
                },

        orderStatus: {
            type: String,
            enum: [
                "PLACED",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "PLACED"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);  