import { MAP_CONFIGS, ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, getBossConfigForWave } from './config.js';

export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export function isPointNearPath(px, py, path, threshold = 34) {
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];
    if (distToSegment(px, py, x1, y1, x2, y2) < threshold) {
      return true;
    }
  }
  return false;
}

export function createInitialState(mapId = 'grassland') {
  return {
    mapId,
    coins: 300,
    gems: 0,
    wave: 0,
    hp: 100,
    towers: [],
    enemies: [],
    bullets: [],
    running: false,
    over: false,
    sel: null,
    build: null,
    speed: 1,
    spawned: 0,
    total: 0,
    clock: 0,
    autoStart: false,
    autoCountdown: 0
  };
}

export class GameModel {
  constructor(onMessage, onUIUpdate) {
    this.onMessage = onMessage || (() => {});
    this.onUIUpdate = onUIUpdate || (() => {});
    this.saves = [null, null, null];
    this.activeSlot = 0;
    this.state = null;
    this.nextTowerId = 1;
  }

  getCurrentMap() {
    const mapId = this.state?.mapId || 'grassland';
    return MAP_CONFIGS[mapId] || MAP_CONFIGS.grassland;
  }

  hasSave(slotIndex) {
    return Boolean(this.saves[slotIndex]);
  }

  saveGame() {
    if (this.state) {
      this.saves[this.activeSlot] = JSON.parse(
        JSON.stringify({ ...this.state, running: false, bullets: [] })
      );
    }
  }

  loadSlot(slotIndex, chosenMapId = 'grassland') {
    this.activeSlot = slotIndex;
    const saved = this.saves[slotIndex];
    if (saved) {
      this.state = {
        ...createInitialState(saved.mapId || 'grassland'),
        ...saved,
        running: false,
        over: false,
        bullets: [],
        sel: null,
        build: null
      };
    } else {
      this.state = createInitialState(chosenMapId);
    }
  }

  deleteSlot(slotIndex) {
    this.saves[slotIndex] = null;
  }

  chooseEnemyTypeForWave() {
    const wave = this.state.wave;
    if (wave % 10 === 0) return 'boss';

    const pool = [];
    Object.entries(ENEMY_TYPES).forEach(([key, def]) => {
      if (wave >= def.minWave) {
        const waveDiff = wave - def.minWave;
        let weight = Math.max(1, 6 - Math.floor(waveDiff / 4));
        if (def.shape === 'circle' || def.shape === 'triangle') {
          weight = Math.max(2, weight); // maintain fast pressure
        }
        for (let i = 0; i < weight; i++) {
          pool.push(key);
        }
      }
    });

    return pool[Math.floor(Math.random() * pool.length)] || 'square';
  }

  spawnEnemy() {
    const map = this.getCurrentMap();
    const isBossWave = this.state.wave % 10 === 0;

    const startX = map.path[0][0];
    const startY = map.path[0][1];
    const nextPoint = map.path[1] || map.path[0];
    const initialAngle = Math.atan2(nextPoint[1] - startY, nextPoint[0] - startX);

    if (isBossWave) {
      const bossConfig = getBossConfigForWave(this.state.wave);
      this.state.enemies.push({
        x: startX,
        y: startY,
        seg: 0,
        distance: 0,
        angle: initialAngle,
        type: 'boss',
        bossTier: bossConfig.tier,
        name: bossConfig.name,
        shape: bossConfig.shape,
        color: bossConfig.color,
        borderColor: bossConfig.borderColor,
        boss: true,
        hp: bossConfig.hp,
        max: bossConfig.hp,
        speed: bossConfig.speed,
        rewardCoins: bossConfig.rewardCoins,
        rewardGems: bossConfig.rewardGems,
        r: bossConfig.r,
        dead: false
      });
      return;
    }

    const typeKey = this.chooseEnemyTypeForWave();
    const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.square;

    const waveFactor = Math.max(0, this.state.wave - 1);
    const hp = Math.round(def.baseHp + waveFactor * def.hpPerWave);
    const speed = Math.round(def.speed + Math.min(waveFactor * def.speedPerWave, 35));

    this.state.enemies.push({
      x: startX,
      y: startY,
      seg: 0,
      distance: 0,
      angle: initialAngle,
      type: typeKey,
      name: def.name,
      shape: def.shape,
      color: def.color,
      borderColor: def.borderColor,
      boss: false,
      hp,
      max: hp,
      speed,
      reward: def.reward + Math.floor(this.state.wave / 4),
      r: def.r,
      dead: false
    });
  }

