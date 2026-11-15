const { body, validationResult } = require("express-validator");

/*
|--------------------------------------------------------------------------
| Validation Error Handler Middleware
| Follows the exact ShopSphere validator error format convention
|--------------------------------------------------------------------------
*/
const validateRequest = (req, res, next) => {
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

/*
|--------------------------------------------------------------------------
| AI Chat Request Validator
| Enforces strict input validation and limits conversation history size
|--------------------------------------------------------------------------
*/
const chatMessageValidator = [
    body("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Message must be between 1 and 2000 characters"),

    body("history")
        .optional()
        .isArray({ max: 20 })
        .withMessage("History must be an array with at most 20 messages"),

    body("history.*.role")
        .optional()
        .isIn(["user", "assistant", "model"])
        .withMessage("History role must be 'user' or 'assistant'"),

    body("history.*.content")
        .optional()
        .isString()
        .withMessage("History content must be a string")
        .trim()
        .notEmpty()
        .withMessage("History content cannot be empty")
        .isLength({ max: 2000 })
        .withMessage("Each history message must not exceed 2000 characters"),

    body("provider")
        .optional()
        .toLowerCase()
        .isIn(["ollama", "gemini", "groq"])
        .withMessage("Provider must be one of: ollama, gemini, groq"),

    body("includeContext")
        .optional()
        .isBoolean()
        .withMessage("includeContext must be a boolean")
];

module.exports = {
    validateRequest,
    chatMessageValidator
};
