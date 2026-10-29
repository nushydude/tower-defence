export const TOWER_DEFINITIONS = {
  // Rapid branch
  Spammer: { cost: 60, dmg: 5, rate: 0.25, range: 105, color: '#57d6ff', next: ['Blaster', 'Harpy'] },
  Blaster: { cost: 100, dmg: 10, rate: 0.25, range: 115, color: '#52e5ff', next: ['Rotary'] },
  Rotary: { cost: 180, dmg: 7, rate: 0.2, range: 235, color: '#35b9e9' },
  Harpy: { cost: 100, dmg: 5, rate: 0.12, range: 110, color: '#e9b7ff', next: ['Thunder'] },
  Thunder: { cost: 180, dmg: 4, rate: 0.05, range: 120, color: '#fff18a' },

  // Precision / sniper / shotgun / scatter branch
  Scout: { cost: 100, dmg: 12, rate: 0.56, range: 155, color: '#c4ff6a', next: ['Ace', 'Shotgun', 'Scatter'] },
  Ace: { cost: 150, dmg: 19, rate: 0.46, range: 190, color: '#faff7c' },
  Shotgun: { cost: 180, dmg: 85, rate: 1.03, range: 175, color: '#ffb65b' },
  Scatter: { cost: 220, dmg: 65, rate: 0.92, range: 190, color: '#ff6eae', burstShards: 5, shardDmg: 16, next: ['Cluster'] },
  Cluster: { cost: 320, dmg: 80, rate: 0.88, range: 210, color: '#f43f5e', burstShards: 10, shardDmg: 20, abbr: 'CLUS' },

  // Spike area branch
  Spiker: { cost: 80, dmg: 9, rate: 0.38, range: 120, color: '#ffa45c', next: ['Double Spiker'] },
  'Double Spiker': { cost: 130, dmg: 10, rate: 0.36, range: 130, color: '#ff9c53', next: ['ALLSPIKER'] },
  ALLSPIKER: { cost: 200, dmg: 12, rate: 0.33, range: 140, color: '#ff674d' },

  // Multi-shot branch
  Double: { cost: 120, dmg: 12, rate: 0.46, range: 135, color: '#e7a1ff', next: ['Triple'] },
  Triple: { cost: 170, dmg: 13, rate: 0.45, range: 145, color: '#d6a6ff', next: ['Quadruple'] },
  Quadruple: { cost: 240, dmg: 14, rate: 0.43, range: 155, color: '#b28aff' },

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
    speedPerWave: 1.2,
    r: 9,
    reward: 5,
    minWave: 1
  },
  triangle: {
    type: 'triangle',
    name: 'Purple Triangle (Speedy)',
    shape: 'triangle',
    color: '#c242fc',
    borderColor: '#6b1991',
    baseHp: 24,
    hpPerWave: 11,
    speed: 68,
    speedPerWave: 1.6,
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
    speedPerWave: 0.8,
    r: 13,
    reward: 12,
    minWave: 5
  },
  diamond: {
    type: 'diamond',
    name: 'Emerald Diamond (Elite)',
    shape: 'diamond',
    color: '#10b981',
    borderColor: '#065f46',
    baseHp: 150,
    hpPerWave: 36,
    speed: 52,
    speedPerWave: 1.4,
    r: 11,
    reward: 16,
    minWave: 7
  },
  boss: {
    type: 'boss',
    name: 'Red Pentagon Boss',
    shape: 'pentagon',
    color: '#ed202d',
    borderColor: '#790b17',
    baseHp: 2200,
    hpPerWave: 0,
    speed: 13,
    speedPerWave: 0,
    r: 29,
    reward: 100,
    minWave: 10
  }
};

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
  island: {
    id: 'island',
    name: 'Tropical Atoll',
    icon: '🏝️',
    description: 'Deep ocean surrounding sandy shores and wooden boardwalks.',
    bgColor: '#3490cf',
    gridColor: 'rgba(255, 255, 255, 0.09)',
    pathOuter: '#4a301d',
    pathInner: '#dfb77d',
    pathDash: '#fff6d6',
    waterFeatures: true,
    path: [
      [360, -20],
      [360, 120],
      [140, 120],
      [140, 310],
      [450, 310],
      [450, 210],
      [580, 210],
      [580, 400],
      [740, 400]
    ]
  }
};
