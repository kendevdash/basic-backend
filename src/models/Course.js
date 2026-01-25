import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, trim: true },
		price: { type: Number, default: 0 },
		isPublished: { type: Boolean, default: false },
		tags: [{ type: String }],
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
	},
	{ timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
