const express = require("express");

const {
    getAdminDashboard
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/dashboard",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    getAdminDashboard
);

module.exports = router;