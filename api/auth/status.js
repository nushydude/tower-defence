import { checkMongoHealth } from '../_lib/mongodb.js';
import { checkEmailHealth } from '../_lib/email.js';

export default async function handler(req, res) {
  // Set CORS and JSON headers
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

  try {
    const dbStatus = await checkMongoHealth();
    const emailStatus = checkEmailHealth();

    // Enabled only if MongoDB is configured & connected AND email delivery is configured!
    const enabled = Boolean(dbStatus.configured && dbStatus.connected && emailStatus.configured);

    let reason = null;
    if (!dbStatus.configured) {
      reason = 'MONGODB_URI is not set in environment variables.';
    } else if (!dbStatus.connected) {
      reason = `Cannot connect to MongoDB Atlas cluster: ${dbStatus.error || 'Connection failed'}`;
    } else if (!emailStatus.configured) {
      reason = 'Email delivery credentials (RESEND_API_KEY or SMTP) are not configured.';
    }

    return res.status(200).json({
      enabled,
      database: {
        configured: dbStatus.configured,
        connected: dbStatus.connected,
        error: dbStatus.error || null
      },
      email: {
        configured: emailStatus.configured,
        provider: emailStatus.provider
      },
      reason
    });
  } catch (err) {
    return res.status(200).json({
      enabled: false,
      reason: err.message
    });
  }
}
