import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import { asyncHandler, successResponse, errorResponse } from "../utils/helpers.js";
import { APP_CONSTANTS } from "../config/constants.js";

/**
 * @desc    Enroll in a course (create pending enrollment)
 * @route   POST /api/enrollments
 * @access  Private (Student)
 */
export const enrollInCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    if (!courseId) {
        return errorResponse(res, 400, "Course ID is required");
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
        return errorResponse(res, 404, "Course not found");
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
        student: req.user._id,
        course: courseId,
    });

    if (existingEnrollment) {
        return errorResponse(res, 400, "Already enrolled in this course", {
            enrollment: existingEnrollment,
        });
    }

    // Create enrollment with pending payment
    const enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
        paymentStatus: APP_CONSTANTS.PAYMENT_STATUS.PENDING,
        accessGranted: false,
    });

    return successResponse(res, 201, "Enrollment created. Please complete payment.", {
        enrollment,
        course: {
            id: course._id,
            title: course.title,
            price: course.price,
        },
    });
});

/**
 * @desc    Get student's enrolled courses
 * @route   GET /api/enrollments/my-courses
 * @access  Private (Student)
 */
export const getMyEnrolledCourses = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const filter = { student: req.user._id };

    // Filter by payment status if provided
    if (status) {
        filter.paymentStatus = status;
    }

    const enrollments = await Enrollment.find(filter)
        .populate("course", "title description thumbnail price category level")
        .populate("paymentId")
        .sort({ enrollmentDate: -1 });

    return successResponse(res, 200, "Enrolled courses retrieved successfully", {
        enrollments,
        count: enrollments.length,
    });
});

/**
 * @desc    Check if student has access to a course
 * @route   GET /api/enrollments/check-access/:courseId
 * @access  Private
 */
export const checkCourseAccess = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: courseId,
    });

    if (!enrollment) {
        return successResponse(res, 200, "No enrollment found", {
            hasAccess: false,
            enrolled: false,
        });
    }

    const hasAccess = enrollment.hasAccess();

    return successResponse(res, 200, "Access check completed", {
        hasAccess,
        enrolled: true,
        paymentStatus: enrollment.paymentStatus,
        accessGranted: enrollment.accessGranted,
        progress: enrollment.progress,
    });
});

/**
 * @desc    Update course progress
 * @route   PUT /api/enrollments/:id/progress
 * @access  Private (Student)
 */
export const updateProgress = asyncHandler(async (req, res) => {
    const { videoId, percentageComplete } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
        return errorResponse(res, 404, "Enrollment not found");
    }

    // Verify ownership
    if (enrollment.student.toString() !== req.user._id.toString()) {
        return errorResponse(res, 403, "Not authorized to update this enrollment");
    }

    // Check if student has access
    if (!enrollment.hasAccess()) {
        return errorResponse(res, 403, "Payment required to access course content");
    }

    // Add video to completed list if not already there
    if (videoId && !enrollment.progress.completedVideos.includes(videoId)) {
        enrollment.progress.completedVideos.push(videoId);
    }

    // Update percentage
    if (percentageComplete !== undefined) {
        enrollment.progress.percentageComplete = Math.min(100, Math.max(0, percentageComplete));
    }

    // Update last accessed time
    enrollment.progress.lastAccessedAt = new Date();

    await enrollment.save();

    return successResponse(res, 200, "Progress updated successfully", {
        progress: enrollment.progress,
    });
});

/**
 * @desc    Get enrollment by ID
 * @route   GET /api/enrollments/:id
 * @access  Private
 */
export const getEnrollmentById = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id)
        .populate("course")
        .populate("student", "name email")
        .populate("paymentId");

    if (!enrollment) {
        return errorResponse(res, 404, "Enrollment not found");
    }

    // Verify ownership (student or admin)
    if (
        enrollment.student._id.toString() !== req.user._id.toString() &&
        req.user.role !== APP_CONSTANTS.ROLES.ADMIN
    ) {
        return errorResponse(res, 403, "Not authorized to view this enrollment");
    }

    return successResponse(res, 200, "Enrollment retrieved successfully", {
        enrollment,
    });
});

/**
 * @desc    Get all enrollments for a course (Teacher/Admin)
 * @route   GET /api/courses/:courseId/enrollments
 * @access  Private (Teacher/Admin)
 */
export const getCourseEnrollments = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ course: courseId })
        .populate("student", "name email profile.avatar")
        .sort({ enrollmentDate: -1 });

    return successResponse(res, 200, "Course enrollments retrieved successfully", {
        enrollments,
        count: enrollments.length,
    });
});
