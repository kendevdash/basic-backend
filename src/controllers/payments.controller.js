import crypto from "crypto";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { createPaymentSession, SUPPORTED_METHODS, normalizeMethod } from "../services/paymentProvider.js";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "dev_webhook_secret";
const DEFAULT_CURRENCY = process.env.PAYMENT_DEFAULT_CURRENCY || "USD";

const signPayload = payload => {
	const bodyString = typeof payload === "string" ? payload : JSON.stringify(payload);
	return crypto.createHmac("sha256", WEBHOOK_SECRET).update(bodyString).digest("hex");
};

export const initiatePayment = async (req, res) => {
	try {
		const { amount, currency = DEFAULT_CURRENCY, method: rawMethod = "visa_card", provider: rawProvider, metadata = {} } = req.body;
		if (!amount || Number(amount) <= 0) {
			return res.status(400).json({ message: "Amount must be greater than zero" });
		}
		const method = normalizeMethod(rawMethod) || normalizeMethod(rawProvider);
		if (!method) {
			return res.status(400).json({ message: `Unsupported payment method. Use one of: ${SUPPORTED_METHODS.join(", ")}` });
		}

		const session = await createPaymentSession({ amount: Number(amount), currency, method, userId: req.user.id, metadata, provider: rawProvider });

		const payment = await Payment.create({
			user: req.user.id,
			amount: Number(amount),
			currency,
			method,
			provider: session.provider,
			reference: session.reference,
			status: "pending",
			metadata
		});

		return res.status(201).json({
			message: "Payment initiated",
			reference: payment.reference,
			amount: payment.amount,
			currency: payment.currency,
			status: payment.status,
			checkoutUrl: session.checkoutUrl,
			method: payment.method,
			provider: payment.provider
		});
	} catch (err) {
		console.error("initiatePayment error", err);
		return res.status(500).json({ message: "Failed to initiate payment" });
	}
};

export const handlePaymentWebhook = async (req, res) => {
	try {
		const signature = req.headers["x-webhook-signature"];
		const expected = signPayload(req.body);
		if (!signature || signature !== expected) {
			return res.status(401).json({ message: "Invalid webhook signature" });
		}

		const { reference, status, amount, currency, provider } = req.body || {};
		if (!reference || !status) {
			return res.status(400).json({ message: "Missing reference or status" });
		}

		const payment = await Payment.findOne({ reference });
		if (!payment) {
			return res.status(404).json({ message: "Payment not found" });
		}

		// Idempotency: if already success, acknowledge
		if (payment.status === "success") {
			return res.status(200).json({ message: "Already processed" });
		}

		if (status === "success") {
			payment.status = "success";
			payment.paidAt = new Date();
			if (amount) payment.amount = amount;
			if (currency) payment.currency = currency;
			if (provider) payment.provider = provider;
		} else if (status === "failed") {
			payment.status = "failed";
		} else if (status === "pending_review") {
			payment.status = "pending_review";
		}

		payment.rawWebhook = req.body;
		await payment.save();

		if (payment.status === "success") {
			await User.findByIdAndUpdate(payment.user, { isPaid: true });
		}

		return res.status(200).json({ message: "Webhook processed", status: payment.status });
	} catch (err) {
		console.error("handlePaymentWebhook error", err);
		return res.status(500).json({ message: "Webhook processing failed" });
	}
};

export const listMyPayments = async (req, res) => {
	try {
		const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
		return res.status(200).json({ payments });
	} catch (err) {
		console.error("listMyPayments error", err);
		return res.status(500).json({ message: "Failed to fetch payments" });
	}
};

export default { initiatePayment, handlePaymentWebhook, listMyPayments };
