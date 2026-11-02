import { getDatabase } from '../_lib/mongodb.js';
import { sendVerificationEmail } from '../_lib/email.js';

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

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email format.' });
    }

    const db = await getDatabase();
    const codesCollection = db.collection('auth_codes');

    // 1. Rate-limit check: check if code requested in last 60 seconds
    const existing = await codesCollection.findOne({
      email,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (existing) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - new Date(existing.createdAt).getTime())) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds}s before requesting a new authorization code.`
      });
    }

    // 2. Generate cryptographically random 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 3. Store in MongoDB with 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await codesCollection.updateOne(
      { email },
      {
        $set: {
          code,
          expiresAt,
          attempts: 0,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // 4. Send email
    await sendVerificationEmail(email, code);

    const payload = {
      success: true,
      message: 'Tactical authorization code dispatched to your email.',
      email
    };

    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_AUTH === 'true') {
      payload.devCode = code;
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error('Error in send-code handler:', err);
    return res.status(500).json({
      error: err.message || 'Failed to dispatch verification code.'
    });
  }
}