  startStage() {
    if (!this.state) return;

    if (this.state.over) {
      const currentMapId = this.state.mapId || 'grassland';
      this.state = createInitialState(currentMapId);
      this.onUIUpdate();
      this.onMessage('New game! Build your towers.');
      return;
    }

    if (this.state.running) return;

    this.state.wave++;
    this.state.running = true;
    this.state.spawned = 0;
    this.state.clock = 0;

    const isBossWave = this.state.wave % 10 === 0;
    this.state.total = isBossWave ? 1 : Math.min(8 + this.state.wave * 2, 40);

    if (isBossWave) {
      const boss = getBossConfigForWave(this.state.wave);
      this.onMessage(`⚠️ BOSS BATTLE! Stage ${this.state.wave}: Defeat ${boss.name}!`);
    } else {
      const unlocks = {
        2: '⚡ Neon Pink Orbs (Hyper Swarm) are rushing in!',
        3: '🔺 Fast Purple Triangles have arrived!',
        5: '⬡ Armored Amber Hexagons incoming!',
        6: '⬟ Cyan Pentagons (Bruisers) entering the field!',
        7: '🔷 Elite Emerald Diamonds detected!',
        8: '⭐ Golden Star Vanguards approaching!',
        11: '🛑 Obsidian Octagons (Heavy Juggernauts) deployed!',
        13: '⚔️ Ruby Cross Raiders sighted!',
        16: '🔮 Amethyst Decagon Colossi marching in!'
      };
      if (unlocks[this.state.wave]) {
        this.onMessage(`Stage ${this.state.wave}: ${unlocks[this.state.wave]}`);
      } else {
        this.onMessage(`Stage ${this.state.wave} started!`);
      }
    }

    this.onUIUpdate();
    this.saveGame();
  }

  cycleSpeed() {
    if (!this.state) return;
    this.state.speed = this.state.speed === 1 ? 2 : this.state.speed === 2 ? 3 : 1;
  }

  toggleAutoStart() {
    if (!this.state) return;
    this.state.autoStart = !this.state.autoStart;
    if (this.state.autoStart && !this.state.running && !this.state.over) {
      this.state.autoCountdown = 1.0;
    }
  }

