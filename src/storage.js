/**
 * Persistent Storage Management for Tower Defence
 * Handles localStorage persistence, automatic backups, crash recovery, and save metadata.
 */

const STORAGE_KEY = 'tower_defense_saves_v2';
const ACTIVE_SLOT_KEY = 'tower_defense_active_slot_v2';

/**
 * Load all 3 save slots from localStorage.
 * Returns an array of length 3: [slot0, slot1, slot2]
 */
export function loadAllSaves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [null, null, null];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [null, null, null];
    return [
      parsed[0] || null,
      parsed[1] || null,
      parsed[2] || null
    ];
  } catch (err) {
    console.warn('Failed to load saves from localStorage:', err);
    return [null, null, null];
  }
}

/**
 * Save a specific slot index (0, 1, or 2) to localStorage.
 */
export function saveSlotToStorage(slotIndex, state) {
  if (slotIndex < 0 || slotIndex > 2) return;
  try {
    const saves = loadAllSaves();
    if (!state) {
      saves[slotIndex] = null;
    } else {
      // Build a clean, serializable checkpoint that omits transient active projectiles
      // but preserves all player assets, towers, progress, and map data.
      saves[slotIndex] = {
        mapId: state.mapId || 'grassland',
        coins: Math.max(0, Math.floor(state.coins ?? 300)),
        gems: Math.max(0, state.gems ?? 0),
        wave: Math.max(0, state.wave ?? 0),
        hp: Math.max(0, state.hp ?? 100),
        speed: state.speed || 1,
        autoStart: Boolean(state.autoStart),
        towers: Array.isArray(state.towers)
          ? state.towers.map((t) => ({
              id: t.id,
              type: t.type,
              x: t.x,
              y: t.y,
              angle: t.angle || 0,
              cool: 0
            }))
          : [],
        createdAt: state.createdAt || Date.now(),
        lastSaved: Date.now()
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  } catch (err) {
    console.error('Failed to write save to localStorage:', err);
  }
}

/**
 * Delete a specific save slot.
 */
export function deleteSlotFromStorage(slotIndex) {
  saveSlotToStorage(slotIndex, null);
}

/**
 * Get the last active slot index (default 0).
 */
export function getStoredActiveSlot() {
  try {
    const val = localStorage.getItem(ACTIVE_SLOT_KEY);
    const num = parseInt(val, 10);
    return isNaN(num) || num < 0 || num > 2 ? 0 : num;
  } catch {
    return 0;
  }
}

/**
 * Persist the active slot index.
 */
export function setStoredActiveSlot(slotIndex) {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, String(slotIndex));
  } catch (err) {
    console.warn('Failed to persist active slot:', err);
  }
}

/**
 * Helper to format relative or friendly timestamp
 */
export function formatSaveTime(timestamp) {
  if (!timestamp) return 'Never';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
