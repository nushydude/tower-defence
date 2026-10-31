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

  // Special island background with sandy atoll landmasses
  if (map.id === 'island') {
    // Large central sandy island
    ctx.fillStyle = '#e4c489';
    ctx.beginPath();
    ctx.ellipse(360, 240, 310, 190, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner tropical greenery
    ctx.fillStyle = '#6ab85e';
    ctx.beginPath();
    ctx.ellipse(360, 240, 250, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water wave highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 25; i < CANVAS_WIDTH; i += 70) {
      ctx.beginPath();
      ctx.arc(i, 40, 15, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(i + 35, 435, 15, 0, Math.PI);
      ctx.stroke();
    }
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
