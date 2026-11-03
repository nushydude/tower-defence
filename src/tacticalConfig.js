/**
 * Tactical Modifiers & Strategy Configuration
 * Allows fine-grained tuning and live testing of strategic anti-spam constraints:
 * - Command Power Grid (Tower Deployment Cap)
 * - Duplicate Purchase Surcharge (Anti-Spam Scaling Tax)
 * - Flat Enemy Armor & Damage Thresholds (Counters weak rapid bullet spam)
 * - Energy Phase Shields (Absorbs kinetic; weak to directed lasers/energy)
 * - Tactical Overlook Platforms (High-ground vantage pads with range/dmg buffs)
 * - Adjacency Command Synergy (Cluster teamwork buffs)
 */

export const TACTICAL_STORAGE_KEY = 'tower_defense_tactical_config_v1';

export const PRESET_PROFILES = {
  classic: {
    id: 'classic',
    name: 'Classic Arcade',
    badge: 'CASUAL',
    badgeClass: 'badge-classic',
    icon: '🌱',
    description: 'Vanilla rules — infinite placement freedom, no armor, no limits. Spam towers anywhere.',
    settings: {
      deploymentCapEnabled: false,
      maxTowers: 8,
      surchargeEnabled: false,
      surchargePercent: 15,
      enemyArmorEnabled: false,
      armorTier: 'medium',
      shieldsEnabled: false,
      shieldTier: 'medium',
      vantagePadsEnabled: false,
      adjacencySynergyEnabled: false
    }
  },
  tactical: {
    id: 'tactical',
    name: 'Strategic Tactical',
    badge: 'RECOMMENDED',
    badgeClass: 'badge-tactical',
    icon: '⚡',
    description: 'Balanced strategic combat. 8-tower command limit, armor counters bullet spam, vantage pads reward placement.',
    settings: {
      deploymentCapEnabled: true,
      maxTowers: 8,
      surchargeEnabled: true,
      surchargePercent: 15,
      enemyArmorEnabled: true,
      armorTier: 'medium',
      shieldsEnabled: true,
      shieldTier: 'medium',
      vantagePadsEnabled: true,
      adjacencySynergyEnabled: true
    }
  },
  hardcore: {
    id: 'hardcore',
    name: 'Nightmare Outpost',
    badge: 'EXTREME',
    badgeClass: 'badge-hardcore',
    icon: '💀',
    description: 'Ruthless defense simulation. 6-tower hard cap, heavy armor plating, thick phase barriers, and high tax.',
    settings: {
      deploymentCapEnabled: true,
      maxTowers: 6,
      surchargeEnabled: true,
      surchargePercent: 25,
      enemyArmorEnabled: true,
      armorTier: 'heavy',
      shieldsEnabled: true,
      shieldTier: 'heavy',
      vantagePadsEnabled: true,
      adjacencySynergyEnabled: true
    }
  }
};

export const DEFAULT_TACTICAL_CONFIG = {
  profile: 'tactical', // 'classic' | 'tactical' | 'hardcore' | 'custom'
  ...PRESET_PROFILES.tactical.settings
};

export const VANTAGE_PADS = {
  grassland: [
    { x: 310, y: 155, id: 'gp1', name: 'Upper Ridge' },
    { x: 170, y: 290, id: 'gp2', name: 'West Overlook' },
    { x: 310, y: 430, id: 'gp3', name: 'Central Bastion' },
    { x: 170, y: 565, id: 'gp4', name: 'South Plateau' }
  ],
  desert: [
    { x: 240, y: 90, id: 'dp1', name: 'North Canyon Spire' },
    { x: 240, y: 240, id: 'dp2', name: 'Dune Basin Hub' },
    { x: 240, y: 400, id: 'dp3', name: 'Midway Chokehold' },
    { x: 240, y: 555, id: 'dp4', name: 'South Oasis Bluff' }
  ],
  crossroads: [
    { x: 160, y: 185, id: 'cp1', name: 'NW Plaza Pillar' },
    { x: 320, y: 185, id: 'cp2', name: 'NE Plaza Pillar' },
    { x: 160, y: 420, id: 'cp3', name: 'SW Grand Pavilion' },
    { x: 320, y: 420, id: 'cp4', name: 'SE Grand Pavilion' }
  ]
};

// Aliases
VANTAGE_PADS.island = VANTAGE_PADS.crossroads;

