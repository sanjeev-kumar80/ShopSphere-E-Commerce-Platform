const rateLimit = require("express-rate-limit");

/**
 * Rate Limiter for AI Endpoints
 * Protects local Ollama inference and external API quotas against DDoS or abuse.
 */
const aiChatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per IP per minute
    standardHeaders: true, // Return standard RateLimit headers
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many AI requests from this IP. Please wait a minute before trying again."
    }
});

module.exports = {
    aiChatRateLimiter
};
