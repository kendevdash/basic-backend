import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import Video from "../models/Video.js";
import { asyncHandler, successResponse, errorResponse } from "../utils/helpers.js";
import { APP_CONSTANTS } from "../config/constants.js";

/**
 * @desc    Get dashboard analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin/Teacher)
 */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: "published" });
    const totalEnrollments = await Enrollment.countDocuments();
    const activeEnrollments = await Enrollment.countDocuments({
        paymentStatus: "completed",
        accessGranted: true,
    });

    // Payment analytics
    const totalRevenue = await Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const pendingPayments = await Payment.countDocuments({ status: "pending" });

    // Recent enrollments (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEnrollments = await Enrollment.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
    });

    // Top courses by enrollment
    const topCourses = await Course.find()
        .sort({ enrollmentCount: -1 })
        .limit(5)
        .select("title enrollmentCount price thumbnail");

    return successResponse(res, 200, "Analytics retrieved successfully", {
        users: {
            total: totalUsers,
            students: totalStudents,
            teachers: totalTeachers,
        },
        courses: {
            total: totalCourses,
            published: publishedCourses,
            draft: totalCourses - publishedCourses,
        },
        enrollments: {
            total: totalEnrollments,
            active: activeEnrollments,
            recent: recentEnrollments,
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
            pendingPayments,
        },
        topCourses,
    });
});

/**
 * @desc    Change user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
export const changeUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!role || !Object.values(APP_CONSTANTS.ROLES).includes(role)) {
        return errorResponse(res, 400, "Valid role is required (admin, teacher, student)");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
        return errorResponse(res, 400, "Cannot change your own role");
    }

    user.role = role;
    await user.save();

    return successResponse(res, 200, "User role updated successfully", { user });
});

/**
 * @desc    Toggle user active status
 * @route   PUT /api/admin/users/:id/toggle-active
 * @access  Private (Admin only)
 */
export const toggleUserActive = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
        return errorResponse(res, 400, "Cannot deactivate your own account");
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(
        res,
        200,
        `User ${user.isActive ? "activated" : "deactivated"} successfully`,
        { user }
    );
});

/**
 * @desc    Manually enroll student in course
 * @route   POST /api/admin/enrollments/manual
 * @access  Private (Admin only)
 */
export const manualEnrollment = asyncHandler(async (req, res) => {
    const { studentId, courseId, grantAccess = true } = req.body;

    if (!studentId || !courseId) {
        return errorResponse(res, 400, "Student ID and Course ID are required");
    }

    // Verify student and course exist
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student) {
        return errorResponse(res, 404, "Student not found");
    }

    if (!course) {
        return errorResponse(res, 404, "Course not found");
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
        student: studentId,
        course: courseId,
    });

    if (existing) {
        return errorResponse(res, 400, "Student already enrolled in this course");
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        paymentStatus: grantAccess
            ? APP_CONSTANTS.PAYMENT_STATUS.COMPLETED
            : APP_CONSTANTS.PAYMENT_STATUS.PENDING,
        accessGranted: grantAccess,
    });

    // Update enrollment count if access granted
    if (grantAccess) {
        await Course.findByIdAndUpdate(courseId, {
            $inc: { enrollmentCount: 1 },
        });
    }

    return successResponse(res, 201, "Student enrolled successfully", {
        enrollment,
    });
});

/**
 * @desc    Get all enrollments with filters
 * @route   GET /api/admin/enrollments
 * @access  Private (Admin)
 */
export const getAllEnrollments = asyncHandler(async (req, res) => {
    const { status, courseId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.paymentStatus = status;
    if (courseId) filter.course = courseId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const enrollments = await Enrollment.find(filter)
        .populate("student", "name email role")
        .populate("course", "title price")
        .populate("paymentId")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 });

    const total = await Enrollment.countDocuments(filter);

    return successResponse(res, 200, "Enrollments retrieved successfully", {
        enrollments,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
        },
    });
});

/**
 * @desc    Delete user permanently (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUserPermanently = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
        return errorResponse(res, 400, "Cannot delete your own account");
    }

    await user.deleteOne();

    return successResponse(res, 200, "User deleted permanently");
});

/**
 * @desc    Get revenue statistics
 * @route   GET /api/admin/revenue
 * @access  Private (Admin)
 */
export const getRevenueStats = asyncHandler(async (req, res) => {
    const { period = "month" } = req.query; // day, week, month, year

    let dateFilter;
    const now = new Date();

    switch (period) {
        case "day":
            dateFilter = new Date(now.setHours(0, 0, 0, 0));
            break;
        case "week":
            dateFilter = new Date(now.setDate(now.getDate() - 7));
            break;
        case "month":
            dateFilter = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case "year":
            dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            dateFilter = new Date(now.setMonth(now.getMonth() - 1));
    }

    const stats = await Payment.aggregate([
        {
            $match: {
                status: "completed",
                paidAt: { $gte: dateFilter },
            },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" },
                totalTransactions: { $sum: 1 },
                averageTransaction: { $avg: "$amount" },
            },
        },
    ]);

    // Revenue by course
    const revenueByCourse = await Payment.aggregate([
        {
            $match: {
                status: "completed",
                paidAt: { $gte: dateFilter },
            },
        },
        {
            $group: {
                _id: "$course",
                revenue: { $sum: "$amount" },
                sales: { $sum: 1 },
            },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "courses",
                localField: "_id",
                foreignField: "_id",
                as: "courseInfo",
            },
        },
    ]);

    return successResponse(res, 200, "Revenue statistics retrieved", {
        period,
        stats: stats[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 },
        topCourses: revenueByCourse,
    });
});
