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
  if (def.isAtomic) {
    const angle = tower.angle || 0;
    // Heavy accelerator barrel
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.lineTo(tower.x + Math.cos(angle) * 19, tower.y + Math.sin(angle) * 19);
    ctx.stroke();

    // Glowing emitter muzzle
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tower.x + Math.cos(angle) * 16, tower.y + Math.sin(angle) * 16, 4, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (!def.multiDir) return;

  const baseAngle = tower.angle || 0;
  ctx.strokeStyle = '#263448';
  ctx.lineWidth = 4;
  ctx.lineCap = 'butt';

  def.multiDir.forEach((offset) => {
    const angle = baseAngle + offset;
    const barrelLength = 17;
    const startX = tower.x + Math.cos(angle) * 7;
    const startY = tower.y + Math.sin(angle) * 7;
    const endX = tower.x + Math.cos(angle) * barrelLength;
    const endY = tower.y + Math.sin(angle) * barrelLength;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  });
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

    if (bullet.isAtomic) {
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
