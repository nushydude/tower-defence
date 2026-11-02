import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_CONFIGS } from './config.js';
import { tacticalConfig } from './tacticalConfig.js';

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
    // Subtle connecting secondary avenue (East-West approach) intersecting at (240, 360)
    ctx.strokeStyle = map.pathOuter;
    ctx.lineWidth = 48;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(-20, 360);
    ctx.lineTo(500, 360);
    ctx.stroke();

    ctx.strokeStyle = map.pathInner;
    ctx.lineWidth = 39;
    ctx.beginPath();
    ctx.moveTo(-20, 360);
    ctx.lineTo(500, 360);
    ctx.stroke();

    // Central circular stone plaza at the crossroads intersection (240, 360)
    ctx.fillStyle = '#263042';
    ctx.beginPath();
    ctx.arc(240, 360, 68, 0, Math.PI * 2);
    ctx.fill();

    // Outer decorative stone ring
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(240, 360, 68, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bronze compass medallion ring
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(240, 360, 46, 0, Math.PI * 2);
    ctx.stroke();

    // 4-point golden star inlay at crossroads center
    drawStar(ctx, 240, 360, 26, 10, 4, 0);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 4 Corner guardpost braziers with glowing warm lantern halos
    const corners = [
      [185, 305],
      [295, 305],
      [185, 415],
      [295, 415]
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

  // Crisp alternating terrain grid
  ctx.fillStyle = map.gridColor;
  for (let x = 0; x < CANVAS_WIDTH; x += 30) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      if ((Math.floor(x / 30) + Math.floor(y / 30)) % 2 === 0) {
        ctx.fillRect(x, y, 30, 30);
      }
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

  if (def.isCitadel) {
    // Citadel: 12-point star fortress with 6 spikes + 6 machine guns
    ctx.lineCap = 'butt';
    // 6 machine gun barrels
    for (let i = 0; i < 6; i++) {
      const bAngle = angle + Math.PI / 6 + (i * Math.PI) / 3;
      const bCos = Math.cos(bAngle);
      const bSin = Math.sin(bAngle);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(tower.x + bCos * 6, tower.y + bSin * 6);
      ctx.lineTo(tower.x + bCos * 17.5, tower.y + bSin * 17.5);
      ctx.stroke();

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(tower.x + bCos * 14.5, tower.y + bSin * 14.5);
      ctx.lineTo(tower.x + bCos * 17.5, tower.y + bSin * 17.5);
      ctx.stroke();
    }
    // 6 armored lance spikes
    for (let i = 0; i < 6; i++) {
      const sAngle = angle + (i * Math.PI) / 3;
      const sCos = Math.cos(sAngle);
      const sSin = Math.sin(sAngle);
      const sPx = -sSin;
      const sPy = sCos;
      ctx.beginPath();
      ctx.moveTo(tower.x - sPx * 2.8 + sCos * 6, tower.y - sPy * 2.8 + sSin * 6);
      ctx.lineTo(tower.x + sCos * 20, tower.y + sSin * 20);
      ctx.lineTo(tower.x + sPx * 2.8 + sCos * 6, tower.y + sPy * 2.8 + sSin * 6);
      ctx.closePath();
      ctx.fillStyle = '#c2410c';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (def.isTrident) {
    // 3 heavy forward piercing lances
    ctx.lineCap = 'butt';
    [-0.14, 0, 0.14].forEach((offsetA) => {
      const tAngle = angle + offsetA;
      const tCos = Math.cos(tAngle);
      const tSin = Math.sin(tAngle);
      const tPx = -tSin;
      const tPy = tCos;
      ctx.beginPath();
      ctx.moveTo(tower.x - tPx * 2.8 + tCos * 6, tower.y - tPy * 2.8 + tSin * 6);
      ctx.lineTo(tower.x + tCos * 21, tower.y + tSin * 21);
      ctx.lineTo(tower.x + tPx * 2.8 + tCos * 6, tower.y + tPy * 2.8 + tSin * 6);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    });
    ctx.restore();
    return;
  }

  if (def.isPiercingLance) {
    // Ballista / Javelin heavy armor-piercing lance with stabilizer wings
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(tower.x - px * 9 + fx * 10, tower.y - py * 9 + fy * 10);
    ctx.lineTo(tower.x + px * 9 + fx * 10, tower.y + py * 9 + fy * 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tower.x - px * 3.5 + fx * 6, tower.y - py * 3.5 + fy * 6);
    ctx.lineTo(tower.x + fx * 23, tower.y + fy * 23);
    ctx.lineTo(tower.x + px * 3.5 + fx * 6, tower.y + py * 3.5 + fy * 6);
    ctx.closePath();
    ctx.fillStyle = def.color || '#ea580c';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (def.isRailgun) {
    // Electromagnetic laser railgun assembly (Railgun: blue, Double Railgun: red, Triple Railgun: purple)
    ctx.lineCap = 'square';
    const offsets = def.parallelShots || [0];
    const laserColor = def.laserColor || 'blue';
    const glowColor = laserColor === 'red' ? '#ef4444' : laserColor === 'purple' ? '#a855f7' : '#38bdf8';
    const coreColor = laserColor === 'red' ? '#fca5a5' : laserColor === 'purple' ? '#e9d5ff' : '#bae6fd';
    const railWidth = offsets.length === 3 ? 2.8 : offsets.length === 2 ? 3.2 : 3.6;
    const subOffsetDist = offsets.length === 3 ? 2.2 : 2.6;

    offsets.forEach((offset) => {
      const cx = tower.x + px * offset;
      const cy = tower.y + py * offset;

      // Twin electromagnetic rails
      [-subOffsetDist, subOffsetDist].forEach((subOffset) => {
        const pxSub = -fy;
        const pySub = fx;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = railWidth;
        ctx.beginPath();
        ctx.moveTo(cx + pxSub * subOffset + fx * 6, cy + pySub * subOffset + fy * 6);
        ctx.lineTo(cx + pxSub * subOffset + fx * 25, cy + pySub * subOffset + fy * 25);
        ctx.stroke();

        // Glowing capacitor charge rails
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = Math.max(1.4, railWidth - 1.2);
        ctx.beginPath();
        ctx.moveTo(cx + pxSub * subOffset + fx * 17, cy + pySub * subOffset + fy * 17);
        ctx.lineTo(cx + pxSub * subOffset + fx * 25, cy + pySub * subOffset + fy * 25);
        ctx.stroke();
      });

      // Central glowing laser excitation channel
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + fx * 7, cy + fy * 7);
      ctx.lineTo(cx + fx * 24, cy + fy * 24);
      ctx.stroke();

      // Muzzle laser emitter lens
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx + fx * 24, cy + fy * 24, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
    return;
  }

  if (def.isVulcan) {
    // 4 heavy rotary minigun barrels with circular thermal heat sink
    ctx.lineCap = 'butt';
    [-4.5, -1.5, 1.5, 4.5].forEach((offset) => {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(tower.x + px * offset + fx * 6, tower.y + py * offset + fy * 6);
      ctx.lineTo(tower.x + px * offset + fx * 21, tower.y + py * offset + fy * 21);
      ctx.stroke();
    });
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(tower.x - px * 5.5 + fx * 15, tower.y - py * 5.5 + fy * 15);
    ctx.lineTo(tower.x + px * 5.5 + fx * 15, tower.y + py * 5.5 + fy * 15);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (def.isSupercluster) {
    // Giant quad-vented cluster artillery mortar
    ctx.lineCap = 'square';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 9.5;
    ctx.beginPath();
    ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
    ctx.lineTo(tower.x + fx * 19, tower.y + fy * 19);
    ctx.stroke();

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(tower.x + fx * 15.5, tower.y + fy * 15.5);
    ctx.lineTo(tower.x + fx * 19, tower.y + fy * 19);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (def.isTwinFlank) {
    // Twin Flank: 2 forward barrels at [-5, 5] and 2 rear barrels at [-5, 5]
    ctx.lineCap = 'square';
    [0, Math.PI].forEach((baseA) => {
      const bAngle = angle + baseA;
      const bCos = Math.cos(bAngle);
      const bSin = Math.sin(bAngle);
      const bPx = -bSin;
      const bPy = bCos;
      [-5, 5].forEach((offset) => {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(tower.x + bPx * offset + bCos * 5, tower.y + bPy * offset + bSin * 5);
        ctx.lineTo(tower.x + bPx * offset + bCos * 17.5, tower.y + bPy * offset + bSin * 17.5);
        ctx.stroke();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(tower.x + bPx * offset + bCos * 14.5, tower.y + bPy * offset + bSin * 14.5);
        ctx.lineTo(tower.x + bPx * offset + bCos * 17.5, tower.y + bPy * offset + bSin * 17.5);
        ctx.stroke();
      });
    });
    ctx.restore();
    return;
  }

  if (def.fanAngles) {
    // Fan battery (Flak Cannon, Spreadshot, Hydra)
    ctx.lineCap = 'square';
    const count = def.fanAngles.length;
    const bWidth = count >= 7 ? 2.6 : count >= 5 ? 3.0 : 3.6;
    def.fanAngles.forEach((relA) => {
      const fAngle = angle + relA;
      const fCos = Math.cos(fAngle);
      const fSin = Math.sin(fAngle);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = bWidth;
      ctx.beginPath();
      ctx.moveTo(tower.x + fCos * 6, tower.y + fSin * 6);
      ctx.lineTo(tower.x + fCos * 17.5, tower.y + fSin * 17.5);
      ctx.stroke();

      ctx.strokeStyle = def.color || '#a855f7';
      ctx.lineWidth = Math.max(1.8, bWidth - 0.6);
      ctx.beginPath();
      ctx.moveTo(tower.x + fCos * 14.5, tower.y + fSin * 14.5);
      ctx.lineTo(tower.x + fCos * 17.5, tower.y + fSin * 17.5);
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
    case 'Ranger': {
      // Long-barrel tactical sniper with dual port compensator
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.8;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 26, tower.y + fy * 26);
      ctx.stroke();

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 21, tower.y + fy * 21);
      ctx.lineTo(tower.x + fx * 26, tower.y + fy * 26);
      ctx.stroke();
      break;
    }
    case 'Pulsar': {
      // Dual plasma emitter prongs with emerald orb
      ctx.lineCap = 'round';
      [-3.2, 3.2].forEach((offset) => {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(tower.x + px * offset + fx * 6, tower.y + py * offset + fy * 6);
        ctx.lineTo(tower.x + px * offset + fx * 18, tower.y + py * offset + fy * 18);
        ctx.stroke();
      });
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(tower.x + fx * 16, tower.y + fy * 16, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'Bombard': {
      // Heavy siege mortar
      ctx.lineCap = 'square';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 8.5;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 18, tower.y + fy * 18);
      ctx.stroke();

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 15, tower.y + fy * 15);
      ctx.lineTo(tower.x + fx * 18, tower.y + fy * 18);
      ctx.stroke();
      break;
    }
    case 'Colossus': {
      // Gigantic siege cannon with golden shield
      ctx.lineCap = 'square';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 6, tower.y + fy * 6);
      ctx.lineTo(tower.x + fx * 22, tower.y + fy * 22);
      ctx.stroke();

      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tower.x + fx * 17, tower.y + fy * 17);
      ctx.lineTo(tower.x + fx * 22, tower.y + fy * 22);
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

  // Outer curb / roadway shadow
  ctx.strokeStyle = map.pathOuter;
  ctx.lineWidth = 48;
  ctx.stroke();

  // Inner paved highway
  ctx.strokeStyle = map.pathInner;
  ctx.lineWidth = 38;
  ctx.stroke();

  // High-visibility dashed centerline
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = map.pathDash;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Spawn Entry Portal & Base Destination Outpost Markers
  if (map.path.length >= 2) {
    const startP = map.path[0];
    const nextP = map.path[1];
    const sAngle = Math.atan2(nextP[1] - startP[1], nextP[0] - startP[0]);

    // Red Entry Gate Marker
    ctx.save();
    ctx.translate(startP[0], startP[1]);
    ctx.rotate(sAngle);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(-12, -22, 24, 44);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -22, 24, 44);
    ctx.fillStyle = '#fee2e2';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ENTRY', 0, 0);
    ctx.restore();

    // Blue Base Outpost Marker
    const endP = map.path[map.path.length - 1];
    const prevP = map.path[map.path.length - 2];
    const eAngle = Math.atan2(endP[1] - prevP[1], endP[0] - prevP[0]);
    ctx.save();
    ctx.translate(endP[0], endP[1]);
    ctx.rotate(eAngle);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(-14, -22, 28, 44);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -22, 28, 44);
    ctx.fillStyle = '#f0f9ff';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BASE', 0, 0);
    ctx.restore();
  }

  if (!state) return;

  // Tactical Vantage Platforms (High Ground / Overlook)
  if (tacticalConfig.get().vantagePadsEnabled) {
    const pads = tacticalConfig.getVantagePads(mapId);
    pads.forEach((pad) => {
      const isOccupied = state.towers.some((t) => Math.hypot(t.x - pad.x, t.y - pad.y) < 18);

      ctx.save();
      // Drop shadow
      ctx.beginPath();
      ctx.arc(pad.x + 2, pad.y + 3, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Hexagonal platform foundation
      drawPolygon(ctx, pad.x, pad.y, 20, 6, Math.PI / 6);
      ctx.fillStyle = isOccupied ? '#112238' : '#081424';
      ctx.fill();
      ctx.strokeStyle = isOccupied ? '#f59e0b' : '#0284c7';
      ctx.lineWidth = isOccupied ? 2.5 : 1.5;
      ctx.stroke();

      // Inner tactical perimeter ring
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, 13, 0, Math.PI * 2);
      ctx.strokeStyle = isOccupied ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!isOccupied) {
        // Glowing star icon on unoccupied vantage pads
        drawStar(ctx, pad.x, pad.y, 6, 2.5, 4, 0);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 7px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VANTAGE', pad.x, pad.y + 9.5);
      }
      ctx.restore();
    });
  }

  // Selected tower range indicator
  if (state.sel) {
    const selectedTower = state.towers.find((t) => t.id === state.sel);
    if (selectedTower) {
      const def = towerDefs[selectedTower.type];
      const isVantage = Boolean(selectedTower.isVantage && tacticalConfig.get().vantagePadsEnabled);
      const effectiveRange = isVantage ? def.range * 1.25 : def.range;

      ctx.beginPath();
      ctx.arc(selectedTower.x, selectedTower.y, effectiveRange, 0, Math.PI * 2);
      ctx.fillStyle = isVantage ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.08)';
      ctx.fill();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = isVantage ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = isVantage ? 2 : 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw towers & multi-directional barrels
  state.towers.forEach((tower) => {
    const def = towerDefs[tower.type];
    const isSelected = state.sel === tower.id;
    const isVantage = Boolean(tower.isVantage && tacticalConfig.get().vantagePadsEnabled);

    // 1. Drop shadow for 3D elevation depth
    ctx.beginPath();
    ctx.arc(tower.x + 2, tower.y + 3, isVantage ? 16 : 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Vantage Overlook energetic pedestal ring
    if (isVantage) {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 17, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const pins = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      ctx.fillStyle = '#fef08a';
      pins.forEach((pa) => {
        ctx.beginPath();
        ctx.arc(tower.x + Math.cos(pa) * 17, tower.y + Math.sin(pa) * 17, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 2. Heavy Armored Gunmetal Pedestal
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = isVantage ? '#d97706' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mounting bolts on pedestal
    const boltAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    ctx.fillStyle = '#64748b';
    boltAngles.forEach((ba) => {
      ctx.beginPath();
      ctx.arc(tower.x + Math.cos(ba) * 11, tower.y + Math.sin(ba) * 11, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw visible barrels & emitters
    drawTowerBarrels(ctx, tower, def);

    // 4. Rotating Turret Dome / Core
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = def.color || '#38bdf8';
    ctx.fill();

    // Metallic Specular Bevel Ring
    ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
    ctx.lineWidth = isSelected ? 2.5 : 1.8;
    ctx.stroke();

    // Specular highlight gleam
    ctx.beginPath();
    ctx.arc(tower.x - 2.5, tower.y - 2.5, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    // 5. Centered crisp abbreviation label
    const label = def.abbr || (tower.type === 'ALLSPIKER' ? 'ALL' : tower.type.slice(0, 3).toUpperCase());
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tower.x, tower.y + 1);

    // 6. Holographic Selection Reticle
    if (isSelected) {
      ctx.save();
      const time = performance.now() * 0.002;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 8;
      ctx.stroke();

      // 4 Corner targeting ticks
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      const tickDist = 21;
      const tickLen = 4;
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((a) => {
        const ca = Math.cos(a + time);
        const sa = Math.sin(a + time);
        ctx.beginPath();
        ctx.moveTo(tower.x + ca * (tickDist - tickLen), tower.y + sa * (tickDist - tickLen));
        ctx.lineTo(tower.x + ca * tickDist, tower.y + sa * tickDist);
        ctx.stroke();
      });
      ctx.restore();
    }
  });

  // Draw enemies
  state.enemies.forEach((enemy) => {
    // Drop shadow under enemy for depth
    ctx.beginPath();
    ctx.ellipse(enemy.x + 1.5, enemy.y + 2.5, enemy.r * 1.05, enemy.r * 0.65, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    drawEnemyShape(ctx, enemy);

    // 1. Energy Shield forcefield bubble & shield bar (if active)
    if (enemy.shield && enemy.shield > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r + 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fill();
      ctx.restore();

      const shieldRatio = Math.min(1, enemy.shield / (enemy.maxShield || enemy.max));
      const sBarW = enemy.boss ? Math.max(74, enemy.r * 2.5) : Math.max(18, enemy.r * 2);
      const sBarH = enemy.boss ? 4 : 3;
      const sBarY = enemy.boss ? enemy.y - enemy.r - 26 : enemy.y - enemy.r - 12;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(enemy.x - sBarW / 2 - 1, sBarY - 1, sBarW + 2, sBarH + 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(enemy.x - sBarW / 2, sBarY, sBarW * shieldRatio, sBarH);
    }

    // 2. Flat Armor badge (anti-spam plating indicator)
    if (enemy.armor && enemy.armor > 0) {
      ctx.save();
      const ax = enemy.x + enemy.r + 3;
      const ay = enemy.y - enemy.r + 3;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ax, ay, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 6px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', ax, ay);
      ctx.restore();
    }

    const healthFraction = Math.max(0, enemy.hp / enemy.max);

    if (enemy.boss) {
      // Boss health bar & label
      const barW = Math.max(74, enemy.r * 2.5);
      const barH = 8;
      const barY = enemy.y - enemy.r - 20;

      ctx.fillStyle = '#1c0a0e';
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
      const barWidth = Math.max(18, enemy.r * 2);
      const barHeight = 4;
      const barY = enemy.y - enemy.r - 7;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(enemy.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

      const hpColor = healthFraction > 0.5 ? '#10b981' : healthFraction > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillStyle = hpColor;
      ctx.fillRect(enemy.x - barWidth / 2, barY, barWidth * healthFraction, barHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(enemy.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
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
    } else if (bullet.isRailgun) {
      // Penetrating Laser Beam (Blue for Railgun, Red for Double Railgun, Purple for Triple Railgun)
      const laserColor = bullet.laserColor || 'blue';
      const beamGlow = laserColor === 'red' ? '#ef4444' : laserColor === 'purple' ? '#c084fc' : '#38bdf8';
      const beamCore = laserColor === 'red' ? '#fee2e2' : laserColor === 'purple' ? '#f3e8ff' : '#e0f2fe';
      const beamLength = 26;

      const angle = Math.atan2(bullet.vy, bullet.vx);
      const bCos = Math.cos(angle);
      const bSin = Math.sin(angle);

      const tipX = bullet.x + bCos * 6;
      const tipY = bullet.y + bSin * 6;
      const tailX = bullet.x - bCos * beamLength;
      const tailY = bullet.y - bSin * beamLength;

      // Outer wide laser glow halo
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = beamGlow;
      ctx.lineWidth = 6.0;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner intense laser core line
      ctx.beginPath();
      ctx.moveTo(tailX + bCos * 4, tailY + bSin * 4);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = beamCore;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Bright laser tip flare
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (bullet.isExplosive) {
      // Heavy explosive artillery mortar shell
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Hot glowing core
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
    } else if (bullet.isFanBullet) {
      ctx.fillStyle = '#e9d5ff';
      ctx.fill();
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 1.2;
      ctx.stroke();
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
      // Standard bullet with radiant molten core & crisp border
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Game over overlay
  if (state.over) {
    ctx.fillStyle = 'rgba(5, 10, 20, 0.65)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px system-ui';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 16);
    ctx.font = '16px system-ui';
    ctx.fillText('Press Restart Game to try again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 16);
  }

  ctx.textAlign = 'left';
}
