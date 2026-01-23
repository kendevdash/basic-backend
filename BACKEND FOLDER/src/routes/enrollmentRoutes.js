import express from "express";
import {
    enrollInCourse,
    getMyEnrolledCourses,
    checkCourseAccess,
    updateProgress,
    getEnrollmentById,
    getCourseEnrollments,
} from "../controllers/enrollmentController.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireTeacherOrAdmin } from "../middleware/roleCheck.js";

const router = express.Router();

/**
 * @route   POST /api/enrollments
 * @desc    Enroll in a course
 * @access  Private (Student)
 */
router.post("/", authenticateToken, enrollInCourse);

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get student's enrolled courses
 * @access  Private
 */
router.get("/my-courses", authenticateToken, getMyEnrolledCourses);

/**
 * @route   GET /api/enrollments/check-access/:courseId
 * @desc    Check course access
 * @access  Private
 */
router.get("/check-access/:courseId", authenticateToken, checkCourseAccess);

/**
 * @route   GET /api/enrollments/:id
 * @desc    Get enrollment by ID
 * @access  Private
 */
router.get("/:id", authenticateToken, getEnrollmentById);

/**
 * @route   PUT /api/enrollments/:id/progress
 * @desc    Update course progress
 * @access  Private (Student)
 */
router.put("/:id/progress", authenticateToken, updateProgress);

/**
 * @route   GET /api/courses/:courseId/enrollments
 * @desc    Get all enrollments for a course
 * @access  Private (Teacher/Admin)
 */
router.get(
    "/course/:courseId",
    authenticateToken,
    requireTeacherOrAdmin,
    getCourseEnrollments
);

export default router;
