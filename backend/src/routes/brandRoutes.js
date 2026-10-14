const express = require("express");

const {
    createBrand,
    getBrands,
    updateBrand,
    deleteBrand
} = require("../controllers/brandController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getBrands);

router.post(
    "/",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    createBrand
);

router.put(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    updateBrand
);

router.delete(
    "/:id",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    deleteBrand
);

module.exports = router;