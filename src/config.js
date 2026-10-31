export const TOWER_DEFINITIONS = {
  // Rapid branch
  Spammer: { cost: 60, dmg: 5, rate: 0.25, range: 105, color: '#57d6ff', next: ['Blaster', 'Harpy'] },
  Blaster: { cost: 100, dmg: 10, rate: 0.25, range: 115, color: '#52e5ff', next: ['Rotary'] },
  Rotary: { cost: 180, dmg: 7, rate: 0.2, range: 235, color: '#35b9e9', next: ['Atomic'] },
  Atomic: { cost: 300, dmg: 9, rate: 0.2, range: 260, color: '#00f5d4', abbr: 'ATOM', isAtomic: true },
  Harpy: { cost: 100, dmg: 5, rate: 0.12, range: 110, color: '#e9b7ff', next: ['Thunder'] },
  Thunder: { cost: 180, dmg: 4, rate: 0.05, range: 120, color: '#fff18a', next: ['Dual Thunder'] },
  'Dual Thunder': {
    cost: 290,
    dmg: 5,
    rate: 0.05,
    range: 130,
    color: '#facc15',
    parallelShots: [-6.5, 6.5],
    bulletR: 3.2,
    bulletSpeed: 380,
    isDualThunder: true,
    abbr: 'DUAL'
  },

  // Precision / sniper / shotgun / scatter branch
  Scout: { cost: 100, dmg: 12, rate: 0.56, range: 155, color: '#c4ff6a', next: ['Ace', 'Shotgun', 'Scatter'] },
  Ace: { cost: 150, dmg: 19, rate: 0.46, range: 190, color: '#faff7c', next: ['Gamma'] },
  Gamma: { cost: 260, dmg: 7, rate: 0.12, range: 240, color: '#84cc16', abbr: 'GAM', isGamma: true },
  Shotgun: { cost: 180, dmg: 85, rate: 1.03, range: 175, color: '#ffb65b' },
  Scatter: { cost: 220, dmg: 65, rate: 0.92, range: 190, color: '#ff6eae', burstShards: 5, shardDmg: 16, next: ['Cluster'] },
  Cluster: { cost: 320, dmg: 80, rate: 0.88, range: 210, color: '#f43f5e', burstShards: 10, shardDmg: 20, abbr: 'CLUS' },

  // Spike area branch (Shoots slow piercing triangle spikes)
  Spiker: {
    cost: 80,
    dmg: 11,
    rate: 0.42,
    range: 125,
    color: '#ffa45c',
    isSpiker: true,
    bulletSpeed: 175,
    next: ['Double Spiker']
  },
  'Double Spiker': {
    cost: 130,
    dmg: 12,
    rate: 0.38,
    range: 135,
    color: '#ff9c53',
    parallelShots: [-5, 5],
    isSpiker: true,
    bulletSpeed: 175,
    next: ['ALLSPIKER']
  },
  ALLSPIKER: {
    cost: 200,
    dmg: 13,
    rate: 0.36,
    range: 145,
    color: '#ff674d',
    multiDir: [
      0,
      Math.PI / 3,
      (2 * Math.PI) / 3,
      Math.PI,
      (4 * Math.PI) / 3,
      (5 * Math.PI) / 3
    ], // Shoots in 6 hexagonal directions
    barrels: 6,
    isSpiker: true,
    bulletSpeed: 175,
    abbr: 'ALL',
    next: ['Bastion']
  },
  Bastion: {
    cost: 320,
    dmg: 16,
    rate: 0.35,
    range: 155,
    color: '#ea580c',
    isBastion: true,
    bulletSpeed: 175,
    abbr: 'BAST'
  },

  // Multi-shot branch (Parallel multi-barrel volleys)
  Double: {
    cost: 120,
    dmg: 12,
    rate: 0.46,
    range: 135,
    color: '#e7a1ff',
    parallelShots: [-7, 7],
    bulletR: 3.2,
    next: ['Triple']
  },
  Triple: {
    cost: 170,
    dmg: 13,
    rate: 0.45,
    range: 145,
    color: '#d6a6ff',
    parallelShots: [-9.5, 0, 9.5],
    bulletR: 3.0,
    next: ['Quadruple']
  },
  Quadruple: {
    cost: 240,
    dmg: 14,
    rate: 0.43,
    range: 155,
    color: '#b28aff',
    parallelShots: [-11.5, -3.8, 3.8, 11.5],
    bulletR: 2.6
  },

  // Directional Multi-barrel Turret Branch: Side Turret -> Fourway -> Eightway
  'Side Turret': {
    cost: 110,
    dmg: 9,
    rate: 0.38,
    range: 135,
    color: '#38bdf8',
    multiDir: [0, Math.PI], // Shoots front and back (opposite directions)
    barrels: 2,
    abbr: 'SIDE',
    next: ['Fourway']
  },
  Fourway: {
    cost: 160,
    dmg: 11,
    rate: 0.35,
    range: 150,
    color: '#0284c7',
    multiDir: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2], // Shoots in 4 perpendicular directions
    barrels: 4,
    abbr: 'FOUR',
    next: ['Eightway']
  },
  Eightway: {
    cost: 230,
    dmg: 13,
    rate: 0.32,
    range: 165,
    color: '#0369a1',
    multiDir: [
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (5 * Math.PI) / 4,
      (3 * Math.PI) / 2,
      (7 * Math.PI) / 4
    ], // Shoots in 8 compass directions
    barrels: 8,
    abbr: 'EIGHT'
  }
};