export const TOWER_ROOT_BRANCHES = {
  Spammer: ['Spammer', 'Blaster', 'Rotary', 'Vulcan', 'Harpy', 'Thunder', 'Dual Thunder'],
  Scout: ['Scout', 'Ace', 'Ranger', 'Deadeye', 'Pulsar', 'Gamma', 'Atomic'],
  Railgun: ['Railgun', 'Double Railgun', 'Triple Railgun'],
  Shotgun: ['Shotgun', 'Scatter', 'Cluster', 'Supercluster', 'Flak Cannon', 'Bombard', 'Colossus'],
  Double: ['Double', 'Triple', 'Quadruple', 'Penta', 'Twin Flank', 'Spreadshot', 'Hydra'],
  'Side Turret': ['Side Turret', 'Fourway', 'Eightway', 'Nova', 'Cyclone', 'Vortex'],
  Spiker: ['Spiker', 'Double Spiker', 'ALLSPIKER', 'Bastion', 'Citadel', 'Ballista', 'Javelin', 'Trident']
};

const TOWER_TO_ROOT = {};
for (const [root, members] of Object.entries(TOWER_ROOT_BRANCHES)) {
  for (const m of members) {
    TOWER_TO_ROOT[m] = root;
  }
}

export function getTowerRootBranch(towerType) {
  return TOWER_TO_ROOT[towerType] || 'Spammer';
}

class TacticalConfigManager {
  constructor() {
    this.config = this._load();
    this.listeners = new Set();
  }

  _load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(TACTICAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...DEFAULT_TACTICAL_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not read tactical config:', e);
    }
    return { ...DEFAULT_TACTICAL_CONFIG };
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TACTICAL_STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('Could not save tactical config:', e);
    }
    this._notify();
  }

  get() {
    return this.config;
  }

  update(partial) {
    this.config = { ...this.config, ...partial, profile: 'custom' };
    this.save();
  }

  setPreset(presetId) {
    const preset = PRESET_PROFILES[presetId];
    if (preset) {
      this.config = {
        profile: presetId,
        ...preset.settings
      };
      this.save();
    }
  }

  reset() {
    this.config = { ...DEFAULT_TACTICAL_CONFIG };
    this.save();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.get());
    return () => this.listeners.delete(callback);
  }

  _notify() {
    const snapshot = this.get();
    this.listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('Tactical config listener error:', err);
      }
    });
  }

  // Helper: Calculate dynamic shop cost with duplicate tax
  calculateTowerCost(baseCost, towerType, existingTowers = []) {
    if (!this.config.surchargeEnabled || !this.config.surchargePercent) {
      return baseCost;
    }
    const rootBranch = getTowerRootBranch(towerType);
    let duplicates = 0;
    for (let i = 0; i < existingTowers.length; i++) {
      if (getTowerRootBranch(existingTowers[i].type) === rootBranch) {
        duplicates++;
      }
    }
    if (duplicates <= 0) return baseCost;

    const rate = this.config.surchargePercent / 100;
    const multiplier = 1 + duplicates * rate;
    return Math.round(baseCost * multiplier);
  }

  // Helper: Check if tower deployment cap is reached
  isCapReached(currentCount) {
    if (!this.config.deploymentCapEnabled) return false;
    return currentCount >= this.config.maxTowers;
  }

  // Helper: Determine enemy armor
  getEnemyArmor(shape, isBoss = false, tier = 1) {
    if (!this.config.enemyArmorEnabled) return 0;
    const tierMultiplier = this.config.armorTier === 'light' ? 0.7 : this.config.armorTier === 'heavy' ? 1.4 : 1.0;

    if (isBoss) {
      return Math.round(15 * tier * tierMultiplier);
    }

    switch (shape) {
      case 'hexagon': // Armored Hexagon
        return Math.round(6 * tierMultiplier);
      case 'octagon': // Obsidian Octagon (Juggernaut)
        return Math.round(11 * tierMultiplier);
      case 'decagon': // Colossus
        return Math.round(16 * tierMultiplier);
      default:
        return 0;
    }
  }

  // Helper: Determine enemy phase shield
  getEnemyShield(shape, maxHp, isBoss = false) {
    if (!this.config.shieldsEnabled) return 0;
    const ratio = this.config.shieldTier === 'light' ? 0.20 : this.config.shieldTier === 'heavy' ? 0.50 : 0.35;

    // Fast sprinters, pentagon bruisers, and bosses get energy shields
    if (isBoss) {
      return Math.round(maxHp * ratio * 0.75);
    }
    if (['circle', 'diamond', 'pentagon', 'cross'].includes(shape)) {
      return Math.round(maxHp * ratio);
    }
    return 0;
  }

  // Helper: Get vantage pads for a map
  getVantagePads(mapId) {
    if (!this.config.vantagePadsEnabled) return [];
    return VANTAGE_PADS[mapId] || VANTAGE_PADS.grassland || [];
  }

  // Helper: Check if a position snaps to a vantage pad
  checkVantage(x, y, mapId, snapDist = 24) {
    if (!this.config.vantagePadsEnabled) return null;
    const pads = this.getVantagePads(mapId);
    for (const pad of pads) {
      if (Math.hypot(pad.x - x, pad.y - y) <= snapDist) {
        return pad;
      }
    }
    return null;
  }
}

export const tacticalConfig = new TacticalConfigManager();
