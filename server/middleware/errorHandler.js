export function errorHandler(err, req, res, next) {
  console.error('[v0] Error:', err.message);

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(400).json({
      error: 'Database error',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
    });
  }

  // Custom errors
  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
  });
}