export const BASE_TOWERS = ['Spammer', 'Scout', 'Spiker', 'Double', 'Side Turret'];

export const CANVAS_WIDTH = 720;
export const CANVAS_HEIGHT = 470;

export const ENEMY_TYPES = {
  square: {
    type: 'square',
    name: 'Blue Square',
    shape: 'square',
    color: '#318cff',
    borderColor: '#184f94',
    baseHp: 32,
    hpPerWave: 14,
    speed: 36,
    speedPerWave: 1.1,
    r: 9,
    reward: 5,
    minWave: 1
  },
  circle: {
    type: 'circle',
    name: 'Neon Orb (Swarm)',
    shape: 'circle',
    color: '#f43f5e',
    borderColor: '#9f1239',
    baseHp: 18,
    hpPerWave: 8,
    speed: 84,
    speedPerWave: 1.5,
    r: 7.5,
    reward: 4,
    minWave: 2
  },
  triangle: {
    type: 'triangle',
    name: 'Purple Triangle (Speedy)',
    shape: 'triangle',
    color: '#c242fc',
    borderColor: '#6b1991',
    baseHp: 25,
    hpPerWave: 11,
    speed: 68,
    speedPerWave: 1.4,
    r: 9,
    reward: 7,
    minWave: 3
  },
  hexagon: {
    type: 'hexagon',
    name: 'Amber Hexagon (Armored)',
    shape: 'hexagon',
    color: '#f59e0b',
    borderColor: '#92400e',
    baseHp: 85,
    hpPerWave: 28,
    speed: 25,
    speedPerWave: 0.7,
    r: 13,
    reward: 12,
    minWave: 5
  },
  pentagon: {
    type: 'pentagon',
    name: 'Cyan Pentagon (Bruiser)',
    shape: 'pentagon',
    color: '#06b6d4',
    borderColor: '#0e7490',
    baseHp: 110,
    hpPerWave: 26,
    speed: 40,
    speedPerWave: 1.0,
    r: 12,
    reward: 11,
    minWave: 6
  },
  diamond: {
    type: 'diamond',
    name: 'Emerald Diamond (Elite)',
    shape: 'diamond',
    color: '#10b981',
    borderColor: '#065f46',
    baseHp: 150,
    hpPerWave: 34,
    speed: 52,
    speedPerWave: 1.2,
    r: 11,
    reward: 15,
    minWave: 7
  },
  star: {
    type: 'star',
    name: 'Golden Star (Vanguard)',
    shape: 'star',
    color: '#eab308',
    borderColor: '#854d0e',
    baseHp: 75,
    hpPerWave: 20,
    speed: 62,
    speedPerWave: 1.3,
    r: 11,
    reward: 13,
    minWave: 8
  },
  octagon: {
    type: 'octagon',
    name: 'Obsidian Octagon (Juggernaut)',
    shape: 'octagon',
    color: '#475569',
    borderColor: '#0f172a',
    baseHp: 260,
    hpPerWave: 50,
    speed: 18,
    speedPerWave: 0.5,
    r: 15,
    reward: 22,
    minWave: 11
  },
  cross: {
    type: 'cross',
    name: 'Ruby Cross (Raider)',
    shape: 'cross',
    color: '#ef4444',
    borderColor: '#7f1d1d',
    baseHp: 175,
    hpPerWave: 36,
    speed: 48,
    speedPerWave: 1.1,
    r: 11,
    reward: 18,
    minWave: 13
  },
  decagon: {
    type: 'decagon',
    name: 'Amethyst Decagon (Colossus)',
    shape: 'decagon',
    color: '#a855f7',
    borderColor: '#581c87',
    baseHp: 360,
    hpPerWave: 65,
    speed: 30,
    speedPerWave: 0.7,
    r: 14,
    reward: 28,
    minWave: 16
  }
};

