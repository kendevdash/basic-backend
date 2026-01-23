import mongoose from "mongoose";
import { APP_CONSTANTS } from "../config/constants.js";

const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: Object.values(APP_CONSTANTS.PAYMENT_STATUS),
            default: APP_CONSTANTS.PAYMENT_STATUS.PENDING,
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            default: null,
        },
        accessGranted: {
            type: Boolean,
            default: false,
        },
        enrollmentDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
            default: null, // null = lifetime access
        },
        progress: {
            completedVideos: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Video",
                },
            ],
            percentageComplete: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            lastAccessedAt: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Method to check if student has access
enrollmentSchema.methods.hasAccess = function () {
    if (this.paymentStatus !== APP_CONSTANTS.PAYMENT_STATUS.COMPLETED) {
        return false;
    }
    if (!this.accessGranted) {
        return false;
    }
    if (this.expiryDate && this.expiryDate < new Date()) {
        return false;
    }
    return true;
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
