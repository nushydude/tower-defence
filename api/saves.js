import { authenticateRequest } from './_lib/auth.js';
import { getDatabase } from './_lib/mongodb.js';

function sanitizeSaveSlot(slot) {
  if (!slot || typeof slot !== 'object') return null;
  return {
    mapId: typeof slot.mapId === 'string' ? slot.mapId : 'grassland',
    coins: Math.max(0, Math.floor(Number(slot.coins) || 0)),
    gems: Math.max(0, Math.floor(Number(slot.gems) || 0)),
    wave: Math.max(0, Math.floor(Number(slot.wave) || 0)),
    hp: Math.max(0, Math.floor(Number(slot.hp) || 100)),
    speed: Number(slot.speed) || 1,
    autoStart: Boolean(slot.autoStart),
    towers: Array.isArray(slot.towers)
      ? slot.towers.map((t) => ({
          id: Number(t.id) || 1,
          type: typeof t.type === 'string' ? t.type : 'Spammer',
          x: Number(t.x) || 0,
          y: Number(t.y) || 0,
          angle: Number(t.angle) || 0,
          cool: 0,
          isVantage: Boolean(t.isVantage)
        }))
      : [],
    createdAt: Number(slot.createdAt) || Date.now(),
    lastSaved: Number(slot.lastSaved) || Date.now()
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const payload = authenticateRequest(req);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in to sync cloud saves.' });
  }

  try {
    const db = await getDatabase();
    const savesCollection = db.collection('game_saves');

    if (req.method === 'GET') {
      const doc = await savesCollection.findOne({ email: payload.email });
      if (!doc) {
        return res.status(200).json({
          saves: [null, null, null],
          activeSlot: 0,
          updatedAt: null
        });
      }
      return res.status(200).json({
        saves: doc.saves || [null, null, null],
        activeSlot: typeof doc.activeSlot === 'number' ? doc.activeSlot : 0,
        updatedAt: doc.updatedAt || null
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const rawSaves = body.saves;
      const rawActiveSlot = body.activeSlot;

      if (!Array.isArray(rawSaves)) {
        return res.status(400).json({ error: 'Saves must be an array of 3 slots.' });
      }

      const sanitizedSaves = [
        sanitizeSaveSlot(rawSaves[0]),
        sanitizeSaveSlot(rawSaves[1]),
        sanitizeSaveSlot(rawSaves[2])
      ];

      const activeSlot = typeof rawActiveSlot === 'number' && rawActiveSlot >= 0 && rawActiveSlot <= 2
        ? rawActiveSlot
        : 0;

      const updatedAt = new Date();

      await savesCollection.updateOne(
        { email: payload.email },
        {
          $set: {
            userId: payload.id,
            email: payload.email,
            saves: sanitizedSaves,
            activeSlot,
            updatedAt
          }
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        updatedAt
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error in saves handler:', err);
    return res.status(500).json({ error: err.message || 'Cloud save operation failed.' });
  }
}
