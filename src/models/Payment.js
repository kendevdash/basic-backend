import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		amount: { type: Number, required: true, min: 0 },
		currency: { type: String, default: "USD" },
		method: {
			type: String,
			enum: [
				"mtn_momo",
				"visa_card",
				"bank_transfer",
				"card",
				"momo",
				"bank",
				"other",
				"flutterwave"
			],
			default: "visa_card"
		},
		provider: { type: String, default: "mock" },
		reference: { type: String, required: true, unique: true },
		status: {
			type: String,
			enum: ["pending", "success", "failed", "pending_review"],
			default: "pending"
		},
		metadata: { type: Object },
		rawWebhook: { type: Object },
		paidAt: { type: Date }
	},
	{ timestamps: true }
);

paymentSchema.index({ reference: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
