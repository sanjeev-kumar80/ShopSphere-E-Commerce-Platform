const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

const createProduct = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            shortDescription,
            category,
            brand,
            images,
            variants,
            tags,
            isFeatured,
            seo
        } = req.body;

        if (!name || !slug || !description || !category || !variants) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, slug, description, category and variants are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const categoryExists = await Category.findOne({
            _id: category,
            isActive: true
        });

        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if (brand) {
            if (!mongoose.Types.ObjectId.isValid(brand)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid brand ID"
                });
            }

            const brandExists = await Brand.findOne({
                _id: brand,
                isActive: true
            });

            if (!brandExists) {
                return res.status(404).json({
                    success: false,
                    message: "Brand not found"
                });
            }
        }

        const existingProduct = await Product.findOne({
            $or: [{ slug }, { name }]
        });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product with same name or slug already exists"
            });
        }

        const product = await Product.create({
            name,
            slug,
            description,
            shortDescription,
            category,
            brand: brand || null,
            images: images || [],
            variants,
            tags: tags || [],
            isFeatured: isFeatured || false,
            seo
        });

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name slug")
            .populate("brand", "name slug logo");

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: {
                product: populatedProduct
            }
        });
    } catch (error) {
        console.error("Create product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            brand,
            minPrice,
            maxPrice,
            minRating,
            featured,
            sort = "newest",
            page = 1,
            limit = 12
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const productsPerPage = Math.min(
            Math.max(Number(limit), 1),
            50
        );

        const filter = {
            isActive: true
        };

        // Search
        if (search) {
            filter.$text = {
                $search: search
            };
        }

        // Category
        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID"
                });
            }

            filter.category = category;
        }

        // Brand
        if (brand) {
            if (!mongoose.Types.ObjectId.isValid(brand)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid brand ID"
                });
            }

            filter.brand = brand;
        }

        // Price
        if (minPrice || maxPrice) {
            filter["variants.price"] = {};

            if (minPrice) {
                filter["variants.price"].$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter["variants.price"].$lte = Number(maxPrice);
            }
        }

        // Rating
        if (minRating) {
            filter.rating = {
                $gte: Number(minRating)
            };
        }

        // Featured
        if (featured === "true") {
            filter.isFeatured = true;
        }

        // Sorting
        let sortOption = {};

        switch (sort) {
            case "price-low":
                sortOption = {
                    "variants.price": 1
                };
                break;

            case "price-high":
                sortOption = {
                    "variants.price": -1
                };
                break;

            case "rating":
                sortOption = {
                    rating: -1
                };
                break;

            case "oldest":
                sortOption = {
                    createdAt: 1
                };
                break;

            case "newest":
            default:
                sortOption = {
                    createdAt: -1
                };
        }

        const skip = (currentPage - 1) * productsPerPage;

        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug")
                .populate("brand", "name slug logo")
                .sort(sortOption)
                .skip(skip)
                .limit(productsPerPage),

            Product.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(
            totalProducts / productsPerPage
        );

        return res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage,
                    productsPerPage,
                    totalProducts,
                    totalPages,
                    hasNextPage: currentPage < totalPages,
                    hasPreviousPage: currentPage > 1
                }
            }
        });
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findOne({
            _id: id,
            isActive: true
        })
            .populate("category", "name slug")
            .populate("brand", "name slug logo");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                product
            }
        });
    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({
            slug,
            isActive: true
        })
            .populate("category", "name slug")
            .populate("brand", "name slug logo");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                product
            }
        });
    } catch (error) {
        console.error("Get product by slug error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        )
            .populate("category", "name slug")
            .populate("brand", "name slug logo");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: {
                product
            }
        });
    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            {
                isActive: false
            },
            {
                new: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct
};