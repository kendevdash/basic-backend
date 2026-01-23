import { verifyAccessToken } from "../utils/generateToken.js";
import User from "../models/User..js";

export const authMiddleware = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "Authorization token missing" });
		}

		const token = authHeader.split(" ")[1];
		const decoded = verifyAccessToken(token);

		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		req.user = {
			id: user.id,
			email: user.email,
			role: user.role,
			isPaid: user.isPaid
		};

		next();
	} catch (err) {
		console.error("Auth middleware error", err);
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};
