import mongoose from "mongoose";
import { APP_CONSTANTS } from "../config/constants.js";

const paymentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "USD",
        },
        status: {
            type: String,
            enum: Object.values(APP_CONSTANTS.PAYMENT_STATUS),
            default: APP_CONSTANTS.PAYMENT_STATUS.PENDING,
        },
        paymentGateway: {
            type: String,
            enum: ["stripe", "razorpay", "paypal", "manual"],
            required: true,
        },
        transactionId: {
            type: String,
            default: null,
        },
        paymentIntentId: {
            type: String,
            default: null,
        },
        paymentMethod: {
            type: String,
            default: null,
        },
        metadata: {
            type: Map,
            of: String,
            default: {},
        },
        paidAt: {
            type: Date,
            default: null,
        },
        refundedAt: {
            type: Date,
            default: null,
        },
        refundReason: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for querying
paymentSchema.index({ student: 1, course: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
