import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Video title is required"],
            trim: true,
        },
        description: {
            type: String,
            maxlength: [1000, "Description cannot exceed 1000 characters"],
        },
        filename: {
            type: String,
            required: true,
        },
        filepath: {
            type: String,
            required: true,
        },
        url: {
            type: String, // For cloud storage URLs
            default: null,
        },
        duration: {
            type: Number, // in seconds
            default: 0,
        },
        size: {
            type: Number, // in bytes
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        isPreview: {
            type: Boolean,
            default: false, // Free preview videos
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for course videos
videoSchema.index({ course: 1, order: 1 });

const Video = mongoose.model("Video", videoSchema);

export default Video;
