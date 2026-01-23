import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils.js";
import { asyncHandler, successResponse, errorResponse } from "../utils/helpers.js";

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return errorResponse(res, 400, "Please provide name, email, and password");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return errorResponse(res, 400, "User with this email already exists");
    }

    // Validate password length
    if (password.length < 6) {
        return errorResponse(res, 400, "Password must be at least 6 characters");
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
        name,
        email,
        password,
        role: "student", // Default to student if no role specified
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();


    // Return user data (password excluded by model's toJSON method)
    return successResponse(res, 201, "User registered successfully", {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return errorResponse(res, 400, "Please provide email and password");
    }

    // Find user with password field (normally excluded)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Check if account is active
    if (!user.isActive) {
        return errorResponse(res, 403, "Account has been deactivated");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();


    return successResponse(res, 200, "Login successful", {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
    // User is attached by auth middleware
    const user = await User.findById(req.user._id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User profile retrieved", {
        user,
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (but requires refresh token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return errorResponse(res, 400, "Refresh token is required");
    }

    try {
        const { verifyToken } = await import("../utils/tokenUtils.js");
        const decoded = verifyToken(refreshToken);

        if (decoded.type !== "refresh") {
            return errorResponse(res, 401, "Invalid token type");
        }

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return errorResponse(res, 401, "User not found or inactive");
        }

        
        if (!user.refreshTokens.includes(refreshToken)) {
            return errorResponse(res, 401, "Refresh token revoked");
        }

        const newAccessToken = generateAccessToken(user._id, user.role);

        return successResponse(res, 200, "Token refreshed successfully", {
            accessToken: newAccessToken,
        });
    } catch (error) {
        return errorResponse(res, 401, "Invalid or expired refresh token");
    }
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        const user = await User.findById(req.user._id);
        user.refreshTokens = user.refreshTokens.filter(
            token => token !== refreshToken
        );
        await user.save();
    }

    return successResponse(res, 200, "Logged out successfully");
});
