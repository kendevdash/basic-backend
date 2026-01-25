import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePaid } from "../middlewares/paid.middleware.js";
import Course from "../models/Course.js";
import Material from "../models/Material.js";

const router = Router();

// List all published courses (available to all authenticated users)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 });
        return res.status(200).json({ courses });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch courses" });
    }
});

// Get course details and materials (only for paid users)
router.get("/:id", authMiddleware, requirePaid, async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const materials = await Material.find({ course: id }).sort({ order: 1 });
        return res.status(200).json({ course, materials });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch course details" });
    }
});

export default router;
