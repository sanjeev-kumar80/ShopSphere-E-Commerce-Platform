const express = require("express");
const {
    registerSeller,
    getSellerProfile,
    updateSellerProfile,
    getSellerDashboard,
    getSellerProducts,
    createSellerProduct,
    updateSellerProduct,
    deleteSellerProduct,
    updateInventoryStock,
    getSellerOrders,
    updateSellerOrderItemStatus,
    getSellerSalesAnalytics
} = require("../controllers/sellerController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { requireSeller, requireApprovedSeller } = require("../middleware/sellerMiddleware");

const router = express.Router();

// ----------------------------------------------------
// Public Seller Routes
// ----------------------------------------------------
router.post("/register", registerSeller);

// ----------------------------------------------------
// Protected Seller Routes (Requires authentication & SELLER role)
// ----------------------------------------------------
router.use(protect);
router.use(authorize("SELLER"));
router.use(requireSeller);

// Profile
router.get("/profile", getSellerProfile);
router.put("/profile", updateSellerProfile);

// Dashboard overview
router.get("/dashboard", getSellerDashboard);

// Analytics
router.get("/analytics", getSellerSalesAnalytics);

// Product management
router.get("/products", getSellerProducts);
router.post("/products", requireApprovedSeller, createSellerProduct);
router.put("/products/:id", requireApprovedSeller, updateSellerProduct);
router.delete("/products/:id", deleteSellerProduct);
router.patch("/products/:id/stock", requireApprovedSeller, updateInventoryStock);

// Order management
router.get("/orders", getSellerOrders);
router.patch("/orders/:orderId/items/status", updateSellerOrderItemStatus);

module.exports = router;
