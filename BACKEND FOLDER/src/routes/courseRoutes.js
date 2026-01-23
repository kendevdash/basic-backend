import express from "express";
import {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
} from "../controllers/courseController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import { requireRole, requireTeacherOrAdmin } from "../middleware/roleCheck.js";
import { APP_CONSTANTS } from "../config/constants.js";

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses (with filters)
 * @access  Public (auth optional for filtering)
 */
router.get("/", optionalAuth, getCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course by ID
 * @access  Public
 */
router.get("/:id", optionalAuth, getCourseById);

/**
 * @route   POST /api/courses
 * @desc    Create new course
 * @access  Private (Admin or Teacher)
 */
router.post("/", authenticateToken, requireTeacherOrAdmin, createCourse);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (Admin or Course Instructor)
 */
router.put("/:id", authenticateToken, requireTeacherOrAdmin, updateCourse);

/**
 * @route   PUT /api/courses/:id/publish
 * @desc    Publish course
 * @access  Private (Admin or Course Instructor)
 */
router.put("/:id/publish", authenticateToken, requireTeacherOrAdmin, publishCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Admin only)
 */
router.delete(
    "/:id",
    authenticateToken,
    requireRole([APP_CONSTANTS.ROLES.ADMIN]),
    deleteCourse
);

export default router;
