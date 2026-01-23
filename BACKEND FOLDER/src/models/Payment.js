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
            enum: ["mtn_momo", "bank_transfer", "bitcoin", "usdt"],
            required: true,
        },

        transactionId: {
            type: String,
            default: null,
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
        proof: {
            type: String, // receipt image URL or transaction hash
            default: null,
        },
        metadata: {
            type: Object, // phone number, wallet address, network, etc.
            default: {},
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
