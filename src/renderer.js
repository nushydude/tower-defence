import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_CONFIGS } from './config.js';

export function drawPolygon(ctx, x, y, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
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

  // Draw towers
  state.towers.forEach((tower) => {
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = towerDefs[tower.type].color;
    ctx.fill();

    const isSelected = state.sel === tower.id;
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.strokeStyle = isSelected ? 'white' : '#263448';
    ctx.stroke();

    ctx.fillStyle = '#142030';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    const label = tower.type === 'ALLSPIKER' ? 'ALL' : tower.type.slice(0, 3).toUpperCase();
    ctx.fillText(label, tower.x, tower.y + 3);
  });

  // Draw enemies
  state.enemies.forEach((enemy) => {
    if (enemy.boss) {
      drawPolygon(ctx, enemy.x, enemy.y, enemy.r, 5);
      ctx.fillStyle = '#ed202d';
      ctx.fill();
      ctx.strokeStyle = '#790b17';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Boss health bar
      ctx.fillStyle = '#28070b';
      ctx.fillRect(enemy.x - 34, enemy.y - 48, 68, 8);
      ctx.fillStyle = '#ff4652';
      ctx.fillRect(enemy.x - 33, enemy.y - 47, 66 * Math.max(0, enemy.hp / enemy.max), 6);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', enemy.x, enemy.y - 55);
    } else {
      ctx.fillStyle = '#318cff';
      ctx.fillRect(enemy.x - 9, enemy.y - 9, 18, 18);

      // Enemy health bar
      ctx.fillStyle = '#1d2937';
      ctx.fillRect(enemy.x - 11, enemy.y - 16, 22, 4);
      ctx.fillStyle = '#69f29b';
      ctx.fillRect(enemy.x - 10, enemy.y - 15, 20 * Math.max(0, enemy.hp / enemy.max), 2);
    }
  });

  // Draw bullets
  state.bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7c2';
    ctx.fill();
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
