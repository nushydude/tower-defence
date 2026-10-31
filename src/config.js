export const TOWER_DEFINITIONS = {
  // =========================================================
  // 1. RAPID FIRE BRANCH (Root: Spammer)
  // =========================================================
  Spammer: {
    cost: 60,
    dmg: 4,
    rate: 0.28,
    range: 105,
    color: '#57d6ff',
    abbr: 'SPAM',
    next: ['Blaster', 'Harpy']
  },
  Blaster: {
    cost: 100,
    dmg: 8,
    rate: 0.28,
    range: 115,
    color: '#52e5ff',
    abbr: 'BLST',
    next: ['Rotary']
  },
  Rotary: {
    cost: 180,
    dmg: 7,
    rate: 0.18,
    range: 220,
    color: '#35b9e9',
    abbr: 'ROTR',
    next: ['Vulcan'] // Upgrades to the apex Vulcan minigun!
  },
  Vulcan: {
    cost: 320,
    dmg: 8,
    rate: 0.09,
    range: 245,
    color: '#06b6d4',
    abbr: 'VULC',
    isVulcan: true
  },
  Harpy: {
    cost: 100,
    dmg: 4,
    rate: 0.14,
    range: 110,
    color: '#e9b7ff',
    abbr: 'HARP',
    next: ['Thunder']
  },
  Thunder: {
    cost: 180,
    dmg: 3,
    rate: 0.06,
    range: 120,
    color: '#fff18a',
    abbr: 'THND',
    next: ['Dual Thunder']
  },
  'Dual Thunder': {
    cost: 290,
    dmg: 4,
    rate: 0.06,
    range: 130,
    color: '#facc15',
    parallelShots: [-6.5, 6.5],
    bulletR: 3.2,
    bulletSpeed: 380,
    isDualThunder: true,
    abbr: 'DUAL'
  },

  // =========================================================
  // 2. PRECISION & QUANTUM ENERGY BRANCH (Root: Scout)
  // =========================================================
  Scout: {
    cost: 100,
    dmg: 12,
    rate: 0.62,
    range: 160,
    color: '#c4ff6a',
    abbr: 'SCOT',
    next: ['Ace', 'Pulsar'] // Branches into Ballistic Sniper (Ace) or Quantum Energy (Pulsar)!
  },
  Ace: {
    cost: 160,
    dmg: 22,
    rate: 0.52,
    range: 200,
    color: '#faff7c',
    abbr: 'ACE',
    next: ['Ranger']
  },
  Ranger: {
    cost: 250,
    dmg: 52,
    rate: 0.58,
    range: 250,
    color: '#eab308',
    abbr: 'RNGR',
    next: ['Deadeye']
  },
  Deadeye: {
    cost: 390,
    dmg: 155,
    rate: 1.22,
    range: 305,
    color: '#f59e0b',
    abbr: 'DEAD'
  },
  Pulsar: {
    cost: 150,
    dmg: 11,
    rate: 0.32,
    range: 175,
    color: '#4ade80',
    abbr: 'PULS',
    next: ['Gamma', 'Atomic'] // Sister apex energy evolutions!
  },
  Gamma: {
    cost: 270,
    dmg: 7,
    rate: 0.14,
    range: 240,
    color: '#84cc16',
    abbr: 'GAM',
    isGamma: true
  },
  Atomic: {
    cost: 330,
    dmg: 9,
    rate: 0.20,
    range: 260,
    color: '#00f5d4',
    abbr: 'ATOM',
    isAtomic: true
  },

  // =========================================================
  // 3. HEAVY BLAST & DEMOLITION BRANCH (Root: Shotgun)
  // =========================================================
  Shotgun: {
    cost: 85,
    dmg: 42,
    rate: 0.95,
    range: 140,
    color: '#ffb65b',
    abbr: 'SHOT',
    next: ['Scatter', 'Flak Cannon']
  },
  Scatter: {
    cost: 170,
    dmg: 55,
    rate: 0.98,
    range: 165,
    color: '#ff6eae',
    abbr: 'SCAT',
    burstShards: 5,
    shardDmg: 13,
    next: ['Cluster']
  },
  Cluster: {
    cost: 280,
    dmg: 68,
    rate: 0.92,
    range: 190,
    color: '#f43f5e',
    abbr: 'CLUS',
    burstShards: 10,
    shardDmg: 17,
    next: ['Supercluster']
  },
  Supercluster: {
    cost: 410,
    dmg: 98,
    rate: 0.85,
    range: 220,
    color: '#e11d48',
    abbr: 'SUPR',
    burstShards: 16,
    shardDmg: 22,
    isSupercluster: true
  },
  'Flak Cannon': {
    cost: 165,
    dmg: 16,
    rate: 0.72,
    range: 155,
    color: '#f97316',
    abbr: 'FLAK',
    fanAngles: [-0.16, -0.08, 0, 0.08, 0.16],
    bulletSpeed: 360,
    bulletR: 3.5,
    next: ['Bombard']
  },
  Bombard: {
    cost: 275,
    dmg: 78,
    rate: 1.05,
    range: 195,
    color: '#ea580c',
    abbr: 'BOMB',
    splashRadius: 46,
    splashDmg: 38,
    bulletSpeed: 290,
    isExplosive: true,
    next: ['Colossus']
  },
  Colossus: {
    cost: 430,
    dmg: 158,
    rate: 1.48,
    range: 240,
    color: '#c2410c',
    abbr: 'COLO',
    splashRadius: 70,
    splashDmg: 80,
    bulletSpeed: 270,
    isExplosive: true
  },

  // =========================================================
  // 4. MULTI-SHOT & BROADSIDE BRANCH (Root: Double)
  // =========================================================
  Double: {
    cost: 110,
    dmg: 10,
    rate: 0.52,
    range: 135,
    color: '#e7a1ff',
    abbr: 'DUBL',
    parallelShots: [-7, 7],
    bulletR: 3.2,
    next: ['Triple', 'Twin Flank'] // Parallel battery vs Broadside flank!
  },
  Triple: {
    cost: 170,
    dmg: 11,
    rate: 0.49,
    range: 145,
    color: '#d6a6ff',
    abbr: 'TRIP',
    parallelShots: [-9.5, 0, 9.5],
    bulletR: 3.0,
    next: ['Quadruple']
  },
  Quadruple: {
    cost: 240,
    dmg: 12,
    rate: 0.47,
    range: 155,
    color: '#b28aff',
    abbr: 'QUAD',
    parallelShots: [-11.5, -3.8, 3.8, 11.5],
    bulletR: 2.6,
    next: ['Penta']
  },
  Penta: {
    cost: 340,
    dmg: 13,
    rate: 0.43,
    range: 170,
    color: '#9333ea',
    abbr: 'PENT',
    parallelShots: [-14, -7, 0, 7, 14],
    bulletR: 2.5
  },
  'Twin Flank': {
    cost: 160,
    dmg: 10,
    rate: 0.47,
    range: 145,
    color: '#c084fc',
    abbr: 'FLNK',
    isTwinFlank: true,
    next: ['Spreadshot']
  },
  Spreadshot: {
    cost: 250,
    dmg: 11,
    rate: 0.43,
    range: 160,
    color: '#a855f7',
    abbr: 'SPRD',
    fanAngles: [-0.42, -0.21, 0, 0.21, 0.42],
    bulletSpeed: 350,
    bulletR: 3.0,
    next: ['Hydra']
  },
  Hydra: {
    cost: 360,
    dmg: 12,
    rate: 0.38,
    range: 175,
    color: '#7e22ce',
    abbr: 'HYDR',
    fanAngles: [-0.56, -0.37, -0.18, 0, 0.18, 0.37, 0.56],
    bulletSpeed: 360,
    bulletR: 2.8
  },

  // =========================================================
  // 5. MULTI-DIRECTIONAL PERIMETER BRANCH (Root: Side Turret)
  // =========================================================
  'Side Turret': {
    cost: 100,
    dmg: 8,
    rate: 0.43,
    range: 135,
    color: '#38bdf8',
    multiDir: [0, Math.PI],
    barrels: 2,
    abbr: 'SIDE',
    next: ['Fourway', 'Cyclone']
  },
  Fourway: {
    cost: 160,
    dmg: 9,
    rate: 0.40,
    range: 150,
    color: '#0284c7',
    multiDir: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
    barrels: 4,
    abbr: 'FOUR',
    next: ['Eightway']
  },
  Eightway: {
    cost: 230,
    dmg: 11,
    rate: 0.36,
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
    ],
    barrels: 8,
    abbr: 'EGTW',
    next: ['Nova']
  },
  Nova: {
    cost: 350,
    dmg: 12,
    rate: 0.32,
    range: 180,
    color: '#075985',
    multiDir: Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6),
    barrels: 12,
    abbr: 'NOVA'
  },
  Cyclone: {
    cost: 155,
    dmg: 8,
    rate: 0.25,
    range: 140,
    color: '#0ea5e9',
    multiDir: [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3],
    barrels: 3,
    abbr: 'CYCL',
    next: ['Vortex']
  },
  Vortex: {
    cost: 250,
    dmg: 10,
    rate: 0.18,
    range: 155,
    color: '#0284c7',
    multiDir: Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3),
    barrels: 6,
    abbr: 'VORT'
  },

  // =========================================================
  // 6. KINETIC SPIKE & LANCE BRANCH (Root: Spiker)
  // =========================================================
  Spiker: {
    cost: 80,
    dmg: 9,
    rate: 0.47,
    range: 125,
    color: '#ffa45c',
    isSpiker: true,
    bulletSpeed: 175,
    abbr: 'SPIK',
    next: ['Double Spiker', 'Ballista']
  },
  'Double Spiker': {
    cost: 130,
    dmg: 10,
    rate: 0.43,
    range: 135,
    color: '#ff9c53',
    parallelShots: [-5, 5],
    isSpiker: true,
    bulletSpeed: 175,
    abbr: 'DSPI',
    next: ['ALLSPIKER']
  },
  ALLSPIKER: {
    cost: 200,
    dmg: 11,
    rate: 0.40,
    range: 145,
    color: '#ff674d',
    multiDir: [
      0,
      Math.PI / 3,
      (2 * Math.PI) / 3,
      Math.PI,
      (4 * Math.PI) / 3,
      (5 * Math.PI) / 3
    ],
    barrels: 6,
    isSpiker: true,
    bulletSpeed: 175,
    abbr: 'ALLS',
    next: ['Bastion']
  },
  Bastion: {
    cost: 320,
    dmg: 14,
    rate: 0.39,
    range: 155,
    color: '#ea580c',
    isBastion: true,
    bulletSpeed: 175,
    abbr: 'BAST',
    next: ['Citadel']
  },
  Citadel: {
    cost: 440,
    dmg: 15,
    rate: 0.34,
    range: 170,
    color: '#c2410c',
    isCitadel: true,
    bulletSpeed: 175,
    abbr: 'CTDL'
  },
  Ballista: {
    cost: 140,
    dmg: 31,
    rate: 0.65,
    range: 165,
    color: '#f97316',
    isPiercingLance: true,
    pierceCount: 2,
    bulletSpeed: 230,
    abbr: 'BALI',
    next: ['Javelin']
  },
  Javelin: {
    cost: 240,
    dmg: 56,
    rate: 0.60,
    range: 195,
    color: '#ea580c',
    isPiercingLance: true,
    pierceCount: 3,
    bulletSpeed: 260,
    abbr: 'JAVL',
    next: ['Trident']
  },
  Trident: {
    cost: 350,
    dmg: 50,
    rate: 0.54,
    range: 215,
    color: '#dc2626',
    isTrident: true,
    pierceCount: 3,
    fanAngles: [-0.14, 0, 0.14],
    bulletSpeed: 270,
    abbr: 'TRID'
  },

  // =========================================================
  // 7. PENETRATING LASER RAILGUN BRANCH (Root: Railgun)
  // =========================================================
  Railgun: {
    cost: 250,
    dmg: 65,
    rate: 0.90,
    range: 220,
    color: '#0284c7',
    abbr: 'RAIL',
    isRailgun: true,
    laserColor: 'blue',
    pierceCount: 4,
    bulletSpeed: 580,
    next: ['Double Railgun']
  },
  'Double Railgun': {
    cost: 500,
    dmg: 95,
    rate: 0.85,
    range: 250,
    color: '#ef4444',
    abbr: 'DRAL',
    isRailgun: true,
    laserColor: 'red',
    parallelShots: [-6, 6],
    pierceCount: 6,
    bulletSpeed: 620,
    next: ['Triple Railgun']
  },
  'Triple Railgun': {
    cost: 1000,
    dmg: 190,
    rate: 0.80,
    range: 290,
    color: '#a855f7',
    abbr: 'TRAL',
    isRailgun: true,
    laserColor: 'purple',
    parallelShots: [-8, 0, 8],
    pierceCount: 10,
    bulletSpeed: 680
  }
};

