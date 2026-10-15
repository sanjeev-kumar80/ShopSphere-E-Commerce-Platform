
const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const razorpay = require("../config/razorpay");

// Create or reuse a Razorpay order for payment retry
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "RAZORPAY") {
      return res.status(400).json({
        success: false,
        message: "This order does not use Razorpay",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot be paid",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID ||
        !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay configuration is missing",
      });
    }

    const expectedAmount = Math.round(order.total * 100);
    let razorpayOrder;

    if (order.razorpayOrderId) {
      // Reuse the same Razorpay order when retrying payment.
      razorpayOrder = await razorpay.orders.fetch(
        order.razorpayOrderId
      );

      if (
        razorpayOrder.amount !== expectedAmount ||
        razorpayOrder.currency !== "INR" ||
        razorpayOrder.receipt !== order._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Razorpay order details do not match",
        });
      }
    } else {
      razorpayOrder = await razorpay.orders.create({
        amount: expectedAmount,
        currency: "INR",
        receipt: order._id.toString(),
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Razorpay order ready",
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to prepare payment. Please retry.",
    });
  }
};

// Verify payment signature and confirm payment with Razorpay
const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // The submitted Razorpay order must belong to this DB order.
    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot be confirmed",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay configuration is missing",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    // Compare signatures safely.
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Confirm the payment really belongs to this Razorpay order.
    const payment = await razorpay.payments.fetch(
      razorpayPaymentId
    );

    const expectedAmount = Math.round(order.total * 100);

    if (
      payment.order_id !== razorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the order",
      });
    }

    // Only mark the order paid after Razorpay confirms capture.
    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message:
          "Payment is not captured yet. Please retry or check payment status.",
      });
    }

    order.paymentStatus = "PAID";
    order.orderStatus = "CONFIRMED";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not verify payment. Please check payment status.",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};