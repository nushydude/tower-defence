export const TOWER_DEFINITIONS = {
  Spammer: { cost: 60, dmg: 5, rate: 0.25, range: 105, color: '#57d6ff', next: ['Blaster', 'Harpy'] },
  Blaster: { cost: 100, dmg: 10, rate: 0.25, range: 115, color: '#52e5ff', next: ['Rotary'] },
  Rotary: { cost: 180, dmg: 7, rate: 0.2, range: 235, color: '#35b9e9' },
  Harpy: { cost: 100, dmg: 5, rate: 0.12, range: 110, color: '#e9b7ff', next: ['Thunder'] },
  Thunder: { cost: 180, dmg: 4, rate: 0.05, range: 120, color: '#fff18a' },
  Scout: { cost: 100, dmg: 12, rate: 0.56, range: 155, color: '#c4ff6a', next: ['Ace', 'Shotgun', 'Scatter'] },
  Ace: { cost: 150, dmg: 19, rate: 0.46, range: 190, color: '#faff7c' },
  Shotgun: { cost: 180, dmg: 85, rate: 1.03, range: 175, color: '#ffb65b' },
  Scatter: { cost: 220, dmg: 65, rate: 0.92, range: 190, color: '#ff6eae' },
  Spiker: { cost: 80, dmg: 9, rate: 0.38, range: 120, color: '#ffa45c', next: ['Double Spiker'] },
  'Double Spiker': { cost: 130, dmg: 10, rate: 0.36, range: 130, color: '#ff9c53', next: ['ALLSPIKER'] },
  ALLSPIKER: { cost: 200, dmg: 12, rate: 0.33, range: 140, color: '#ff674d' },
  Double: { cost: 120, dmg: 12, rate: 0.46, range: 135, color: '#e7a1ff', next: ['Triple'] },
  Triple: { cost: 170, dmg: 13, rate: 0.45, range: 145, color: '#d6a6ff', next: ['Quadruple'] },
  Quadruple: { cost: 240, dmg: 14, rate: 0.43, range: 155, color: '#b28aff' }
};

export const BASE_TOWERS = ['Spammer', 'Scout', 'Spiker', 'Double'];

export const PATH = [
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
];

export const CANVAS_WIDTH = 720;
export const CANVAS_HEIGHT = 470;
