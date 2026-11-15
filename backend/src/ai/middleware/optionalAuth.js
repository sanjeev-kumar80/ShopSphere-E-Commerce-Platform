const jwt = require("jsonwebtoken");
const User = require("../../models/User");

/**
 * Optional Authentication Middleware
 * If a valid JWT Bearer token is provided, attaches `req.user`.
 * If no token is provided, allows guest access without returning 401.
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.split(" ")[1];
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.userId) {
            const user = await User.findById(decoded.userId).select("-password");
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch {
        // Silently continue as guest if token is invalid/expired
        next();
    }
};

module.exports = {
    optionalAuth
};
