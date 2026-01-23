import Course from "../models/Course.js";
import { asyncHandler, successResponse, errorResponse, getPaginationParams, paginationResponse } from "../utils/helpers.js";
import { APP_CONSTANTS } from "../config/constants.js";

/**
 * @desc    Get all courses (with filters)
 * @route   GET /api/courses
 * @access  Public
 */
export const getCourses = asyncHandler(async (req, res) => {
    const { category, level, status, search } = req.query;
    const { page, limit, skip } = getPaginationParams(req);

    // Build filter
    const filter = {};

    // Only show published courses to non-admin users
    if (req.user?.role !== APP_CONSTANTS.ROLES.ADMIN) {
        filter.status = APP_CONSTANTS.COURSE_STATUS.PUBLISHED;
    } else if (status) {
        filter.status = status;
    }

    if (category) filter.category = category;
    if (level) filter.level = level;

    // Search in title and description
    if (search) {
        filter.$text = { $search: search };
    }

    // Get courses with instructor info
    const courses = await Course.find(filter)
        .populate("instructor", "name email profile.avatar")
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    return successResponse(
        res,
        200,
        "Courses retrieved successfully",
        paginationResponse(courses, page, limit, total)
    );
});

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:id
 * @access  Public
 */
export const getCourseById = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate("instructor", "name email profile.avatar profile.bio")
        .populate("modules.videos");

    if (!course) {
        return errorResponse(res, 404, "Course not found");
    }

    // Only show published courses to non-admin/teacher users
    if (
        course.status !== APP_CONSTANTS.COURSE_STATUS.PUBLISHED &&
        req.user?.role !== APP_CONSTANTS.ROLES.ADMIN &&
        req.user?._id.toString() !== course.instructor._id.toString()
    ) {
        return errorResponse(res, 403, "This course is not available");
    }

    return successResponse(res, 200, "Course retrieved successfully", { course });
});

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private (Admin/Teacher)
 */
export const createCourse = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        price,
        category,
        level,
        thumbnail,
        duration,
    } = req.body;

    // Validate required fields
    if (!title || !description || price === undefined || !category) {
        return errorResponse(res, 400, "Please provide all required fields");
    }

    // Create course
    const course = await Course.create({
        title,
        description,
        instructor: req.user._id, // Current user is the instructor
        price,
        category,
        level: level || "Beginner",
        thumbnail,
        duration: duration || 0,
        status: APP_CONSTANTS.COURSE_STATUS.DRAFT,
    });

    return successResponse(res, 201, "Course created successfully", { course });
});

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin or Course Instructor)
 */
export const updateCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return errorResponse(res, 404, "Course not found");
    }

    // Check if user is instructor or admin
    if (
        req.user.role !== APP_CONSTANTS.ROLES.ADMIN &&
        course.instructor.toString() !== req.user._id.toString()
    ) {
        return errorResponse(res, 403, "Not authorized to update this course");
    }

    // Update fields
    const {
        title,
        description,
        price,
        category,
        level,
        thumbnail,
        duration,
        status,
        modules,
    } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (price !== undefined) course.price = price;
    if (category) course.category = category;
    if (level) course.level = level;
    if (thumbnail) course.thumbnail = thumbnail;
    if (duration !== undefined) course.duration = duration;
    if (status) course.status = status;
    if (modules) course.modules = modules;

    await course.save();

    return successResponse(res, 200, "Course updated successfully", { course });
});

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin only)
 */
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return errorResponse(res, 404, "Course not found");
    }

    await course.deleteOne();

    return successResponse(res, 200, "Course deleted successfully");
});

/**
 * @desc    Publish course (change status to published)
 * @route   PUT /api/courses/:id/publish
 * @access  Private (Admin or Course Instructor)
 */
export const publishCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return errorResponse(res, 404, "Course not found");
    }

    // Check authorization
    if (
        req.user.role !== APP_CONSTANTS.ROLES.ADMIN &&
        course.instructor.toString() !== req.user._id.toString()
    ) {
        return errorResponse(res, 403, "Not authorized to publish this course");
    }

    course.status = APP_CONSTANTS.COURSE_STATUS.PUBLISHED;
    await course.save();

    return successResponse(res, 200, "Course published successfully", { course });
});
