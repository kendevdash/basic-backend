import dotenv from "dotenv";

dotenv.config();

/**
 * JWT Configuration constants
 */
export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || "your-fallback-secret-key",
    accessTokenExpire: process.env.JWT_EXPIRE || "24h",
    refreshTokenExpire: process.env.JWT_REFRESH_EXPIRE || "7d",
    issuer: "ikSpace-LMS",
};

/**
 * Application-wide constants
 */
export const APP_CONSTANTS = {
    // User roles
    ROLES: {
        ADMIN: "admin",
        TEACHER: "teacher",
        STUDENT: "student",
    },

    // Payment status
    PAYMENT_STATUS: {
        PENDING: "PENDING",
        UNDER_REVIEW: "UNDER_REVIEW",
        COMPLETED: "COMPLETED",
        FAILED: "FAILED",
        REFUNDED: "REFUNDED",
    },

    // Course status
    COURSE_STATUS: {
        DRAFT: "draft",
        PUBLISHED: "published",
        ARCHIVED: "archived",
    },

    // File upload limits
    FILE_LIMITS: {
        MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
        MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_THUMBNAIL_SIZE: 2 * 1024 * 1024, // 2MB
    },

    // Allowed file types
    ALLOWED_FILE_TYPES: {
        VIDEO: ["video/mp4", "video/webm", "video/ogg"],
        DOCUMENT: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        IMAGE: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
};

export default {
    JWT_CONFIG,
    APP_CONSTANTS,
};
