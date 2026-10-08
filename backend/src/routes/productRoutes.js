const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);

// Admin
router.post(
    "/",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    createProduct
);

router.put(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    deleteProduct
);

module.exports = router;