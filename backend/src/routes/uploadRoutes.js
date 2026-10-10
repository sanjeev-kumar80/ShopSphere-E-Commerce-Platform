const express = require("express");

const { uploadProductImage } = require("../controllers/uploadController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
    "/product-image",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    upload.single("image"),
    uploadProductImage
);

module.exports = router;