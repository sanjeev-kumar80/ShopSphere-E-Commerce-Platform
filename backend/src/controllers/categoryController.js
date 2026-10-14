const Category = require("../models/Category");

const createCategory = async (req, res) => {
    try {
        const { name, slug, description, image, parent, sortOrder } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: "Name and slug are required"
            });
        }

        const existingCategory = await Category.findOne({ slug });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name,
            slug,
            description,
            image,
            parent: parent || null,
            sortOrder
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: {
                category
            }
        });
    } catch (error) {
        console.error("Create category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({
            isActive: true
        })
            .sort({ sortOrder: 1, name: 1 })
            .populate("parent", "name slug");

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: {
                categories
            }
        });
    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: {
                category
            }
        });
    } catch (error) {
        console.error("Update category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndUpdate(
            id,
            {
                isActive: false
            },
            {
                new: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error("Delete category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};