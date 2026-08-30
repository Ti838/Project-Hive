export function errorHandler(err, req, res, next) {
  console.error('[ProjectHive] Error:', err.message);

  // Validation errors (Joi)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(d => ({ field: d.path.join('.'), message: d.message })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Supabase / PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists (duplicate entry)' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }
  if (err.code === 'PGRST116' || err.code === '42P01') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // Custom errors with status
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Default
  res.status(500).json({ error: 'Internal server error' });
}
