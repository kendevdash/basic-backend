import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindOne = vi.fn();
const mockFindById = vi.fn();
const mockSave = vi.fn();
const mockSignAccessToken = vi.fn(() => "access-token");
const mockSignRefreshToken = vi.fn(() => "refresh-token");
const mockVerifyRefreshToken = vi.fn();

vi.mock("../src/utils/generateToken.js", () => ({
	signAccessToken: mockSignAccessToken,
	signRefreshToken: mockSignRefreshToken,
	verifyRefreshToken: mockVerifyRefreshToken
}));

vi.mock("../src/models/User..js", () => {
	class MockUser {
		constructor(data) {
			Object.assign(this, data);
			this._id = data?._id || "user-id";
			this.role = data?.role || "Student";
			this.isPaid = data?.isPaid ?? false;
			this.save = mockSave;
			this.comparePassword = vi.fn();
		}
		toJSON() {
			return {
				id: this._id,
				fullName: this.fullName,
				email: this.email,
				role: this.role,
				isPaid: this.isPaid
			};
		}
		static findOne = mockFindOne;
		static findById = mockFindById;
	}
	return { default: MockUser };
});

const controllerPromise = import("../src/controllers/auth.controller.js");

const selectable = value => ({ select: vi.fn().mockResolvedValue(value) });

const mockRes = () => {
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	res.cookie = vi.fn().mockReturnValue(res);
	res.clearCookie = vi.fn().mockReturnValue(res);
	return res;
};

const requiredBody = (body = {}) => ({ body, cookies: {}, headers: {} });

describe("auth.controller", () => {
	let controller;

	beforeEach(async () => {
		mockFindOne.mockReset();
		mockFindById.mockReset();
		mockSave.mockReset();
		mockSignAccessToken.mockClear();
		mockSignRefreshToken.mockClear();
		mockVerifyRefreshToken.mockReset();
		controller = await controllerPromise;
	});

	describe("registerUser", () => {
		it("creates user and returns tokens", async () => {
			mockFindOne.mockResolvedValueOnce(null);
			mockSave.mockResolvedValueOnce();

			const req = requiredBody({ fullName: "Test User", email: "a@test.com", password: "secret" });
			const res = mockRes();

			await controller.registerUser(req, res);

			expect(mockFindOne).toHaveBeenCalledWith({ email: "a@test.com" });
			expect(mockSave).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", expect.any(Object));
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ accessToken: "access-token", user: expect.any(Object) })
			);
		});

		it("rejects duplicate email", async () => {
			mockFindOne.mockResolvedValueOnce({ id: "existing" });
			const req = requiredBody({ fullName: "Test User", email: "a@test.com", password: "secret" });
			const res = mockRes();

			await controller.registerUser(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({ message: "Email already registered" });
		});
	});

	describe("loginUser", () => {
		it("logs in and returns access token", async () => {
			const userInstance = {
				_id: "u1",
				email: "a@test.com",
				role: "Student",
				isPaid: false,
				password: "hashedpw",
				comparePassword: vi.fn().mockResolvedValue(true),
				toJSON: () => ({ id: "u1", email: "a@test.com", role: "Student", isPaid: false })
			};
			mockFindOne.mockReturnValueOnce(selectable(userInstance));

			const req = requiredBody({ email: "a@test.com", password: "secret" });
			const res = mockRes();

			await controller.loginUser(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", expect.any(Object));
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ accessToken: "access-token", user: expect.any(Object) })
			);
		});

		it("fails with invalid credentials", async () => {
			mockFindOne.mockReturnValueOnce(selectable(null));
			const req = requiredBody({ email: "a@test.com", password: "secret" });
			const res = mockRes();

			await controller.loginUser(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
		});
	});

	describe("refreshToken", () => {
		it("issues new access token", async () => {
			mockVerifyRefreshToken.mockReturnValueOnce({ id: "u1" });
			mockFindById.mockResolvedValueOnce({
				_id: "u1",
				role: "Student",
				isPaid: false,
				toJSON: () => ({ id: "u1", role: "Student", isPaid: false })
			});

			const req = { cookies: { refreshToken: "refresh-token" } };
			const res = mockRes();

			await controller.refreshToken(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", expect.any(Object));
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ accessToken: "access-token", user: expect.any(Object) })
			);
		});

		it("rejects missing refresh token", async () => {
			const req = { cookies: {} };
			const res = mockRes();

			await controller.refreshToken(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: "Refresh token missing" });
		});
	});

	describe("logoutUser", () => {
		it("clears refresh cookie", async () => {
			const req = {};
			const res = mockRes();

			await controller.logoutUser(req, res);

			expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", { httpOnly: true, sameSite: "lax" });
			expect(res.status).toHaveBeenCalledWith(200);
		});
	});
});
