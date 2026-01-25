import { describe, it, expect, vi, beforeEach } from "vitest";

const courseMock = vi.hoisted(() => ({
	create: vi.fn(),
	find: vi.fn(),
	findByIdAndUpdate: vi.fn(),
	findByIdAndDelete: vi.fn()
}));

const materialMock = vi.hoisted(() => ({
	create: vi.fn(),
	find: vi.fn(),
	findByIdAndUpdate: vi.fn(),
	findByIdAndDelete: vi.fn(),
	deleteMany: vi.fn()
}));

const paymentMock = vi.hoisted(() => ({
	find: vi.fn(),
	findById: vi.fn()
}));

const userMock = vi.hoisted(() => ({
	findByIdAndUpdate: vi.fn()
}));

vi.mock("../src/models/Course.js", () => ({ default: courseMock }));
vi.mock("../src/models/Material.js", () => ({ default: materialMock }));
vi.mock("../src/models/Payment.js", () => ({ default: paymentMock }));
vi.mock("../src/models/User.js", () => ({ default: userMock }));

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
	updatePaymentStatus
} from "../src/controllers/admin.controller.js";

const mockRes = () => {
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

const chainable = (data = []) => ({
	sort: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(data) })
});

const listChain = (data = []) => ({
	sort: vi.fn().mockReturnValue(data)
});

describe("admin.controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("courses", () => {
		it("validates required title", async () => {
			const req = { body: {}, user: { id: "admin1" } };
			const res = mockRes();
			await createCourse(req, res);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it("creates course", async () => {
			const course = { id: "c1", title: "Test" };
			courseMock.create.mockResolvedValue(course);
			const req = { body: { title: "Test" }, user: { id: "admin1" } };
			const res = mockRes();
			await createCourse(req, res);
			expect(courseMock.create).toHaveBeenCalledWith(expect.objectContaining({ title: "Test" }));
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({ course });
		});

		it("lists courses", async () => {
			const courses = [{ id: "c1" }];
			courseMock.find.mockReturnValue(listChain(courses));
			const res = mockRes();
			await listCourses({}, res);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ courses });
		});

		it("returns 404 on missing course update", async () => {
			courseMock.findByIdAndUpdate.mockResolvedValue(null);
			const req = { params: { id: "missing" }, body: { title: "x" } };
			const res = mockRes();
			await updateCourse(req, res);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it("deletes course and materials", async () => {
			courseMock.findByIdAndDelete.mockResolvedValue({ id: "c1" });
			materialMock.deleteMany.mockResolvedValue();
			const req = { params: { id: "c1" } };
			const res = mockRes();
			await deleteCourse(req, res);
			expect(materialMock.deleteMany).toHaveBeenCalledWith({ course: "c1" });
			expect(res.status).toHaveBeenCalledWith(200);
		});
	});

	describe("materials", () => {
		it("requires course, title, url", async () => {
			const req = { body: {} };
			const res = mockRes();
			await createMaterial(req, res);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it("creates material", async () => {
			materialMock.create.mockResolvedValue({ id: "m1" });
			const req = { body: { course: "c1", title: "Intro", url: "http://x" } };
			const res = mockRes();
			await createMaterial(req, res);
			expect(materialMock.create).toHaveBeenCalledWith(expect.objectContaining({ title: "Intro" }));
			expect(res.status).toHaveBeenCalledWith(201);
		});

		it("lists materials", async () => {
			const materials = [{ id: "m1" }];
			materialMock.find.mockReturnValue(listChain(materials));
			const res = mockRes();
			await listMaterials({ query: {} }, res);
			expect(res.json).toHaveBeenCalledWith({ materials });
		});

		it("returns 404 on missing material update", async () => {
			materialMock.findByIdAndUpdate.mockResolvedValue(null);
			const req = { params: { id: "m-missing" }, body: { title: "x" } };
			const res = mockRes();
			await updateMaterial(req, res);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it("deletes material", async () => {
			materialMock.findByIdAndDelete.mockResolvedValue({ id: "m1" });
			const req = { params: { id: "m1" } };
			const res = mockRes();
			await deleteMaterial(req, res);
			expect(res.status).toHaveBeenCalledWith(200);
		});
	});

	describe("payments", () => {
		it("lists payments", async () => {
			const payments = [{ id: "p1" }];
			paymentMock.find.mockReturnValue(chainable(payments));
			const res = mockRes();
			await listPayments({}, res);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ payments });
		});

		it("requires status when updating", async () => {
			const req = { params: { id: "p1" }, body: {} };
			const res = mockRes();
			await updatePaymentStatus(req, res);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it("updates status and marks user paid", async () => {
			const save = vi.fn().mockResolvedValue();
			const payment = { id: "p1", user: "u1", status: "pending", save };
			paymentMock.findById.mockResolvedValue(payment);
			const req = { params: { id: "p1" }, body: { status: "success" } };
			const res = mockRes();
			await updatePaymentStatus(req, res);
			expect(userMock.findByIdAndUpdate).toHaveBeenCalledWith("u1", { isPaid: true });
			expect(save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
		});
	});
});
