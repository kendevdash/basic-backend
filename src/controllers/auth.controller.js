import User from "../models/User..js";
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken
} from "../utils/generateToken.js";

const requiredFields = (fields, body) => fields.filter(field => !body[field]);

const setRefreshCookie = (res, token) => {
	const isProduction = process.env.NODE_ENV === "production";
	res.cookie("refreshToken", token, {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? "strict" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
	});
};

const buildAuthResponse = user => {
	const accessToken = signAccessToken({
		id: user._id,
		role: user.role,
		isPaid: user.isPaid
	});
	const refreshToken = signRefreshToken({
		id: user._id,
		role: user.role,
		isPaid: user.isPaid
	});

	return { accessToken, refreshToken, user: user.toJSON() };
};

export const registerUser = async (req, res) => {
	const missing = requiredFields(["fullName", "email", "password"], req.body);
	if (missing.length) {
		return res.status(400).json({ message: "Missing required fields", missing });
	}

	const { fullName, email, password, role, isPaid } = req.body;

	try {
		const existing = await User.findOne({ email });
		if (existing) {
			return res.status(409).json({ message: "Email already registered" });
		}

		const user = new User({ fullName, email, password, role, isPaid });
		await user.save();

		const { accessToken, refreshToken, user: safeUser } = buildAuthResponse(user);
		setRefreshCookie(res, refreshToken);

		return res.status(201).json({
			message: "User registered successfully",
			user: safeUser,
			accessToken
		});
	} catch (err) {
		console.error("Register error", err);
		return res.status(500).json({ message: "Server error" });
	}
};

export const loginUser = async (req, res) => {
	const missing = requiredFields(["email", "password"], req.body);
	if (missing.length) {
		return res.status(400).json({ message: "Missing required fields", missing });
	}

	const { email, password } = req.body;

	try {
		const query = User.findOne({ email });
		const user = typeof query?.select === "function"
			? await query.select("+password")
			: await query;
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		if (!user.password) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const { accessToken, refreshToken, user: safeUser } = buildAuthResponse(user);
		setRefreshCookie(res, refreshToken);

		return res.status(200).json({
			message: "Login successful",
			user: safeUser,
			accessToken
		});
	} catch (err) {
		console.error("Login error", err);
		return res.status(500).json({ message: "Server error" });
	}
};

export const refreshToken = async (req, res) => {
	const token = req.cookies?.refreshToken;
	if (!token) {
		return res.status(401).json({ message: "Refresh token missing" });
	}

	try {
		const payload = verifyRefreshToken(token);
		const user = await User.findById(payload.id);
		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		const { accessToken, refreshToken: newRefreshToken, user: safeUser } = buildAuthResponse(user);
		setRefreshCookie(res, newRefreshToken);

		return res.status(200).json({
			message: "Token refreshed",
			user: safeUser,
			accessToken
		});
	} catch (err) {
		console.error("Refresh error", err);
		return res.status(401).json({ message: "Invalid or expired refresh token" });
	}
};

export const logoutUser = (_req, res) => {
	res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax" });
	return res.status(200).json({ message: "Logged out" });
};

export default { registerUser, loginUser, refreshToken, logoutUser };
