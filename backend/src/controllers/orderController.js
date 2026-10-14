const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Product = require("../models/Product");
const Order = require("../models/Order");


// Place Order
const createOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        if (!["COD", "RAZORPAY"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        // Get Cart
        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Get Address
        const address = await Address.findOne({
            _id: addressId,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const orderItems = [];
        let subtotal = 0;

        // Validate Cart Items
        for (const item of cart.items) {
            const product = await Product.findOne({
                _id: item.product,
                isActive: true
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "One of the products is no longer available"
                });
            }

            const variant = product.variants.id(item.variantId);

            if (!variant || !variant.isActive) {
                return res.status(400).json({
                    success: false,
                    message: "One of the variants is no longer available"
                });
            }

            if (variant.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is out of stock`
                });
            }

            const itemSubtotal = variant.price * item.quantity;

            orderItems.push({
                product: product._id,
                variantId: variant._id,
                productName: product.name,
                sku: variant.sku,
                quantity: item.quantity,
                price: variant.price,
                subtotal: itemSubtotal
            });

            subtotal += itemSubtotal;
        }

        const shippingFee = subtotal >= 1000 ? 0 : 50;
        const total = subtotal + shippingFee;

        const order = await Order.create({
            user: req.user._id,

            items: orderItems,

            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                addressLine: address.addressLine,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                landmark: address.landmark
            },

            subtotal,
            shippingFee,
            total,

            paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PLACED"
        });


        // Reduce stock
          for (const item of cart.items) {
              const product = await Product.findById(item.product);

              const variant = product.variants.id(item.variantId);

              variant.stock -= item.quantity;

              await product.save();
          }

        // Clear Cart
        cart.items = [];
        cart.total = 0;

        await cart.save();

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: order
        });

    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to place order"
        });
    }
};


// Get My Orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id
        })
            .populate("items.product", "name slug images")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get orders"
        });
    }
};


// Get Single Order
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        }).populate("items.product", "name slug images");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get order"
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            order.orderStatus === "SHIPPED" ||
            order.orderStatus === "DELIVERED" ||
            order.orderStatus === "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order cannot be cancelled"
            });
        }

        // Restore stock
        for (const item of order.items) {
            const product = await Product.findById(item.product);

            if (product) {
                const variant = product.variants.id(item.variantId);

                if (variant) {
                    variant.stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.orderStatus = "CANCELLED";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });

    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order"
        });
    }
};




 // Admin: Get All Orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("items.product", "name slug images")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get orders"
        });
    }
};


// Admin: Update Order Status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const allowedStatuses = [
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED"
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            order.orderStatus === "CANCELLED" ||
            order.orderStatus === "DELIVERED"
        ) {
            return res.status(400).json({
                success: false,
                message: "This order can no longer be updated"
            });
        }

        if (
            order.orderStatus === "SHIPPED" &&
            ["CONFIRMED", "PROCESSING"].includes(orderStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "A shipped order cannot move to an earlier status"
            });
        }

        // Restore stock when the admin cancels an order
        if (orderStatus === "CANCELLED") {
            if (order.orderStatus === "SHIPPED") {
                return res.status(400).json({
                    success: false,
                    message: "A shipped order cannot be cancelled here"
                });
            }

            for (const item of order.items) {
                const product = await Product.findById(item.product);

                if (product) {
                    const variant = product.variants.id(item.variantId);

                    if (variant) {
                        variant.stock += item.quantity;
                        await product.save();
                    }
                }
            }
        }

        order.orderStatus = orderStatus;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order status"
        });
    }
};  

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};