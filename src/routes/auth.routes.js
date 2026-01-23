import { Router } from "express";
import {
	registerUser,
	loginUser,
	refreshToken,
	logoutUser
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already registered
 */
router.post("/register", registerUser);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and get tokens
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginUser);
/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh cookie
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Missing or invalid refresh token
 */
router.post("/refresh", refreshToken);
/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout and clear refresh token
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, (req, res) => {
    return res.status(200).json({ user: req.user });
});

/**
 * @openapi
 * /api/auth/admin-only:
 *   get:
 *     summary: Admin-only test route
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       403:
 *         description: Forbidden
 */
router.get("/admin-only", authMiddleware, requireRole("Admin"), (req, res) => {
    return res.status(200).json({ message: "Welcome Admin", user: req.user });
});

export default router;
