import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_CONFIGS } from './config.js';

export function drawPolygon(ctx, x, y, r, n, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + rotation;
    const xx = x + Math.cos(a) * r;
    const yy = y + Math.sin(a) * r;
    if (i === 0) {
      ctx.moveTo(xx, yy);
    } else {
      ctx.lineTo(xx, yy);
    }
  }
  ctx.closePath();
}

export function drawStar(ctx, x, y, r, innerR, points = 5, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / points + rotation;
    const xx = x + Math.cos(angle) * radius;
    const yy = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  }
  ctx.closePath();
}

export function drawCross(ctx, x, y, r, rotation = 0) {
  const w = r * 0.42;
  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-w, -r);
  ctx.lineTo(w, -r);
  ctx.lineTo(w, -w);
  ctx.lineTo(r, -w);
  ctx.lineTo(r, w);
  ctx.lineTo(w, w);
  ctx.lineTo(w, r);
  ctx.lineTo(-w, r);
  ctx.lineTo(-w, w);
  ctx.lineTo(-r, w);
  ctx.lineTo(-r, -w);
  ctx.lineTo(-w, -w);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function renderEnvironment(ctx, map) {
  // Base background
  ctx.fillStyle = map.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Special Crossroads Plaza: flagstone foundation, central crossing seal & warm corner lanterns
  if (map.id === 'crossroads') {
    // Subtle connecting secondary avenue (West approach) to complete the visual 4-way crossroads
    ctx.strokeStyle = map.pathOuter;
    ctx.lineWidth = 48;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(-20, 235);
    ctx.lineTo(240, 235);
    ctx.stroke();

    ctx.strokeStyle = map.pathInner;
    ctx.lineWidth = 39;
    ctx.beginPath();
    ctx.moveTo(-20, 235);
    ctx.lineTo(240, 235);
    ctx.stroke();

    // Central circular stone plaza at the crossroads intersection (360, 235)
    ctx.fillStyle = '#263042';
    ctx.beginPath();
    ctx.arc(360, 235, 68, 0, Math.PI * 2);
    ctx.fill();

    // Outer decorative stone ring
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(360, 235, 68, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bronze compass medallion ring
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(360, 235, 46, 0, Math.PI * 2);
    ctx.stroke();

    // 4-point golden star inlay at crossroads center
    drawStar(ctx, 360, 235, 26, 10, 4, 0);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 4 Corner guardpost braziers with glowing warm lantern halos
    const corners = [
      [305, 180],
      [415, 180],
      [305, 290],
      [415, 290]
    ];
    corners.forEach(([cx, cy]) => {
      // Warm lantern glow halo
      const glow = ctx.createRadialGradient(cx, cy, 3, cx, cy, 34);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();

      // Stone post
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 5.5, cy - 5.5, 11, 11);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 5.5, cy - 5.5, 11, 11);

      // Golden brazier flame
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (map.id === 'desert') {
    // Subtle desert dunes / rocks
    ctx.fillStyle = 'rgba(168, 107, 43, 0.18)';
    ctx.beginPath();
    ctx.arc(100, 80, 50, 0, Math.PI * 2);
    ctx.arc(620, 260, 70, 0, Math.PI * 2);
    ctx.arc(280, 420, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  // Terrain grid texture
  for (let x = 10; x < CANVAS_WIDTH; x += 32) {
    for (let y = 10; y < CANVAS_HEIGHT; y += 32) {
      ctx.fillStyle = map.gridColor;
      ctx.fillRect(x, y, 15, 15);
    }
  }
}

function drawEnemyShape(ctx, enemy) {
  ctx.fillStyle = enemy.color;
  ctx.strokeStyle = enemy.borderColor || '#184f94';
  ctx.lineWidth = enemy.boss ? 3.5 : 2;

  switch (enemy.shape) {
    case 'circle': {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gleam / specular shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(enemy.x - enemy.r * 0.3, enemy.y - enemy.r * 0.3, enemy.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'square': {
      ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r, enemy.r * 2, enemy.r * 2);
      ctx.strokeRect(enemy.x - enemy.r, enemy.y - enemy.r, enemy.r * 2, enemy.r * 2);
      break;
    }
    case 'triangle': {
      // Rotate triangle towards direction of motion
      const rot = (enemy.angle !== undefined ? enemy.angle : 0) + Math.PI / 2;
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r + 2, 3, rot);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'diamond': {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r * 1.15, 4);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'pentagon': {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r, 5);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'hexagon': {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r, 6);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'octagon': {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r, 8);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'decagon': {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r, 10);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'star': {
      const rot = enemy.boss ? 0 : (enemy.angle !== undefined ? enemy.angle : 0);
      drawStar(ctx, enemy.x, enemy.y, enemy.r * 1.25, enemy.r * 0.6, 5, rot);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'cross': {
      const rot = enemy.angle !== undefined ? enemy.angle : 0;
      drawCross(ctx, enemy.x, enemy.y, enemy.r * 1.15, rot);
      break;
    }
    default: {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r, 5);
      ctx.fill();
      ctx.stroke();
      break;
    }
  }
}

function drawTowerBarrels(ctx, tower, def) {
  if (!def) return;
  const angle = tower.angle || 0;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const fx = cosA;
  const fy = sinA;
  const px = -sinA;
  const py = cosA;

  ctx.save();

  if (def.isGamma) {
    // Focusing coil emitter barrel
    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.lineTo(tower.x + fx * 19, tower.y + fy * 19);
    ctx.stroke();

    // Inner radiation core
    ctx.strokeStyle = '#bef264';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
    ctx.lineTo(tower.x + fx * 18, tower.y + fy * 18);
    ctx.stroke();

    // Gamma emitter ring
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tower.x + fx * 16, tower.y + fy * 16, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (def.isAtomic) {
    // Heavy accelerator barrel
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.lineTo(tower.x + fx * 19, tower.y + fy * 19);
    ctx.stroke();

    // Inner power rail
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
    ctx.lineTo(tower.x + fx * 18, tower.y + fy * 18);
    ctx.stroke();

    // Glowing emitter muzzle
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tower.x + fx * 16, tower.y + fy * 16, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (def.isDualThunder) {
    // Dual Thunder: basically double, but with the twin tesla cannons of storm/thunder
    ctx.lineCap = 'butt';
    [-6.5, 6.5].forEach((offset) => {
      const cx = tower.x + px * offset;
      const cy = tower.y + py * offset;

      // Base coil mount
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + fx * 4, cy + fy * 4);
      ctx.lineTo(cx + fx * 9, cy + fy * 9);
      ctx.stroke();

      // Pair of conductive tesla prongs
      [-2.2, 2.2].forEach((subOffset) => {
        const pxSub = -fy;
        const pySub = fx;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(cx + pxSub * subOffset + fx * 7, cy + pySub * subOffset + fy * 7);
        ctx.lineTo(cx + pxSub * subOffset + fx * 18, cy + pySub * subOffset + fy * 18);
        ctx.stroke();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx + pxSub * subOffset + fx * 15, cy + pySub * subOffset + fy * 15);
        ctx.lineTo(cx + pxSub * subOffset + fx * 18, cy + pySub * subOffset + fy * 18);
        ctx.stroke();
      });

      // Crackling tesla spark between this pair of prongs
      const pxSub = -fy;
      const pySub = fx;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - pxSub * 2.2 + fx * 17, cy - pySub * 2.2 + fy * 17);
      ctx.lineTo(cx + pxSub * 2.2 + fx * 17, cy + pySub * 2.2 + fy * 17);
      ctx.stroke();
    });

    ctx.restore();
    return;
  }

  if (def.isBastion) {
    // Bastion: 3 spike shooters in 3 directions, with a cannon barrel in between each
    ctx.lineCap = 'butt';
    const spikeAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
    const bulletAngles = [Math.PI / 3, Math.PI, (5 * Math.PI) / 3];

    // 1. Draw 3 in-between cannon barrels first
    bulletAngles.forEach((offset) => {
      const bAngle = angle + offset;
      const bCos = Math.cos(bAngle);
      const bSin = Math.sin(bAngle);

      // Heavy cannon tube
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.8;
      ctx.beginPath();
      ctx.moveTo(tower.x + bCos * 6, tower.y + bSin * 6);
      ctx.lineTo(tower.x + bCos * 17.5, tower.y + bSin * 17.5);
      ctx.stroke();

      // Reinforced orange muzzle collar
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(tower.x + bCos * 14.5, tower.y + bSin * 14.5);
      ctx.lineTo(tower.x + bCos * 17.5, tower.y + bSin * 17.5);
      ctx.stroke();
    });

    // 2. Draw 3 armored lance spikes
    spikeAngles.forEach((offset) => {
      const sAngle = angle + offset;
      const sCos = Math.cos(sAngle);
      const sSin = Math.sin(sAngle);
      const sPx = -sSin;
      const sPy = sCos;

      ctx.beginPath();
      ctx.moveTo(tower.x - sPx * 3.2 + sCos * 6, tower.y - sPy * 3.2 + sSin * 6);
      ctx.lineTo(tower.x + sCos * 19, tower.y + sSin * 19);
      ctx.lineTo(tower.x + sPx * 3.2 + sCos * 6, tower.y + sPy * 3.2 + sSin * 6);
      ctx.closePath();
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    });

    ctx.restore();
    return;
  }

  if (def.isSpiker) {
    if (tower.type === 'ALLSPIKER') {
      // 6 radiating lance spikes in regular hexagonal formation (60 degrees apart)
      for (let i = 0; i < 6; i++) {
        const spikeAngle = angle + (i * Math.PI) / 3;
        const sCos = Math.cos(spikeAngle);
        const sSin = Math.sin(spikeAngle);
        const sPx = -sSin;
        const sPy = sCos;

        ctx.beginPath();
        ctx.moveTo(tower.x - sPx * 2.5 + sCos * 6, tower.y - sPy * 2.5 + sSin * 6);
        ctx.lineTo(tower.x + sCos * 18, tower.y + sSin * 18);
        ctx.lineTo(tower.x + sPx * 2.5 + sCos * 6, tower.y + sPy * 2.5 + sSin * 6);
        ctx.closePath();
        ctx.fillStyle = '#ff674d';
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (tower.type === 'Double Spiker') {
      // Twin forward lance spears at [-5, 5]
      [-5, 5].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(tower.x + px * (offset - 2.2) + fx * 6, tower.y + py * (offset - 2.2) + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 18, tower.y + py * offset + fy * 18);
        ctx.lineTo(tower.x + px * (offset + 2.2) + fx * 6, tower.y + py * (offset + 2.2) + fy * 6);
        ctx.closePath();
        ctx.fillStyle = '#ff9c53';
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      ctx.restore();
      return;
    }

    // Single Spiker forward lance spear
    ctx.beginPath();
    ctx.moveTo(tower.x - px * 3 + fx * 6, tower.y - py * 3 + fy * 6);
    ctx.lineTo(tower.x + fx * 18, tower.y + fy * 18);
    ctx.lineTo(tower.x + px * 3 + fx * 6, tower.y + py * 3 + fy * 6);
    ctx.closePath();
    ctx.fillStyle = '#ffa45c';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (def.multiDir) {
    ctx.lineCap = 'butt';
    def.multiDir.forEach((offset) => {
      const dirAngle = angle + offset;
      const dCos = Math.cos(dirAngle);
      const dSin = Math.sin(dirAngle);

      // Dark steel barrel
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(tower.x + dCos * 6, tower.y + dSin * 6);
      ctx.lineTo(tower.x + dCos * 17.5, tower.y + dSin * 17.5);
      ctx.stroke();

      // Cyan muzzle collar
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(tower.x + dCos * 14.5, tower.y + dSin * 14.5);
      ctx.lineTo(tower.x + dCos * 17.5, tower.y + dSin * 17.5);
      ctx.stroke();
    });
    ctx.restore();
    return;
  }

  if (def.parallelShots) {
    // Multi-barrel parallel cannons (Double: 2, Triple: 3, Quadruple: 4)
    ctx.lineCap = 'square';
    const count = def.parallelShots.length;
    const barrelWidth = count === 2 ? 3.8 : count === 3 ? 3.2 : 2.7;

    def.parallelShots.forEach((offset, idx) => {
      let bLen = 17;
      if (count === 3 && idx === 1) bLen = 18.5;
      if (count === 4 && (idx === 1 || idx === 2)) bLen = 18;

      const rootX = tower.x + px * offset + fx * 5;
      const rootY = tower.y + py * offset + fy * 5;
      const tipX = tower.x + px * offset + fx * bLen;
      const tipY = tower.y + py * offset + fy * bLen;

      // Dark gunmetal barrel
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = barrelWidth;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Glowing muzzle cap matching turret theme
      ctx.strokeStyle = def.color || '#e879f9';
      ctx.lineWidth = Math.max(1.8, barrelWidth - 0.6);
      ctx.beginPath();
      ctx.moveTo(tipX - fx * 2.5, tipY - fy * 2.5);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    });
    ctx.restore();
    return;
  }

  // Branch-specific unique cannon designs
  switch (tower.type) {
    case 'Rotary': {
      // 3 bundled Gatling minigun barrels with stabilizing rotor ring
      ctx.lineCap = 'butt';
      [-3.2, 0, 3.2].forEach((offset) => {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 6, tower.y + py * offset + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 19, tower.y + py * offset + fy * 19);
        ctx.stroke();
      });
      // Rotor bracket band
      ctx.strokeStyle = '#35b9e9';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tower.x - px * 4.5 + fx * 14, tower.y - py * 4.5 + fy * 14);
      ctx.lineTo(tower.x + px * 4.5 + fx * 14, tower.y + py * 4.5 + fy * 14);
      ctx.stroke();
      break;
    }
    case 'Blaster': {
      // Heavy twin blaster barrels
      ctx.lineCap = 'square';
      [-4, 4].forEach((offset) => {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 6, tower.y + py * offset + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 17.5, tower.y + py * offset + fy * 17.5);
        ctx.stroke();

        ctx.strokeStyle = '#52e5ff';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 14.5, tower.y + py * offset + fy * 14.5);
        ctx.lineTo(tower.x + px * offset + fx * 17.5, tower.y + py * offset + fy * 17.5);
        ctx.stroke();
      });
      break;
    }
    case 'Harpy': {
      // High-velocity needle accelerator
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 22, tower.y + fy * 22);
      ctx.stroke();

      ctx.strokeStyle = '#e9b7ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 13, tower.y + fy * 13);
      ctx.lineTo(tower.x + fx * 22, tower.y + fy * 22);
      ctx.stroke();
      break;
    }
    case 'Thunder': {
      // Dual high-voltage tesla prongs with electric spark arc
      ctx.lineCap = 'butt';
      [-3.8, 3.8].forEach((offset) => {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 6, tower.y + py * offset + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 18, tower.y + py * offset + fy * 18);
        ctx.stroke();

        ctx.strokeStyle = '#fff18a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 15, tower.y + py * offset + fy * 15);
        ctx.lineTo(tower.x + px * offset + fx * 18, tower.y + py * offset + fy * 18);
        ctx.stroke();
      });
      // Crackling tesla spark between prongs
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tower.x - px * 3.8 + fx * 17, tower.y - py * 3.8 + fy * 17);
      ctx.lineTo(tower.x + px * 3.8 + fx * 17, tower.y + py * 3.8 + fy * 17);
      ctx.stroke();
      break;
    }
    case 'Ace': {
      // Heavy anti-materiel sniper cannon with baffled muzzle brake
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5.2;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 25, tower.y + fy * 25);
      ctx.stroke();

      // Muzzle brake baffles
      ctx.strokeStyle = '#faff7c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tower.x - px * 3.8 + fx * 23, tower.y - py * 3.8 + fy * 23);
      ctx.lineTo(tower.x + px * 3.8 + fx * 23, tower.y + py * 3.8 + fy * 23);
      ctx.stroke();
      break;
    }
    case 'Scout': {
      // Tactical precision sniper barrel with compensator
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 21, tower.y + fy * 21);
      ctx.stroke();

      ctx.strokeStyle = '#c4ff6a';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 18, tower.y + fy * 18);
      ctx.lineTo(tower.x + fx * 21, tower.y + fy * 21);
      ctx.stroke();
      break;
    }
    case 'Shotgun': {
      // Wide sawed-off twin barrel shotgun
      ctx.lineCap = 'square';
      [-3.6, 3.6].forEach((offset) => {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4.8;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 6, tower.y + py * offset + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 15, tower.y + py * offset + fy * 15);
        ctx.stroke();

        ctx.strokeStyle = '#ffb65b';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 13, tower.y + py * offset + fy * 13);
        ctx.lineTo(tower.x + px * offset + fx * 15, tower.y + py * offset + fy * 15);
        ctx.stroke();
      });
      break;
    }
    case 'Scatter': {
      // Flared blunderbuss dispersion cannon
      ctx.beginPath();
      ctx.moveTo(tower.x - px * 2.2 + fx * 6, tower.y - py * 2.2 + fy * 6);
      ctx.lineTo(tower.x - px * 4.6 + fx * 16.5, tower.y - py * 4.6 + fy * 16.5);
      ctx.lineTo(tower.x + px * 4.6 + fx * 16.5, tower.y + py * 4.6 + fy * 16.5);
      ctx.lineTo(tower.x + px * 2.2 + fx * 6, tower.y + py * 2.2 + fy * 6);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#ff6eae';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'Cluster': {
      // Heavy siege mortar launcher
      ctx.lineCap = 'square';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 8.2;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 17, tower.y + fy * 17);
      ctx.stroke();

      // Reinforced crimson collar
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 14.5, tower.y + fy * 14.5);
      ctx.lineTo(tower.x + fx * 17, tower.y + fy * 17);
      ctx.stroke();
      break;
    }
    case 'Spiker': {
      // Forward lance spear
      ctx.beginPath();
      ctx.moveTo(tower.x - px * 3 + fx * 6, tower.y - py * 3 + fy * 6);
      ctx.lineTo(tower.x + fx * 18, tower.y + fy * 18);
      ctx.lineTo(tower.x + px * 3 + fx * 6, tower.y + py * 3 + fy * 6);
      ctx.closePath();
      ctx.fillStyle = '#ffa45c';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      break;
    }
    case 'Double Spiker': {
      // Twin lance spears
      [-4.5, 4.5].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(tower.x + px * (offset - 2.2) + fx * 6, tower.y + py * (offset - 2.2) + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 18, tower.y + py * offset + fy * 18);
        ctx.lineTo(tower.x + px * (offset + 2.2) + fx * 6, tower.y + py * (offset + 2.2) + fy * 6);
        ctx.closePath();
        ctx.fillStyle = '#ff9c53';
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      break;
    }
    case 'ALLSPIKER': {
      // 8 radiating lance spikes
      for (let i = 0; i < 8; i++) {
        const spikeAngle = angle + (i * Math.PI) / 4;
        const sCos = Math.cos(spikeAngle);
        const sSin = Math.sin(spikeAngle);
        const sPx = -sSin;
        const sPy = sCos;

        ctx.beginPath();
        ctx.moveTo(tower.x - sPx * 2.5 + sCos * 6, tower.y - sPy * 2.5 + sSin * 6);
        ctx.lineTo(tower.x + sCos * 18, tower.y + sSin * 18);
        ctx.lineTo(tower.x + sPx * 2.5 + sCos * 6, tower.y + sPy * 2.5 + sSin * 6);
        ctx.closePath();
        ctx.fillStyle = '#ff674d';
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;
    }
    case 'Spammer': {
      // Rapid autocannon
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 16.5, tower.y + fy * 16.5);
      ctx.stroke();

      ctx.strokeStyle = '#57d6ff';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 13.5, tower.y + fy * 13.5);
      ctx.lineTo(tower.x + fx * 16.5, tower.y + fy * 16.5);
      ctx.stroke();
      break;
    }
    default: {
      // Fallback clean standard cannon
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 16, tower.y + fy * 16);
      ctx.stroke();

      ctx.strokeStyle = def.color || '#57d6ff';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 13, tower.y + fy * 13);
      ctx.lineTo(tower.x + fx * 16, tower.y + fy * 16);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function renderGame(ctx, state, towerDefs) {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const mapId = state?.mapId || 'grassland';
  const map = MAP_CONFIGS[mapId] || MAP_CONFIGS.grassland;

  // Render themed terrain
  renderEnvironment(ctx, map);

  // Draw themed path
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  map.path.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));

  ctx.strokeStyle = map.pathOuter;
  ctx.lineWidth = 48;
  ctx.stroke();

  ctx.strokeStyle = map.pathInner;
  ctx.lineWidth = 39;
  ctx.stroke();

  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = map.pathDash;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  if (!state) return;

  // Selected tower range indicator
  if (state.sel) {
    const selectedTower = state.towers.find((t) => t.id === state.sel);
    if (selectedTower) {
      const def = towerDefs[selectedTower.type];
      ctx.beginPath();
      ctx.arc(selectedTower.x, selectedTower.y, def.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Draw towers & multi-directional barrels
  state.towers.forEach((tower) => {
    const def = towerDefs[tower.type];

    // Draw visible barrels for multi-directional turrets
    drawTowerBarrels(ctx, tower, def);

    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = def.color;
    ctx.fill();

    const isSelected = state.sel === tower.id;
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.strokeStyle = isSelected ? 'white' : '#263448';
    ctx.stroke();

    ctx.fillStyle = '#142030';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    const label = def.abbr || (tower.type === 'ALLSPIKER' ? 'ALL' : tower.type.slice(0, 3).toUpperCase());
    ctx.fillText(label, tower.x, tower.y + 3);
  });

  // Draw enemies
  state.enemies.forEach((enemy) => {
    drawEnemyShape(ctx, enemy);

    const healthFraction = Math.max(0, enemy.hp / enemy.max);

    if (enemy.boss) {
      // Boss health bar & label
      const barW = Math.max(74, enemy.r * 2.5);
      const barH = 8;
      const barY = enemy.y - enemy.r - 20;

      ctx.fillStyle = '#28070b';
      ctx.fillRect(enemy.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = enemy.color || '#ff4652';
      ctx.fillRect(enemy.x - barW / 2, barY, barW * healthFraction, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(enemy.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      const bossTitle = enemy.name ? `BOSS: ${enemy.name.toUpperCase()}` : 'BOSS';
      ctx.fillText(bossTitle, enemy.x, barY - 5);
    } else {
      // Standard / elite enemy health bar
      const barWidth = Math.max(16, enemy.r * 2);
      const barHeight = 4;
      const barY = enemy.y - enemy.r - 7;

      ctx.fillStyle = '#1d2937';
      ctx.fillRect(enemy.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

      ctx.fillStyle = enemy.color || '#69f29b';
      ctx.fillRect(enemy.x - barWidth / 2, barY, barWidth * healthFraction, barHeight);
    }
  });

  // Draw bullets
  state.bullets.forEach((bullet) => {
    if (bullet.isSpikeTriangle) {
      // Slow spike triangle projectile (radiant fiery aerodynamic spearhead)
      const angle = Math.atan2(bullet.vy, bullet.vx);
      const len = (bullet.r || 5.5) * 2.4;
      const halfW = (bullet.r || 5.5) * 1.35;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const px = -sin;
      const py = cos;

      // Tip (front of arrowhead)
      const tipX = bullet.x + cos * len;
      const tipY = bullet.y + sin * len;

      // Base left & right wings
      const baseBackX = bullet.x - cos * (len * 0.4);
      const baseBackY = bullet.y - sin * (len * 0.4);
      const leftWingX = baseBackX + px * halfW;
      const leftWingY = baseBackY + py * halfW;
      const rightWingX = baseBackX - px * halfW;
      const rightWingY = baseBackY - py * halfW;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftWingX, leftWingY);
      ctx.lineTo(baseBackX - cos * 2, baseBackY - sin * 2);
      ctx.lineTo(rightWingX, rightWingY);
      ctx.closePath();

      // Radiant fiery amber/orange gradient
      const grad = ctx.createLinearGradient(tipX, tipY, baseBackX, baseBackY);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fed7aa');
      grad.addColorStop(0.7, '#f97316');
      grad.addColorStop(1, '#c2410c');

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Sharp central spine
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseBackX, baseBackY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    const r = bullet.r || 4;
    ctx.arc(bullet.x, bullet.y, r, 0, Math.PI * 2);

    if (bullet.isGamma) {
      // Gamma Expanding Ray: grows bigger the further it flies
      const outerGlow = ctx.createRadialGradient(bullet.x, bullet.y, Math.max(1, r * 0.15), bullet.x, bullet.y, r);
      outerGlow.addColorStop(0, '#ffffff');
      outerGlow.addColorStop(0.35, '#bef264');
      outerGlow.addColorStop(0.75, '#84cc16');
      outerGlow.addColorStop(1, 'rgba(132, 204, 22, 0.3)');

      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, r, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner pulsating energy ring on larger spheres
      if (r > 6.5) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, r * 0.52, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    } else if (bullet.isAtomic) {
      // Atomic multiplying fission ball (glowing neon turquoise with bright radioactive nucleus)
      ctx.fillStyle = '#00f5d4';
      ctx.fill();
      ctx.strokeStyle = '#70e000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bright inner nucleus
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, Math.max(1.5, r * 0.42), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (bullet.isShard) {
      // Outward bursting shards (warm fiery spark)
      ctx.fillStyle = '#ff7b72';
      ctx.fill();
      ctx.strokeStyle = '#ffa657';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (bullet.burstShards > 0) {
      // Main Scatter / Cluster shell (larger glowing hot projectile)
      ctx.fillStyle = '#ff3366';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (bullet.isParallel) {
      // Parallel multi-barrel projectile (crisp radiant lilac energy bolt with sharp violet border)
      ctx.fillStyle = '#f5d0fe';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (bullet.isDualThunder) {
      // Dual Thunder electric lightning projectile (intense white-gold nucleus with crackling electric corona)
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Outer electric corona
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, r * 1.45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (bullet.isBastionBullet) {
      // Bastion heavy cannon shell (dense molten core with dark casing)
      ctx.fillStyle = '#fed7aa';
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (bullet.vx !== undefined) {
      // Directional multi-turret shot
      ctx.fillStyle = '#a5f3fc';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Standard bullet
      ctx.fillStyle = '#fff7c2';
      ctx.fill();
    }
  });

  // Game over overlay
  if (state.over) {
    ctx.fillStyle = 'rgba(5, 10, 20, 0.65)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px system-ui';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 220);
    ctx.font = '16px system-ui';
    ctx.fillText('Press Restart Game to try again', CANVAS_WIDTH / 2, 252);
  }

  ctx.textAlign = 'left';
}
