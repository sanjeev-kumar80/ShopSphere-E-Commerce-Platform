const express = require("express");
const {
    createReview,
    getProductReviews,
    getUserProductReview,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router({ mergeParams: true });

// Public routes
router.get("/product/:productId", getProductReviews);
router.get("/", getProductReviews); // when mounted under /api/products/:productId/reviews

// Protected routes
router.get("/product/:productId/my-review", protect, getUserProductReview);
router.get("/my-review", protect, getUserProductReview);

router.post("/product/:productId", protect, upload.array("images", 5), createReview);
router.post("/", protect, upload.array("images", 5), createReview);

router.put("/:id", protect, upload.array("images", 5), updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
