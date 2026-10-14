const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const slugify = require("../utils/slug");

const {uploadImage,deleteImage} = require("../services/cloudinaryService");

const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            shortDescription,
            category,
            brand,
            images,
            variants,
            tags,
            rating,
            reviewCount,
            isFeatured,
            isActive,
            seo
        } = req.body;

        const categoryExists = await Category.findOne({
            _id: category,
            isActive: true
        });

        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "Invalid or inactive category"
            });
        }

        if (brand) {
            const brandExists = await Brand.findOne({
                _id: brand,
                isActive: true
            });

            if (!brandExists) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or inactive brand"
                });
            }
        }

        // Check duplicate SKUs inside the same product
        const skuList = variants.map((variant) =>
            variant.sku.trim().toUpperCase()
        );

        const uniqueSkus = new Set(skuList);

        if (uniqueSkus.size !== skuList.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate SKU found in product variants"
            });
        }

        // Generate slug automatically
        const baseSlug = slugify(name);

        let slug = baseSlug;
        let counter = 1;

        while (await Product.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const product = await Product.create({
            name,
            slug,
            description,
            shortDescription,
            category,
            brand,
            images,
            variants,
            tags,
            rating,
            reviewCount,
            isFeatured,
            isActive,
            seo
        });

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name slug")
            .populate("brand", "name slug");

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: populatedProduct
        });

    } catch (error) {
        console.error("Create product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message
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
            tags,
            inStock,
            sort = "newest",
            page = 1,
            limit = 20
        } = req.query;

        const filter = {
            isActive: true
        };

        // -------------------------
        // Search
        // -------------------------

        if (search && search.trim()) {
            filter.$text = {
                $search: search.trim()
            };
        }

        // -------------------------
        // Category filter
        // -------------------------

        if (category) {
            const categories = category.split(",");

            const validCategories = categories.filter((id) =>
                mongoose.Types.ObjectId.isValid(id)
            );

            if (validCategories.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID"
                });
            }

            filter.category = {
                $in: validCategories
            };
        }

        // -------------------------
        // Brand filter
        // -------------------------

        if (brand) {
            const brands = brand.split(",");

            const validBrands = brands.filter((id) =>
                mongoose.Types.ObjectId.isValid(id)
            );

            if (validBrands.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid brand ID"
                });
            }

            filter.brand = {
                $in: validBrands
            };
        }

        // -------------------------
        // Price filter
        // -------------------------

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter["variants.price"] = {};

            if (minPrice !== undefined) {
                const min = Number(minPrice);

                if (Number.isNaN(min) || min < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid minimum price"
                    });
                }

                filter["variants.price"].$gte = min;
            }

            if (maxPrice !== undefined) {
                const max = Number(maxPrice);

                if (Number.isNaN(max) || max < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid maximum price"
                    });
                }

                filter["variants.price"].$lte = max;
            }

            if (
                minPrice !== undefined &&
                maxPrice !== undefined &&
                Number(minPrice) > Number(maxPrice)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Minimum price cannot be greater than maximum price"
                });
            }
        }

        // -------------------------
        // Rating filter
        // -------------------------

        if (minRating !== undefined) {
            const rating = Number(minRating);

            if (
                Number.isNaN(rating) ||
                rating < 0 ||
                rating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 0 and 5"
                });
            }

            filter.rating = {
                $gte: rating
            };
        }

        // -------------------------
        // Featured filter
        // -------------------------

        if (featured !== undefined) {
            if (featured !== "true" && featured !== "false") {
                return res.status(400).json({
                    success: false,
                    message: "Featured must be true or false"
                });
            }

            filter.isFeatured = featured === "true";
        }

        // -------------------------
        // Tags filter
        // -------------------------

        if (tags) {
            const tagList = tags
                .split(",")
                .map((tag) => tag.trim().toLowerCase())
                .filter(Boolean);

            if (tagList.length > 0) {
                filter.tags = {
                    $in: tagList
                };
            }
        }

        // -------------------------
        // Stock filter
        // -------------------------

        if (inStock !== undefined) {
            if (inStock !== "true" && inStock !== "false") {
                return res.status(400).json({
                    success: false,
                    message: "inStock must be true or false"
                });
            }

            if (inStock === "true") {
                filter.variants = {
                    $elemMatch: {
                        stock: {
                            $gt: 0
                        },
                        isActive: true
                    }
                };
            }
        }

        // -------------------------
        // Pagination
        // -------------------------

        const currentPage = Math.max(Number(page) || 1, 1);

        const productsPerPage = Math.min(
            Math.max(Number(limit) || 20, 1),
            50
        );

        const skip = (currentPage - 1) * productsPerPage;

        // -------------------------
        // Sorting
        // -------------------------

        let sortOption = {
            createdAt: -1
        };

        switch (sort) {
            case "oldest":
                sortOption = {
                    createdAt: 1
                };
                break;

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
                    rating: -1,
                    reviewCount: -1
                };
                break;

            case "popular":
                sortOption = {
                    reviewCount: -1,
                    rating: -1
                };
                break;

            case "newest":
                sortOption = {
                    createdAt: -1
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid sort option"
                });
        }

        // -------------------------
        // Database queries
        // -------------------------

        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug")
                .populate("brand", "name slug")
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
            message: "Failed to fetch products"
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

        const allowedFields = [
            "name",
            "description",
            "shortDescription",
            "category",
            "brand",
            "images",
            "variants",
            "tags",
            "isFeatured",
            "isActive",
            "seo"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Auto-generate slug if name changes
        if (updateData.name) {
            const baseSlug = slugify(updateData.name);

            let slug = baseSlug;
            let counter = 1;

            while (
                await Product.exists({
                    slug,
                    _id: { $ne: id }
                })
            ) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            updateData.slug = slug;
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
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