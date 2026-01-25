import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Mocks (must be hoisted before vi.mock)
const paymentMock = vi.hoisted(() => ({
	create: vi.fn(),
	findOne: vi.fn()
}));

const userMock = vi.hoisted(() => ({
	findByIdAndUpdate: vi.fn().mockResolvedValue()
}));

const createMockPayment = () => ({
	reference: "ref-123",
	amount: 10,
	currency: "USD",
	status: "pending",
	save: vi.fn().mockResolvedValue()
});

vi.mock("../src/models/Payment.js", () => ({ default: paymentMock }));
vi.mock("../src/models/User.js", () => ({ default: userMock }));

let initiatePayment;
let handlePaymentWebhook;

const mockRes = () => {
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

describe("payments.controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.PAYMENT_WEBHOOK_SECRET = "test_secret";
	});

	beforeEach(async () => {
		vi.resetModules();
		({ initiatePayment, handlePaymentWebhook } = await import("../src/controllers/payments.controller.js"));
	});

	describe("initiatePayment", () => {
		it("returns 400 if amount missing", async () => {
			const req = { body: { amount: 0 }, user: { id: "u1" } };
			const res = mockRes();
			await initiatePayment(req, res);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
		});

		it("creates payment and returns reference", async () => {
			const payment = { ...createMockPayment() };
			paymentMock.create.mockResolvedValue(payment);
			const req = { body: { amount: 20, currency: "USD", method: "visa_card" }, user: { id: "user1" } };
			const res = mockRes();
			await initiatePayment(req, res);
			expect(paymentMock.create).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ reference: payment.reference }));
		});
	});

	describe("handlePaymentWebhook", () => {
		it("rejects invalid signature", async () => {
			const req = { headers: { "x-webhook-signature": "bad" }, body: { reference: "ref-1", status: "success" } };
			const res = mockRes();
			await handlePaymentWebhook(req, res);
			expect(res.status).toHaveBeenCalledWith(401);
		});

		it("updates payment and user on success", async () => {
			const body = { reference: "ref-1", status: "success", amount: 15, currency: "USD", provider: "mock" };
			const sig = crypto.createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET).update(JSON.stringify(body)).digest("hex");

			const save = vi.fn().mockResolvedValue();
			const payment = { ...body, status: "pending", user: "user1", save };
			paymentMock.findOne.mockResolvedValue(payment);

			const req = { headers: { "x-webhook-signature": sig }, body };
			const res = mockRes();

			await handlePaymentWebhook(req, res);

			expect(paymentMock.findOne).toHaveBeenCalledWith({ reference: body.reference });
			expect(save).toHaveBeenCalled();
			expect(userMock.findByIdAndUpdate).toHaveBeenCalledWith("user1", { isPaid: true });
			expect(res.status).toHaveBeenCalledWith(200);
		});
	});
});
