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

const {
    createProductValidator,
    updateProductValidator,
    productIdValidator,
    validateRequest
} = require("../validators/productValidator");

const router = express.Router();


// Public routes

router.get("/", getProducts);

router.get("/slug/:slug", getProductBySlug);

router.get(
    "/:id",
    productIdValidator,
    validateRequest,
    getProductById
);


// Admin routes

router.post(
    "/",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    createProductValidator,
    validateRequest,
    createProduct
);

router.put(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    updateProductValidator,
    validateRequest,
    updateProduct
);

router.delete(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    productIdValidator,
    validateRequest,
    deleteProduct
);


module.exports = router;