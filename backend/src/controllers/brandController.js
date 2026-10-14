const Brand = require("../models/Brand");

const createBrand = async (req, res) => {
    try {
        const { name, slug, logo, description } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: "Name and slug are required"
            });
        }

        const existingBrand = await Brand.findOne({ slug });

        if (existingBrand) {
            return res.status(409).json({
                success: false,
                message: "Brand already exists"
            });
        }

        const brand = await Brand.create({
            name,
            slug,
            logo,
            description
        });

        return res.status(201).json({
            success: true,
            message: "Brand created successfully",
            data: {
                brand
            }
        });
    } catch (error) {
        console.error("Create brand error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({
            isActive: true
        }).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: brands.length,
            data: {
                brands
            }
        });
    } catch (error) {
        console.error("Get brands error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: {
                brand
            }
        });
    } catch (error) {
        console.error("Update brand error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findByIdAndUpdate(
            id,
            {
                isActive: false
            },
            {
                new: true
            }
        );

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Brand deleted successfully"
        });
    } catch (error) {
        console.error("Delete brand error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createBrand,
    getBrands,
    updateBrand,
    deleteBrand
};