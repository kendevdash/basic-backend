export const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const successResponse = (res, status, message, data = {}) =>
  res.status(status).json({ success: true, message, ...data });

export const errorResponse = (res, status, message) =>
  res.status(status).json({ success: false, message });
