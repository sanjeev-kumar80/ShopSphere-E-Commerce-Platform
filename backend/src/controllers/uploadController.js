const { uploadImage } = require("../services/cloudinaryService");

const uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

        const result = await uploadImage(
            req.file.buffer,
            "shopsphere/products"
        );

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            data: result
        });

    } catch (error) {
        console.error("Image upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload image"
        });
    }
};

module.exports = {
    uploadProductImage
};