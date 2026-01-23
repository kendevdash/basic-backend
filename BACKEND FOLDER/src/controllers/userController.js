import User from "../models/User.js";
import { asyncHandler, successResponse, errorResponse } from "../utils/helpers.js";
import bcrypt from "bcryptjs";

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User retrieved successfully", { user });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private (Owner or Admin)
 */
export const updateUser = asyncHandler(async (req, res) => {
    const { name, bio, phone, avatar } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    // Update fields if provided
    if (name) user.name = name;
    if (bio !== undefined) user.profile.bio = bio;
    if (phone !== undefined) user.profile.phone = phone;
    if (avatar !== undefined) user.profile.avatar = avatar;

    await user.save();

    return successResponse(res, 200, "Profile updated successfully", { user });
});

/**
 * @desc    Change user password
 * @route   PUT /api/users/:id/password
 * @access  Private (Owner only)
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return errorResponse(res, 400, "Current and new password are required");
    }

    if (newPassword.length < 6) {
        return errorResponse(res, 400, "New password must be at least 6 characters");
    }

    // Find user with password
    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
        return errorResponse(res, 401, "Current password is incorrect");
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, "Password changed successfully");
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/:id
 * @access  Private (Owner or Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    // For hard delete, use: await user.deleteOne();

    return successResponse(res, 200, "User account deactivated successfully");
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
    const { role, isActive, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users
    const users = await User.find(filter)
        .select("-password")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return successResponse(res, 200, "Users retrieved successfully", {
        users,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalUsers: total,
            usersPerPage: parseInt(limit),
        },
    });
});