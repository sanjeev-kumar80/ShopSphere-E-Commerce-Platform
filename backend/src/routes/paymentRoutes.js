const express = require("express");

const {
    createPaymentOrder
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-order", protect, createPaymentOrder);

module.exports = router;