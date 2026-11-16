const Seller = require("../models/Seller");

/**
 * Middleware to ensure the authenticated user is a Seller with a valid Seller profile.
 * Attaches req.seller to the request object.
 */
const requireSeller = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (req.user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Access restricted to sellers only"
            });
        }

        const seller = await Seller.findOne({ user: req.user._id });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller profile not found. Please contact support."
            });
        }

        req.seller = seller;
        next();
    } catch (error) {
        console.error("Seller middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error verifying seller profile"
        });
    }
};

/**
 * Middleware to check if seller account is approved before allowing operations
 * such as creating products.
 */
const requireApprovedSeller = (req, res, next) => {
    if (!req.seller) {
        return res.status(403).json({
            success: false,
            message: "Seller profile missing"
        });
    }

    if (req.seller.status !== "APPROVED") {
        return res.status(403).json({
            success: false,
            message: `Your seller account is currently ${req.seller.status.toLowerCase()}. Only approved sellers can perform this action.`,
            status: req.seller.status,
            rejectionReason: req.seller.rejectionReason || null
        });
    }

    next();
};

module.exports = {
    requireSeller,
    requireApprovedSeller
};