  update(dt, towerDefs) {
    if (!this.state) return;

    const map = this.getCurrentMap();
    const path = map.path;
    const scaledDt = dt * this.state.speed;

    // 1. Spawning & Movement when stage is actively running
    if (this.state.running) {
      // Enemy wave spawning
      if (this.state.spawned < this.state.total) {
        this.state.clock -= scaledDt;
        if (this.state.clock <= 0) {
          this.spawnEnemy();
          this.state.spawned++;
          this.state.clock = (this.state.wave % 10 === 0)
            ? 999
            : Math.max(0.20, 1.05 - this.state.wave * 0.025);
        }
      }

      // Move enemies along waypoints with precise segment clamping (zero drift)
      this.state.enemies.forEach((enemy) => {
        if (enemy.dead) return;

        let moveDist = enemy.speed * scaledDt;

        while (moveDist > 0 && !enemy.dead) {
          if (enemy.seg >= path.length - 1) {
            enemy.dead = true;
            if (enemy.boss) {
              this.state.hp -= 100;
              this.state.over = true;
              this.state.running = false;
              this.onMessage(`The ${enemy.name || 'Boss'} reached your base! Game over.`);
            } else {
              const leakDmg = (enemy.shape === 'hexagon' || enemy.shape === 'octagon' || enemy.shape === 'decagon') ? 15 : 10;
              this.state.hp -= leakDmg;
            }
            break;
          }

          const targetPoint = path[enemy.seg + 1];
          const dx = targetPoint[0] - enemy.x;
          const dy = targetPoint[1] - enemy.y;
          const distToTarget = Math.hypot(dx, dy);

          if (distToTarget <= 0.001) {
            enemy.seg++;
            continue;
          }

          enemy.angle = Math.atan2(dy, dx);

          if (moveDist < distToTarget) {
            enemy.x += (dx / distToTarget) * moveDist;
            enemy.y += (dy / distToTarget) * moveDist;
            enemy.distance = (enemy.distance || 0) + moveDist;
            moveDist = 0;
          } else {
            enemy.x = targetPoint[0];
            enemy.y = targetPoint[1];
            enemy.distance = (enemy.distance || 0) + distToTarget;
            moveDist -= distToTarget;
            enemy.seg++;

            if (enemy.seg >= path.length - 1) {
              enemy.dead = true;
              if (enemy.boss) {
                this.state.hp -= 100;
                this.state.over = true;
                this.state.running = false;
                this.onMessage(`The ${enemy.name || 'Boss'} reached your base! Game over.`);
              } else {
                const leakDmg = (enemy.shape === 'hexagon' || enemy.shape === 'octagon' || enemy.shape === 'decagon') ? 15 : 10;
                this.state.hp -= leakDmg;
              }
              break;
            }
          }
        }
      });

      // Towers acquire targets and fire (prioritizes furthest along track)
      this.state.towers.forEach((tower) => {
        tower.cool = (tower.cool || 0) - scaledDt;
        if (tower.cool <= 0) {
          const def = towerDefs[tower.type];
          const target = this.state.enemies
            .filter((e) => !e.dead && Math.hypot(e.x - tower.x, e.y - tower.y) <= def.range)
            .sort((a, b) => (b.distance || 0) - (a.distance || 0))[0];

          if (target) {
            const aimAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
            tower.angle = aimAngle;

            if (def.multiDir) {
              // Multi-directional Turret
              def.multiDir.forEach((offsetAngle) => {
                const shotAngle = aimAngle + offsetAngle;
                const vx = Math.cos(shotAngle);
                const vy = Math.sin(shotAngle);
                this.state.bullets.push({
                  x: tower.x + vx * 14,
                  y: tower.y + vy * 14,
                  vx,
                  vy,
                  dmg: def.dmg,
                  speed: 330,
                  rangeLeft: def.range + 30
                });
              });
            } else if (def.isAtomic) {
              // Atomic Turret: Fires an atomic core that multiplies into more the further it goes
              const vx = Math.cos(aimAngle);
              const vy = Math.sin(aimAngle);
              this.state.bullets.push({
                x: tower.x + vx * 14,
                y: tower.y + vy * 14,
                vx,
                vy,
                angle: aimAngle,
                dmg: def.dmg,
                speed: 340,
                rangeLeft: def.range + 30,
                isAtomic: true,
                distTraveled: 0,
                nextSplitDist: 60,
                splitCount: 0,
                maxSplits: 3,
                r: 5.5
              });
            } else {
              // Standard or exploding bullet
              this.state.bullets.push({
                x: tower.x,
                y: tower.y,
                target,
                dmg: def.dmg,
                speed: 330,
                burstShards: def.burstShards || 0,
                shardDmg: def.shardDmg || 0
              });
            }
            tower.cool = def.rate;
          }
        }
      });
    }

    // 2. Bullets simulation (Runs even if stage just finished, allowing in-flight bullets to complete flight)
    if (this.state.bullets.length > 0) {
      const spawnedBullets = [];

      this.state.bullets.forEach((bullet) => {
        if (bullet.dead) return;

        if (bullet.vx !== undefined && bullet.vy !== undefined) {
          // Directional projectile, atomic fission ball, or cluster shard
          const moveDist = bullet.speed * scaledDt;
          bullet.x += bullet.vx * moveDist;
          bullet.y += bullet.vy * moveDist;
          bullet.rangeLeft = (bullet.rangeLeft ?? 200) - moveDist;
          if (bullet.distTraveled !== undefined) {
            bullet.distTraveled += moveDist;
          }

          // Check if out of bounds or range
          if (
            bullet.rangeLeft <= 0 ||
            bullet.x < -20 ||
            bullet.x > CANVAS_WIDTH + 20 ||
            bullet.y < -20 ||
            bullet.y > CANVAS_HEIGHT + 20
          ) {
            bullet.dead = true;
            return;
          }

          // Collision check against remaining active enemies
          for (const enemy of this.state.enemies) {
            if (!enemy.dead) {
              const hitDist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
              if (hitDist <= (bullet.r || 4) + enemy.r) {
                enemy.hp -= bullet.dmg;
                bullet.dead = true;
                break;
              }
            }
          }

          // Atomic fission: split/multiply into more projectiles the further it travels
          if (!bullet.dead && bullet.isAtomic && bullet.splitCount < bullet.maxSplits) {
            if (bullet.distTraveled >= bullet.nextSplitDist) {
              bullet.dead = true;
              const currentAngle = bullet.angle !== undefined ? bullet.angle : Math.atan2(bullet.vy, bullet.vx);
              const spread = Math.max(0.12, 0.22 - bullet.splitCount * 0.04);
              const nextDist = bullet.distTraveled + 55;
              const childDmg = Math.max(4, Math.round(bullet.dmg * 0.85));
              const childR = Math.max(2.8, (bullet.r || 5) - 0.7);

              [-spread, spread].forEach((offset) => {
                const childAngle = currentAngle + offset;
                const cvx = Math.cos(childAngle);
                const cvy = Math.sin(childAngle);
                spawnedBullets.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx: cvx,
                  vy: cvy,
                  angle: childAngle,
                  dmg: childDmg,
                  speed: bullet.speed,
                  rangeLeft: bullet.rangeLeft,
                  isAtomic: true,
                  distTraveled: bullet.distTraveled,
                  nextSplitDist: nextDist,
                  splitCount: bullet.splitCount + 1,
                  maxSplits: bullet.maxSplits,
                  r: childR
                });
              });
              return;
            }
          }
        } else {
          // Targeted bullet
          const target = bullet.target;

          // If target is already gone or dead, fly forward along trajectory to fade naturally
          if (!target || target.dead) {
            if (bullet.vx === undefined && bullet.vy === undefined) {
              const targetX = target ? target.x : bullet.x;
              const targetY = target ? target.y : bullet.y;
              const angle = Math.atan2(targetY - bullet.y, targetX - bullet.x) || 0;
              bullet.vx = Math.cos(angle);
              bullet.vy = Math.sin(angle);
              bullet.rangeLeft = 140;
            }
            const moveDist = bullet.speed * scaledDt;
            bullet.x += bullet.vx * moveDist;
            bullet.y += bullet.vy * moveDist;
            bullet.rangeLeft -= moveDist;
            if (
              bullet.rangeLeft <= 0 ||
              bullet.x < -20 ||
              bullet.x > CANVAS_WIDTH + 20 ||
              bullet.y < -20 ||
              bullet.y > CANVAS_HEIGHT + 20
            ) {
              bullet.dead = true;
            }
            return;
          }

          const dx = target.x - bullet.x;
          const dy = target.y - bullet.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < bullet.speed * scaledDt + target.r) {
            target.hp -= bullet.dmg;
            bullet.dead = true;

            // Explode into non-exploding outward shards if configured (Scatter = 5, Cluster = 10)
            if (bullet.burstShards > 0) {
              const shardCount = bullet.burstShards;
              const angleStep = (Math.PI * 2) / shardCount;
              // Add slight random rotation offset so each burst feels organic
              const baseAngle = Math.random() * Math.PI;

              for (let i = 0; i < shardCount; i++) {
                const angle = baseAngle + i * angleStep;
                const vx = Math.cos(angle);
                const vy = Math.sin(angle);
                spawnedBullets.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx,
                  vy,
                  dmg: bullet.shardDmg || 14,
                  speed: 280,
                  rangeLeft: 125,
                  r: 2.5,
                  isShard: true
                });
              }
            }
          } else {
            bullet.x += (dx / dist) * bullet.speed * scaledDt;
            bullet.y += (dy / dist) * bullet.speed * scaledDt;
          }
        }
      });

      if (spawnedBullets.length > 0) {
        this.state.bullets.push(...spawnedBullets);
      }
    }

    // 3. Enemy deaths & rewards
    this.state.enemies.forEach((enemy) => {
      if (enemy.hp <= 0 && !enemy.dead) {
        enemy.dead = true;
        if (enemy.boss) {
          const gemsAwarded = enemy.rewardGems || 10;
          const coinsAwarded = enemy.rewardCoins || 100;
          this.state.gems += gemsAwarded;
          this.state.coins += coinsAwarded;
          this.state.running = false;
          this.onMessage(`BOSS DEFEATED (${enemy.name})! +${gemsAwarded} gems and +${coinsAwarded} coins!`);
          if (this.state.autoStart && !this.state.over) {
            this.state.autoCountdown = 2.0;
          }
        } else {
          this.state.coins += enemy.reward;
        }
      }
    });

    // Cleanup dead entities
    this.state.enemies = this.state.enemies.filter((e) => !e.dead);
    this.state.bullets = this.state.bullets.filter((b) => !b.dead);

    // 4. Wave completion
    if (this.state.spawned >= this.state.total && !this.state.enemies.length && this.state.running) {
      this.state.running = false;
      const bonus = 25 + Math.floor(this.state.wave * 2.5);
      this.state.coins += bonus;
      this.onMessage(`Stage cleared! +${bonus} bonus coins.`);
      if (this.state.autoStart && !this.state.over) {
        this.state.autoCountdown = 1.5; // Brief intermission before launching next wave
      }
    }

    // Auto-start countdown when idle between rounds
    if (this.state.autoStart && !this.state.running && !this.state.over && this.state.autoCountdown > 0) {
      this.state.autoCountdown -= scaledDt;
      if (this.state.autoCountdown <= 0) {
        this.startStage();
        return;
      }
    }

    // Base destroyed
    if (this.state.hp <= 0) {
      this.state.hp = 0;
      this.state.running = false;
      this.state.over = true;
      this.onMessage('Base destroyed! Game over.');
    }

    this.onUIUpdate();
  }

  handleCanvasClick(x, y, towerDefs) {
    if (!this.state || this.state.over) return;

    // Check if an existing tower was clicked
    const clickedTower = [...this.state.towers].reverse().find(
      (t) => Math.hypot(t.x - x, t.y - y) < 18
    );

    if (clickedTower) {
      this.state.sel = clickedTower.id;
      this.state.build = null;
      this.onUIUpdate();
      return;
    }

    // Placing a selected tower
    if (this.state.build) {
      const type = this.state.build;
      const def = towerDefs[type];
      const map = this.getCurrentMap();
      const path = map.path;

      if (this.state.coins < def.cost) {
        this.onMessage('Not enough coins!');
        return;
      }

      // Check distance from all road segments
      const isOnRoad = isPointNearPath(x, y, path, 34);
      const isNearTower = this.state.towers.some((t) => Math.hypot(t.x - x, t.y - y) < 28);

      if (isOnRoad || isNearTower) {
        this.onMessage('Place towers on clear terrain, away from the path.');
        return;
      }

      this.state.coins -= def.cost;
      this.state.towers.push({
        id: this.nextTowerId++,
        x,
        y,
        type,
        cool: 0,
        angle: 0
      });
      this.state.sel = this.state.towers.at(-1).id;
      this.state.build = null;
      this.onUIUpdate();
      this.saveGame();
      this.onMessage(`${type} placed!`);
      return;
    }

    // Deselect if clicked empty area
    this.state.sel = null;
    this.onUIUpdate();
  }
}
