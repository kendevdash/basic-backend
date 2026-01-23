import mongoose from "mongoose";
import { APP_CONSTANTS } from "../config/constants.js";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Course description is required"],
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Instructor is required"],
        },
        thumbnail: {
            type: String,
            default: null,
        },
        price: {
            type: Number,
            required: [true, "Course price is required"],
            min: [0, "Price cannot be negative"],
        },
        category: {
            type: String,
            required: [true, "Course category is required"],
            enum: ["Programming", "Design", "Business", "Marketing", "Other"],
        },
        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner",
        },
        duration: {
            type: Number, // in hours
            default: 0,
        },
        status: {
            type: String,
            enum: Object.values(APP_CONSTANTS.COURSE_STATUS),
            default: APP_CONSTANTS.COURSE_STATUS.DRAFT,
        },
        modules: [
            {
                title: {
                    type: String,
                    required: true,
                },
                description: String,
                order: Number,
                videos: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Video",
                    },
                ],
            },
        ],
        enrollmentCount: {
            type: Number,
            default: 0,
        },
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            count: {
                type: Number,
                default: 0,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Index for search optimization
courseSchema.index({ title: "text", description: "text" });
courseSchema.index({ category: 1, status: 1 });

const Course = mongoose.model("Course", courseSchema);

export default Course;
