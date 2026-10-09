
const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Customer routes
router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.post("/:id/cancel", protect, cancelOrder);

// Admin routes — keep before the generic /:id route
router.get(
    "/admin/all",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    getAllOrders
);

router.patch(
    "/admin/:id/status",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    updateOrderStatus
);

// Customer: get a single order
router.get("/:id", protect, getOrderById);

module.exports = router;