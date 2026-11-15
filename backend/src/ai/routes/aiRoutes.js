const express = require("express");
const {
    getAIStatus,
    getAvailableModels,
    chat
} = require("../controllers/aiController");
const {
    chatMessageValidator,
    validateRequest
} = require("../validators/aiValidator");
const { aiChatRateLimiter } = require("../middleware/aiRateLimiter");
const { optionalAuth } = require("../middleware/optionalAuth");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| AI Module Routes (/api/ai)
|--------------------------------------------------------------------------
*/

// Diagnostics & health
router.get("/status", getAIStatus);
router.get("/models", getAvailableModels);

// Chat / completion endpoint with rate limiting, optional auth, and input validation
router.post(
    "/chat",
    aiChatRateLimiter,
    optionalAuth,
    chatMessageValidator,
    validateRequest,
    chat
);

module.exports = router;
