import { APP_CONSTANTS } from "../config/constants.js";

/**
 * Middleware to check if user has required role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions",
                required: allowedRoles,
                current: req.user.role,
            });
        }

        next();
    };
};

/**
 * Shorthand middleware for admin-only access
 */
export const requireAdmin = requireRole([APP_CONSTANTS.ROLES.ADMIN]);

/**
 * Middleware for admin or teacher access
 */
export const requireTeacherOrAdmin = requireRole([
    APP_CONSTANTS.ROLES.ADMIN,
    APP_CONSTANTS.ROLES.TEACHER,
]);

/**
 * Middleware to check if user is accessing their own resource
 * Admins can access any resource
 */
export const requireOwnershipOrAdmin = (userIdParam = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const resourceUserId = req.params[userIdParam];

        // Admin can access any resource
        if (req.user.role === APP_CONSTANTS.ROLES.ADMIN) {
            return next();
        }

        // Check if user owns the resource
        if (req.user._id.toString() !== resourceUserId) {
            return res.status(403).json({
                success: false,
                message: "You can only access your own resources",
            });
        }

        next();
    };
};
