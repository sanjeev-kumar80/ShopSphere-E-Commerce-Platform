const express = require("express");

const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public
router.get("/", getCategories);

// Admin
router.post(
    "/",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    createCategory
);

router.put(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    updateCategory
);

router.delete(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    deleteCategory
);

module.exports = router;