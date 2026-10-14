const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

/*
|--------------------------------------------------------------------------
| Create Product Validation
|--------------------------------------------------------------------------
*/

const createProductValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Product name is required")
        .isLength({ min: 2, max: 200 })
        .withMessage("Product name must be between 2 and 200 characters"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Product description is required"),

    body("shortDescription")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Short description cannot exceed 500 characters"),

    body("category")
        .notEmpty()
        .withMessage("Category is required")
        .custom(isValidObjectId)
        .withMessage("Invalid category ID"),

    body("brand")
        .optional()
        .custom(isValidObjectId)
        .withMessage("Invalid brand ID"),

    body("images")
        .optional()
        .isArray()
        .withMessage("Images must be an array"),

    body("variants")
        .isArray({ min: 1 })
        .withMessage("At least one product variant is required"),

    body("variants.*.sku")
        .trim()
        .notEmpty()
        .withMessage("Variant SKU is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("SKU must be between 2 and 100 characters"),

    body("variants.*.price")
        .isFloat({ min: 0 })
        .withMessage("Variant price must be a positive number"),

    body("variants.*.compareAtPrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Compare-at price must be a positive number"),

    body("variants.*.stock")
        .isInt({ min: 0 })
        .withMessage("Stock cannot be negative"),

    body("variants.*.attributes")
        .optional()
        .isObject()
        .withMessage("Variant attributes must be an object"),

    body("variants.*.images")
        .optional()
        .isArray()
        .withMessage("Variant images must be an array"),

    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),

    body("rating")
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage("Rating must be between 0 and 5"),

    body("reviewCount")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Review count cannot be negative"),

    body("isFeatured")
        .optional()
        .isBoolean()
        .withMessage("isFeatured must be boolean"),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be boolean"),

    body("seo")
        .optional()
        .isObject()
        .withMessage("SEO must be an object"),

    body("seo.title")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("SEO title cannot exceed 200 characters"),

    body("seo.description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("SEO description cannot exceed 500 characters"),

    body("seo.keywords")
        .optional()
        .isArray()
        .withMessage("SEO keywords must be an array")
];


/*
|--------------------------------------------------------------------------
| Update Product Validation
|--------------------------------------------------------------------------
*/

const updateProductValidator = [
    param("id")
        .custom(isValidObjectId)
        .withMessage("Invalid product ID"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage("Product name must be between 2 and 200 characters"),

    body("description")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Description cannot be empty"),

    body("shortDescription")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Short description cannot exceed 500 characters"),

    body("category")
        .optional()
        .custom(isValidObjectId)
        .withMessage("Invalid category ID"),

    body("brand")
        .optional()
        .custom(isValidObjectId)
        .withMessage("Invalid brand ID"),

    body("images")
        .optional()
        .isArray()
        .withMessage("Images must be an array"),

    body("variants")
        .optional()
        .isArray({ min: 1 })
        .withMessage("At least one product variant is required"),

    body("variants.*.sku")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Variant SKU is required"),

    body("variants.*.price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Variant price cannot be negative"),

    body("variants.*.compareAtPrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Compare-at price cannot be negative"),

    body("variants.*.stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock cannot be negative"),

    body("variants.*.attributes")
        .optional()
        .isObject()
        .withMessage("Variant attributes must be an object"),

    body("variants.*.images")
        .optional()
        .isArray()
        .withMessage("Variant images must be an array"),

    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),

    body("isFeatured")
        .optional()
        .isBoolean()
        .withMessage("isFeatured must be boolean"),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be boolean"),

    body("seo")
        .optional()
        .isObject()
        .withMessage("SEO must be an object")
];


/*
|--------------------------------------------------------------------------
| Product ID Validation
|--------------------------------------------------------------------------
*/

const productIdValidator = [
    param("id")
        .custom(isValidObjectId)
        .withMessage("Invalid product ID")
];


/*
|--------------------------------------------------------------------------
| Validation Error Handler
|--------------------------------------------------------------------------
*/

const validateRequest = (req, res, next) => {
    const { validationResult } = require("express-validator");

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    next();
};


module.exports = {
    createProductValidator,
    updateProductValidator,
    productIdValidator,
    validateRequest
};