import jwt from "jsonwebtoken";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES || "7d";
const ACCESS_SECRET = process.env.JWT_SECRET || "change_me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_SECRET;

export function signAccessToken(payload, options = {}) {
	return jwt.sign(payload, ACCESS_SECRET, {
		expiresIn: options.expiresIn || ACCESS_EXPIRES_IN
	});
}

export function signRefreshToken(payload, options = {}) {
	return jwt.sign(payload, REFRESH_SECRET, {
		expiresIn: options.expiresIn || REFRESH_EXPIRES_IN
	});
}

export function verifyAccessToken(token) {
	return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
	return jwt.verify(token, REFRESH_SECRET);
}
