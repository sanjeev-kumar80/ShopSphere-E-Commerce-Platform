const express = require("express");

const {
    getAdminDashboard,
    getAllSellers,
    getSellerById,
    updateSellerStatus,
    getPendingProducts,
    updateProductApprovalStatus
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", getAdminDashboard);

// Seller moderation
router.get("/sellers", getAllSellers);
router.get("/sellers/:id", getSellerById);
router.patch("/sellers/:id/status", updateSellerStatus);

// Product listing moderation
router.get("/products/pending", getPendingProducts);
router.patch("/products/:id/approval", updateProductApprovalStatus);

module.exports = router;
