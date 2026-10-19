export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    Number.isInteger(error.statusCode) && error.statusCode >= 400
      ? error.statusCode
      : 500;

  return res.status(statusCode).json({
    error:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : error.message || "An unexpected server error occurred.",
  });
}
