import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  // Deterministic fallback derived from MONGODB_URI so tokens survive restarts
  const seed = process.env.MONGODB_URI || 'tower-defence-secret-salt-2026';
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function signToken(payload) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export function authenticateRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  return verifyToken(parts[1]);
}
