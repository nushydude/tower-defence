import { authenticateRequest } from '../_lib/auth.js';
import { getDatabase } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = authenticateRequest(req);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }

  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    let user = null;

    if (payload.id && ObjectId.isValid(payload.id)) {
      user = await usersCollection.findOne({ _id: new ObjectId(payload.id) });
    }
    if (!user && payload.email) {
      user = await usersCollection.findOne({ email: payload.email });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      user: {
        id: String(user._id),
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to authenticate user.' });
  }
}
