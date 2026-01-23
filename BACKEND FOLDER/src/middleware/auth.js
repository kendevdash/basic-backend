import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/constants.js";
import User from "../models/User.js";

/**
 * Middleware to authenticate JWT token
 * Verifies token and attaches user to request object
 */
export const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_CONFIG.secret);

        // Find user (excluding password)
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token - user not found",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account has been deactivated",
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Authentication failed",
            error: error.message,
        });
    }
};

/**
 * Optional authentication - attaches user if token exists but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_CONFIG.secret);
            const user = await User.findById(decoded.userId).select("-password");
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Don't fail, just continue without user
        next();
    }
};
