import express from "express";
import {
    createPayment,
    verifyPayment,
    getPaymentHistory,
    getPaymentById,
    getAllPayments,
    processRefund,
} from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { APP_CONSTANTS } from "../config/constants.js";

const router = express.Router();

router.post(
  "/:id/approve",
  authenticateToken,
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  approvePayment
);

router.post(
  "/:id/reject",
  authenticateToken,
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  rejectPayment
);


/**
 * @route   POST /api/payments/create
 * @desc    Create payment intent
 * @access  Private (Student)
 */
router.post("/create", authenticateToken, createPayment);

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history for current user
 * @access  Private
 */
router.get("/history", authenticateToken, getPaymentHistory);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get("/:id", authenticateToken, getPaymentById);

/**
 * @route   GET /api/payments
 * @desc    Get all payments
 * @access  Private (Admin only)
 */
router.get(
    "/",
    authenticateToken,
    requireRole([APP_CONSTANTS.ROLES.ADMIN]),
    getAllPayments
);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process refund
 * @access  Private (Admin only)
 */
router.post(
    "/:id/refund",
    authenticateToken,
    requireRole([APP_CONSTANTS.ROLES.ADMIN]),
    processRefund
);

export default router;
