import express from "express";
import {
    getUserById,
    updateUser,
    changePassword,
    deleteUser,
    getAllUsers,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole, requireOwnershipOrAdmin } from "../middleware/roleCheck.js";
import { APP_CONSTANTS } from "../config/constants.js";

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get(
    "/",
    authenticateToken,
    requireRole([APP_CONSTANTS.ROLES.ADMIN]),
    getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get("/:id", authenticateToken, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Owner or Admin)
 */
router.put("/:id", authenticateToken, requireOwnershipOrAdmin("id"), updateUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change password
 * @access  Private (Owner only)
 */
router.put(
    "/:id/password",
    authenticateToken,
    requireOwnershipOrAdmin("id"),
    changePassword
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account (soft delete)
 * @access  Private (Owner or Admin)
 */
router.delete(
    "/:id",
    authenticateToken,
    requireOwnershipOrAdmin("id"),
    deleteUser
);

export default router;
