import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
	{
		course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
		title: { type: String, required: true },
		type: { type: String, enum: ["video", "pdf", "link", "other"], default: "other" },
		url: { type: String, required: true },
		durationMinutes: { type: Number },
		order: { type: Number, default: 0 }
	},
	{ timestamps: true }
);

const Material = mongoose.model("Material", materialSchema);

export default Material;
