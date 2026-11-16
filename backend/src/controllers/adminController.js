const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

const getAdminDashboard = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Welcome to Admin Dashboard",
        data: {
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        }
    });
};

// =====================================================
// SELLER MANAGEMENT (FOR ADMIN & SUPER ADMIN)
// =====================================================

const getAllSellers = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status && status !== "ALL") {
            filter.status = status;
        }

        if (search && search.trim()) {
            filter.$or = [
                { storeName: { $regex: search.trim(), $options: "i" } },
                { phone: { $regex: search.trim(), $options: "i" } },
                { businessCategory: { $regex: search.trim(), $options: "i" } }
            ];
        }

        const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

        const [sellers, total] = await Promise.all([
            Seller.find(filter)
                .populate("user", "name email phone isActive createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Seller.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                sellers,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error("Get sellers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sellers list"
        });
    }
};

const getSellerById = async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id)
            .populate("user", "name email phone isActive createdAt");

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        // Fetch seller's product count and orders summary
        const [productCount, orders] = await Promise.all([
            Product.countDocuments({ seller: seller._id }),
            Order.find({ "items.seller": seller._id }).select("items orderStatus total")
        ]);

        let totalRevenue = 0;
        let ordersCount = 0;
        orders.forEach((o) => {
            const items = o.items.filter((i) => i.seller && i.seller.toString() === seller._id.toString());
            if (items.length > 0) {
                ordersCount++;
                items.forEach((i) => {
                    if ((i.status || o.orderStatus) !== "CANCELLED") {
                        totalRevenue += i.subtotal || 0;
                    }
                });
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                seller,
                stats: {
                    totalProducts: productCount,
                    totalOrders: ordersCount,
                    totalRevenue
                }
            }
        });
    } catch (error) {
        console.error("Get seller by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch seller details"
        });
    }
};

const updateSellerStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const validStatuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`
            });
        }

        const seller = await Seller.findById(req.params.id);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        seller.status = status;
        if (status === "APPROVED") {
            seller.approvedAt = new Date();
            seller.rejectionReason = "";
        } else if (status === "REJECTED" || status === "SUSPENDED") {
            seller.rejectionReason = rejectionReason || "Account status updated by administrator";
        }

        await seller.save();

        return res.status(200).json({
            success: true,
            message: `Seller account status updated to ${status}`,
            data: { seller }
        });
    } catch (error) {
        console.error("Update seller status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update seller status"
        });
    }
};

// =====================================================
// PRODUCT APPROVALS (FOR ADMIN & SUPER ADMIN)
// =====================================================

const getPendingProducts = async (req, res) => {
    try {
        const { status = "PENDING", page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status !== "ALL") {
            filter.approvalStatus = status;
        }

        const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("seller", "storeName phone status")
                .populate("category", "name")
                .populate("brand", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                products,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error("Get pending products error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending products"
        });
    }
};

const updateProductApprovalStatus = async (req, res) => {
    try {
        const { approvalStatus, rejectionReason } = req.body;

        if (!["APPROVED", "REJECTED", "PENDING"].includes(approvalStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be APPROVED, REJECTED, or PENDING"
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.approvalStatus = approvalStatus;
        if (approvalStatus === "REJECTED") {
            product.rejectionReason = rejectionReason || "Product does not meet marketplace standards";
        } else if (approvalStatus === "APPROVED") {
            product.rejectionReason = "";
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: `Product listing has been ${approvalStatus.toLowerCase()}`,
            data: { product }
        });
    } catch (error) {
        console.error("Update product approval error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update product approval status"
        });
    }
};

module.exports = {
    getAdminDashboard,
    getAllSellers,
    getSellerById,
    updateSellerStatus,
    getPendingProducts,
    updateProductApprovalStatus
};
