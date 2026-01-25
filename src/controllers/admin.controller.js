import Course from "../models/Course.js";
import Material from "../models/Material.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

// Courses
export const createCourse = async (req, res) => {
	try {
		const { title, description, price = 0, tags = [], isPublished = false } = req.body;
		if (!title) return res.status(400).json({ message: "Title is required" });
		const course = await Course.create({ title, description, price, tags, isPublished, createdBy: req.user.id });
		return res.status(201).json({ course });
	} catch (err) {
		return res.status(500).json({ message: "Failed to create course" });
	}
};

export const listCourses = async (_req, res) => {
	const courses = await Course.find().sort({ createdAt: -1 });
	return res.status(200).json({ courses });
};

export const updateCourse = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;
		const course = await Course.findByIdAndUpdate(id, updates, { new: true });
		if (!course) return res.status(404).json({ message: "Course not found" });
		return res.status(200).json({ course });
	} catch (err) {
		return res.status(500).json({ message: "Failed to update course" });
	}
};

export const deleteCourse = async (req, res) => {
	try {
		const { id } = req.params;
		const course = await Course.findByIdAndDelete(id);
		if (!course) return res.status(404).json({ message: "Course not found" });
		await Material.deleteMany({ course: id });
		return res.status(200).json({ message: "Course deleted" });
	} catch (err) {
		return res.status(500).json({ message: "Failed to delete course" });
	}
};

// Materials
export const createMaterial = async (req, res) => {
	try {
		const { course, title, type, url, durationMinutes, order } = req.body;
		if (!course || !title || !url) {
			return res.status(400).json({ message: "course, title, and url are required" });
		}
		const material = await Material.create({ course, title, type, url, durationMinutes, order });
		return res.status(201).json({ material });
	} catch (err) {
		return res.status(500).json({ message: "Failed to create material" });
	}
};

export const listMaterials = async (req, res) => {
	const filter = req.query.course ? { course: req.query.course } : {};
	const materials = await Material.find(filter).sort({ order: 1, createdAt: -1 });
	return res.status(200).json({ materials });
};

export const updateMaterial = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;
		const material = await Material.findByIdAndUpdate(id, updates, { new: true });
		if (!material) return res.status(404).json({ message: "Material not found" });
		return res.status(200).json({ material });
	} catch (err) {
		return res.status(500).json({ message: "Failed to update material" });
	}
};

export const deleteMaterial = async (req, res) => {
	try {
		const { id } = req.params;
		const material = await Material.findByIdAndDelete(id);
		if (!material) return res.status(404).json({ message: "Material not found" });
		return res.status(200).json({ message: "Material deleted" });
	} catch (err) {
		return res.status(500).json({ message: "Failed to delete material" });
	}
};

// Payments admin
export const listPayments = async (_req, res) => {
	const payments = await Payment.find().sort({ createdAt: -1 }).populate("user", "fullName email role isPaid");
	return res.status(200).json({ payments });
};

export const updatePaymentStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body; // success | failed | pending_review
		if (!status) return res.status(400).json({ message: "status is required" });
		const payment = await Payment.findById(id);
		if (!payment) return res.status(404).json({ message: "Payment not found" });
		payment.status = status;
		if (status === "success") {
			payment.paidAt = new Date();
			await User.findByIdAndUpdate(payment.user, { isPaid: true });
		}
		await payment.save();
		return res.status(200).json({ payment });
	} catch (err) {
		console.error("updatePaymentStatus", err);
		return res.status(500).json({ message: "Failed to update payment" });
	}
};

// Users admin
export const listUsers = async (_req, res) => {
	const users = await User.find().sort({ createdAt: -1 });
	return res.status(200).json({ users });
};

export default {
	createCourse,
	listCourses,
	updateCourse,
	deleteCourse,
	createMaterial,
	listMaterials,
	updateMaterial,
	deleteMaterial,
	listPayments,
	updatePaymentStatus,
	listUsers
};
