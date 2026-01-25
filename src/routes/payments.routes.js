import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { initiatePayment, handlePaymentWebhook, listMyPayments } from "../controllers/payments.controller.js";

const router = Router();

/**
 * @openapi
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               method:
 *                 type: string
 *                 description: one of mtn_momo, visa_card, bank_transfer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment initiated
 *       400:
 *         description: Invalid request
 */
router.post("/initiate", authMiddleware, initiatePayment);

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Payment webhook receiver
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 *       401:
 *         description: Invalid signature
 */
router.post("/webhook", handlePaymentWebhook);

/**
 * @openapi
 * /api/payments/me:
 *   get:
 *     summary: List payments for current user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment list
 */
router.get("/me", authMiddleware, listMyPayments);

export default router;
