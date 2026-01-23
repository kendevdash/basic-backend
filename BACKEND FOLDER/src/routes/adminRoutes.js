import express from "express";
import {
    getDashboardAnalytics,
    changeUserRole,
    toggleUserActive,
    manualEnrollment,
    getAllEnrollments,
    deleteUserPermanently,
    getRevenueStats,
} from "../controllers/adminController.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole, requireAdmin } from "../middleware/roleCheck.js";
import { APP_CONSTANTS } from "../config/constants.js";

const router = express.Router();

/**
 * @route   GET /api/admin/analytics
 * @desc    Get dashboard analytics
 * @access  Private (Admin/Teacher)
 */
router.get(
    "/analytics",
    authenticateToken,
    requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.TEACHER]),
    getDashboardAnalytics
);

/**
 * @route   GET /api/admin/revenue
 * @desc    Get revenue statistics
 * @access  Private (Admin only)
 */
router.get("/revenue", authenticateToken, requireAdmin, getRevenueStats);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin only)
 */
router.put("/users/:id/role", authenticateToken, requireAdmin, changeUserRole);

/**
 * @route   PUT /api/admin/users/:id/toggle-active
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.put(
    "/users/:id/toggle-active",
    authenticateToken,
    requireAdmin,
    toggleUserActive
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user permanently
 * @access  Private (Admin only)
 */
router.delete("/users/:id", authenticateToken, requireAdmin, deleteUserPermanently);

/**
 * @route   POST /api/admin/enrollments/manual
 * @desc    Manually enroll student in course
 * @access  Private (Admin only)
 */
router.post("/enrollments/manual", authenticateToken, requireAdmin, manualEnrollment);

/**
 * @route   GET /api/admin/enrollments
 * @desc    Get all enrollments with filters
 * @access  Private (Admin only)
 */
router.get("/enrollments", authenticateToken, requireAdmin, getAllEnrollments);

export default router;
