export const requirePaid = (req, res, next) => {
	if (!req.user || !req.user.isPaid) {
		return res.status(403).json({ message: "Payment required to access this resource" });
	}
	return next();
};

export default requirePaid;