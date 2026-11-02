import { getDatabase } from '../_lib/mongodb.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const rawEmail = body.email;
    const rawCode = body.code;

    if (!rawEmail || !rawCode) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const email = rawEmail.trim().toLowerCase();
    const code = String(rawCode).trim();

    const db = await getDatabase();
    const codesCollection = db.collection('auth_codes');

    const record = await codesCollection.findOne({ email });

    if (!record) {
      return res.status(400).json({ error: 'No active code found. Please request a new code.' });
    }

    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
      await codesCollection.deleteOne({ email });
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Check maximum attempts
    if (record.attempts >= 5) {
      await codesCollection.deleteOne({ email });
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    // Check code match
    if (record.code !== code) {
      await codesCollection.updateOne({ email }, { $inc: { attempts: 1 } });
      const remaining = 5 - (record.attempts + 1);
      return res.status(400).json({
        error: `Invalid authorization code. ${remaining} attempts remaining.`
      });
    }

    // Code matched! Delete used code
    await codesCollection.deleteOne({ email });

    // Find or create user
    const usersCollection = db.collection('users');
    const userResult = await usersCollection.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date(), lastLoginAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const user = userResult.value || userResult;

    // Issue JWT token
    const token = signToken({
      id: String(user._id),
      email: user.email
    });

    // Check existing game saves in MongoDB
    const savesCollection = db.collection('game_saves');
    const existingSaves = await savesCollection.findOne({ email });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: String(user._id),
        email: user.email
      },
      cloudSaves: existingSaves ? existingSaves.saves : null,
      activeSlot: existingSaves ? existingSaves.activeSlot : null
    });
  } catch (err) {
    console.error('Error in verify-code handler:', err);
    return res.status(500).json({
      error: err.message || 'Verification failed.'
    });
  }
}
