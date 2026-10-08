const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Order = require("../models/Order");
const razorpay = require("../config/razorpay");


// Create Razorpay Order
const createPaymentOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.paymentMethod !== "RAZORPAY") {
            return res.status(400).json({
                success: false,
                message: "This order does not use Razorpay"
            });
        }

        if (order.paymentStatus === "PAID") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid"
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100),
            currency: "INR",
            receipt: order._id.toString()
        });

        return res.status(201).json({
            success: true,
            message: "Razorpay order created",
            data: {
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID
            }
        });

    } catch (error) {
        console.error("Create payment order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create payment order"
        });
    }
};


module.exports = {
    createPaymentOrder
};