export const BASE_TOWERS = ['Spammer', 'Scout', 'Railgun', 'Shotgun', 'Double', 'Side Turret', 'Spiker'];

export const TECH_TREE_BRANCHES = [
  {
    name: 'Laser Railgun',
    badge: 'NEW BRANCH',
    icon: '⚡',
    color: '#0284c7',
    root: 'Railgun',
    description: 'High-velocity electromagnetic directed-energy cannons firing penetrating laser beams.',
    chain: [
      { name: 'Railgun', cost: 250, desc: '1 Blue Penetrating Laser' },
      { name: 'Double Railgun', cost: 500, desc: '2 Red Penetrating Lasers' },
      { name: 'Triple Railgun', cost: 1000, desc: '3 Purple Penetrating Lasers (Apex)' }
    ]
  },
  {
    name: 'Rapid Fire',
    icon: '⚡',
    color: '#57d6ff',
    root: 'Spammer',
    description: 'Blistering cadence bullet storms and electric tesla discharges.',
    sublines: [
      { name: 'Minigun Line', towers: ['Spammer (60c)', 'Blaster (100c)', 'Rotary (180c)', 'Vulcan (320c)'] },
      { name: 'Tesla Line', towers: ['Harpy (100c)', 'Thunder (180c)', 'Dual Thunder (290c)'] }
    ]
  },
  {
    name: 'Precision & Quantum',
    icon: '🎯',
    color: '#c4ff6a',
    root: 'Scout',
    description: 'Long-range ballistic anti-materiel rifles and exotic expanding quantum cores.',
    sublines: [
      { name: 'Sniper Line', towers: ['Scout (100c)', 'Ace (160c)', 'Ranger (250c)', 'Deadeye (390c)'] },
      { name: 'Quantum Line', towers: ['Pulsar (150c)', 'Gamma (270c)', 'Atomic (330c)'] }
    ]
  },
  {
    name: 'Demolition & Blast',
    icon: '💥',
    color: '#ffb65b',
    root: 'Shotgun',
    description: 'Area suppression, exploding cluster submunitions, and heavy siege howitzers.',
    sublines: [
      { name: 'Cluster Line', towers: ['Shotgun (85c)', 'Scatter (170c)', 'Cluster (280c)', 'Supercluster (410c)'] },
      { name: 'Artillery Line', towers: ['Flak Cannon (165c)', 'Bombard (275c)', 'Colossus (430c)'] }
    ]
  },
  {
    name: 'Multi-Shot Battery',
    icon: '⚔️',
    color: '#e7a1ff',
    root: 'Double',
    description: 'Parallel heavy volleys and sweeping broadside fan salvos.',
    sublines: [
      { name: 'Parallel Line', towers: ['Double (110c)', 'Triple (170c)', 'Quadruple (240c)', 'Penta (340c)'] },
      { name: 'Fan Battery', towers: ['Twin Flank (160c)', 'Spreadshot (250c)', 'Hydra (360c)'] }
    ]
  },
  {
    name: 'Perimeter Defense',
    icon: '🌐',
    color: '#38bdf8',
    root: 'Side Turret',
    description: 'Omni-directional multi-barrel crossfire and spinning high-frequency turbines.',
    sublines: [
      { name: 'Radial Star', towers: ['Side Turret (100c)', 'Fourway (160c)', 'Eightway (230c)', 'Nova (350c)'] },
      { name: 'Vortex Rotor', towers: ['Cyclone (155c)', 'Vortex (250c)'] }
    ]
  },
  {
    name: 'Kinetic Spike',
    icon: '🔺',
    color: '#ffa45c',
    root: 'Spiker',
    description: 'Aerodynamic glowing piercing lances, heavy ballistas, and star fortresses.',
    sublines: [
      { name: 'Star Fortress', towers: ['Spiker (80c)', 'Double Spiker (130c)', 'ALLSPIKER (200c)', 'Bastion (320c)', 'Citadel (440c)'] },
      { name: 'Heavy Lance', towers: ['Ballista (140c)', 'Javelin (240c)', 'Trident (350c)'] }
    ]
  }
];

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
