import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import { asyncHandler, successResponse, errorResponse } from "../utils/helpers.js";
import { APP_CONSTANTS } from "../config/constants.js";

/**
 * @desc    Create payment intent (Stripe/Razorpay)
 * @route   POST /api/payments/create
 * @access  Private (Student)
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { courseId, paymentGateway, metadata } = req.body;

  if (!courseId || !paymentGateway) {
    return errorResponse(res, 400, "Course ID and payment gateway are required");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return errorResponse(res, 404, "Course not found");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    paymentStatus: APP_CONSTANTS.PAYMENT_STATUS.COMPLETED,
  });

  if (existingEnrollment) {
    return errorResponse(res, 400, "Course already purchased");
  }

  const payment = await Payment.create({
    student: req.user._id,
    course: courseId,
    amount: course.price,
    currency: "USD",
    paymentGateway,
    status:
      paymentGateway === "bank_transfer"
        ? APP_CONSTANTS.PAYMENT_STATUS.PENDING
        : APP_CONSTANTS.PAYMENT_STATUS.UNDER_REVIEW,
    metadata,
  });

  return successResponse(res, 201, "Payment initiated", {
    paymentId: payment._id,
    paymentGateway,
    nextStep: "Upload payment proof or wait for admin verification",
  });
});

/**
 * @desc    Get payment history for current user
 * @route   GET /api/payments/history
 * @access  Private
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ student: req.user._id })
        .populate("course", "title thumbnail price")
        .sort({ createdAt: -1 });

    return successResponse(res, 200, "Payment history retrieved", {
        payments,
        count: payments.length,
    });
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
export const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate("student", "name email")
        .populate("course", "title price");

    if (!payment) {
        return errorResponse(res, 404, "Payment not found");
    }

    // Verify ownership
    if (
        payment.student._id.toString() !== req.user._id.toString() &&
        req.user.role !== APP_CONSTANTS.ROLES.ADMIN
    ) {
        return errorResponse(res, 403, "Not authorized to view this payment");
    }

    return successResponse(res, 200, "Payment retrieved successfully", {
        payment,
    });
});

/**
 * @desc    Get all payments (Admin only)
 * @route   GET /api/payments
 * @access  Private (Admin)
 */
export const getAllPayments = asyncHandler(async (req, res) => {
    const { status, gateway, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (gateway) filter.paymentGateway = gateway;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
        .populate("student", "name email")
        .populate("course", "title price")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    return successResponse(res, 200, "Payments retrieved successfully", {
        payments,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalPayments: total,
        },
    });
});

/**
 * @desc    Process refund
 * @route   POST /api/payments/:id/refund
 * @access  Private (Admin)
 */
export const processRefund = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return errorResponse(res, 404, "Payment not found");
    }

    if (payment.status !== APP_CONSTANTS.PAYMENT_STATUS.COMPLETED) {
        return errorResponse(res, 400, "Only completed payments can be refunded");
    }

    // TODO: Process refund with payment gateway
    // await stripe.refunds.create({ payment_intent: payment.paymentIntentId });

    payment.status = APP_CONSTANTS.PAYMENT_STATUS.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    await payment.save();

    // Revoke course access
    await Enrollment.findOneAndUpdate(
        { student: payment.student, course: payment.course },
        { accessGranted: false, paymentStatus: APP_CONSTANTS.PAYMENT_STATUS.REFUNDED }
    );

    return successResponse(res, 200, "Refund processed successfully", {
        payment,
    });
});


// approve payments

export const approvePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return errorResponse(res, 404, "Payment not found");
  }

  if (payment.status === APP_CONSTANTS.PAYMENT_STATUS.COMPLETED) {
    return errorResponse(res, 400, "Payment already approved");
  }

  payment.status = APP_CONSTANTS.PAYMENT_STATUS.COMPLETED;
  payment.paidAt = new Date();
  await payment.save();

  await Enrollment.findOneAndUpdate(
    { student: payment.student, course: payment.course },
    {
      student: payment.student,
      course: payment.course,
      paymentStatus: APP_CONSTANTS.PAYMENT_STATUS.COMPLETED,
      paymentId: payment._id,
      accessGranted: true,
    },
    { upsert: true }
  );

  return successResponse(res, 200, "Payment approved and access granted");
});


/// reject payments

export const rejectPayment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return errorResponse(res, 404, "Payment not found");
  }

  payment.status = APP_CONSTANTS.PAYMENT_STATUS.FAILED;
  payment.refundReason = reason || "Payment rejected";
  await payment.save();

  return successResponse(res, 200, "Payment rejected");
});
