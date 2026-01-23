import Enrollment from "../models/Enrollment.js";
import { APP_CONSTANTS } from "../config/constants.js";
/**
 * Middleware to check if student has paid for and has access to a course
 * Expects courseId in req.params
 */
export const checkCourseAccess = async (req, res, next) => {
    try {
        // Must be authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const { courseId } = req.params;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        // Admins and teachers have access to all courses
        if (req.user.role === APP_CONSTANTS.ROLES.ADMIN || req.user.role === APP_CONSTANTS.ROLES.TEACHER) {
            return next();
        }

        // Check enrollment for students
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course",
                action: "payment",
            });
        }

        // Check if student has access
        if (!enrollment.hasAccess()) {
            return res.status(403).json({
                success: false,
                message: "Payment required to access this course",
                action: "payment",
                enrollmentId: enrollment._id,
                paymentStatus: enrollment.paymentStatus,
            });
        }

        // Attach enrollment to request for use in controller
        req.enrollment = enrollment;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error checking course access",
            error: error.message,
        });
    }
};

/**
 * Middleware to check if video is a preview or student has access
 */
export const checkVideoAccess = async (req, res, next) => {
    try {
        const videoId = req.params.videoId || req.params.id;

        // Video model would need to be imported to check isPreview
        // For now, use the course access check
        await checkCourseAccess(req, res, next);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error checking video access",
            error: error.message,
        });
    }
};
