import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
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
} from "../controllers/admin.controller.js";

const router = Router();
const adminGuard = [authMiddleware, requireRole("Admin")];

// Courses
/**
 * @openapi
 * /api/admin/courses:
 *   post:
 *     summary: Create a course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               tags: { type: array, items: { type: string } }
 *               isPublished: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/courses", adminGuard, createCourse);

/**
 * @openapi
 * /api/admin/courses:
 *   get:
 *     summary: List courses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get("/courses", adminGuard, listCourses);

/**
 * @openapi
 * /api/admin/courses/{id}:
 *   patch:
 *     summary: Update a course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated course
 *       404:
 *         description: Not found
 */
router.patch("/courses/:id", adminGuard, updateCourse);

/**
 * @openapi
 * /api/admin/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete("/courses/:id", adminGuard, deleteCourse);

// Materials
/**
 * @openapi
 * /api/admin/materials:
 *   post:
 *     summary: Create material
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string }
 *               title: { type: string }
 *               type: { type: string, enum: ["video","pdf","link","other"] }
 *               url: { type: string }
 *               durationMinutes: { type: number }
 *               order: { type: number }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/materials", adminGuard, createMaterial);

/**
 * @openapi
 * /api/admin/materials:
 *   get:
 *     summary: List materials (optionally filter by course)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of materials
 */
router.get("/materials", adminGuard, listMaterials);

/**
 * @openapi
 * /api/admin/materials/{id}:
 *   patch:
 *     summary: Update material
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.patch("/materials/:id", adminGuard, updateMaterial);

/**
 * @openapi
 * /api/admin/materials/{id}:
 *   delete:
 *     summary: Delete material
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete("/materials/:id", adminGuard, deleteMaterial);

// Payments
/**
 * @openapi
 * /api/admin/payments:
 *   get:
 *     summary: List all payments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get("/payments", adminGuard, listPayments);

/**
 * @openapi
 * /api/admin/payments/{id}:
 *   patch:
 *     summary: Update payment status (admin override)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["success","failed","pending_review"]
 *     responses:
 *       200:
 *         description: Updated payment
 *       404:
 *         description: Not found
 */
router.patch("/payments/:id", adminGuard, updatePaymentStatus);

// Users
router.get("/users", adminGuard, listUsers);

export default router;