export function getBossConfigForWave(wave) {
  const tier = Math.max(1, Math.floor(wave / 10));

  const templates = [
    {
      name: 'Red Pentagon Colossus',
      shape: 'pentagon',
      color: '#ed202d',
      borderColor: '#790b17',
      r: 30
    },
    {
      name: 'Crimson Octagon Dreadnought',
      shape: 'octagon',
      color: '#dc2626',
      borderColor: '#7f1d1d',
      r: 32
    },
    {
      name: 'Solar Star Titan',
      shape: 'star',
      color: '#f59e0b',
      borderColor: '#78350f',
      r: 34
    },
    {
      name: 'Void Decagon Leviathan',
      shape: 'decagon',
      color: '#8b5cf6',
      borderColor: '#4c1d95',
      r: 35
    }
  ];

  const templateIndex = (tier - 1) % templates.length;
  const cycle = Math.floor((tier - 1) / templates.length);
  const template = templates[templateIndex];

  const baseHps = [2400, 6000, 14000, 30000];
  const hp = tier <= 4 ? baseHps[tier - 1] : Math.round(30000 * Math.pow(2.1, tier - 4));
  const speed = Math.min(27, 13 + (tier - 1) * 2.5);
  const rewardCoins = 100 * tier;
  const rewardGems = 10 * tier;

  const displayName = cycle > 0 ? `Omega ${template.name} Mk.${cycle + 1}` : template.name;

  return {
    tier,
    name: displayName,
    shape: template.shape,
    color: template.color,
    borderColor: template.borderColor,
    hp,
    max: hp,
    speed,
    r: template.r,
    rewardCoins,
    rewardGems
  };
}

export const MAP_CONFIGS = {
  grassland: {
    id: 'grassland',
    name: 'Grassland Plains',
    icon: '🌱',
    description: 'Classic lush green fields with a winding stone path.',
    bgColor: '#83b65d',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    pathOuter: '#59626a',
    pathInner: '#c5c6ba',
    pathDash: '#f2e5a4',
    waterFeatures: false,
    path: [
      [-20, 95],
      [145, 95],
      [145, 205],
      [310, 205],
      [310, 105],
      [490, 105],
      [490, 320],
      [630, 320],
      [630, 405],
      [740, 405]
    ]
  },
  desert: {
    id: 'desert',
    name: 'Desert Dunes',
    icon: '🏜️',
    description: 'Golden sands with a sandstone canyon path.',
    bgColor: '#d4a359',
    gridColor: 'rgba(180, 110, 30, 0.08)',
    pathOuter: '#805934',
    pathInner: '#e8ca92',
    pathDash: '#b58348',
    waterFeatures: false,
    path: [
      [-20, 350],
      [180, 350],
      [180, 150],
      [360, 150],
      [360, 370],
      [550, 370],
      [550, 120],
      [740, 120]
    ]
  },
  crossroads: {
    id: 'crossroads',
    name: 'Crossroads Plaza',
    icon: '⚔️',
    description: 'Ancient cobblestone highways intersecting at a grand tactical plaza.',
    bgColor: '#1e2430',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    pathOuter: '#334155',
    pathInner: '#64748b',
    pathDash: '#fbbf24',
    waterFeatures: false,
    path: [
      [360, 490], // Enter from South road
      [360, 80],  // March North straight through the Crossroads intersection (360, 235)
      [120, 80],  // Turn West along North plaza
      [120, 390], // Turn South along West boulevard
      [240, 390], // Turn East along South avenue
      [240, 235], // Turn North to align with East-West highway
      [740, 235]  // Cross straight through Crossroads intersection (360, 235) again and exit East
    ]
  }
};

// Backward-compatibility alias for older saves
MAP_CONFIGS.island = MAP_CONFIGS.crossroads;
