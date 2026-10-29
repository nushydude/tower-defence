import { MAP_CONFIGS, ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

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
    if (wave === 10) return 'boss';

    const pool = ['square', 'square'];

    if (wave >= 3) {
      pool.push('triangle', 'triangle', 'triangle');
    }
    if (wave >= 5) {
      pool.push('hexagon', 'hexagon');
    }
    if (wave >= 7) {
      pool.push('diamond', 'diamond');
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return chosen;
  }

  spawnEnemy() {
    const map = this.getCurrentMap();
    const typeKey = this.chooseEnemyTypeForWave();
    const def = ENEMY_TYPES[typeKey];
    const isBoss = typeKey === 'boss';

    const waveFactor = Math.max(0, this.state.wave - 1);
    const hp = isBoss ? def.baseHp : Math.round(def.baseHp + waveFactor * def.hpPerWave);
    const speed = isBoss ? def.speed : Math.round(def.speed + Math.min(waveFactor * def.speedPerWave, 35));

    this.state.enemies.push({
      x: map.path[0][0],
      y: map.path[0][1],
      seg: 0,
      type: typeKey,
      shape: def.shape,
      color: def.color,
      borderColor: def.borderColor,
      boss: isBoss,
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
    this.state.total = this.state.wave === 10 ? 1 : Math.min(8 + this.state.wave * 2, 32);

    if (this.state.wave === 10) {
      this.onMessage('⚠️ BOSS BATTLE! Defeat the giant red pentagon!');
    } else if (this.state.wave === 3) {
      this.onMessage(`Stage 3: Fast Purple Triangles have arrived!`);
    } else if (this.state.wave === 5) {
      this.onMessage(`Stage 5: Armored Amber Hexagons incoming!`);
    } else if (this.state.wave === 7) {
      this.onMessage(`Stage 7: Elite Emerald Diamonds detected!`);
    } else {
      this.onMessage(`Stage ${this.state.wave} started!`);
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
          this.state.clock = this.state.wave === 10
            ? 999
            : Math.max(0.22, 1.05 - this.state.wave * 0.03);
        }
      }

      // Move enemies along waypoints
      this.state.enemies.forEach((enemy) => {
        if (enemy.dead) return;
        const a = path[enemy.seg];
        const b = path[Math.min(enemy.seg + 1, path.length - 1)];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy) || 1;

        enemy.angle = Math.atan2(dy, dx);
        enemy.x += (dx / length) * enemy.speed * scaledDt;
        enemy.y += (dy / length) * enemy.speed * scaledDt;

        if (Math.hypot(b[0] - enemy.x, b[1] - enemy.y) < enemy.speed * scaledDt + 1) {
          enemy.seg++;
          if (enemy.seg >= path.length - 1) {
            enemy.dead = true;
            this.state.hp -= enemy.boss ? 100 : (enemy.type === 'hexagon' ? 15 : 10);
            if (enemy.boss) {
              this.state.over = true;
              this.state.running = false;
              this.onMessage('The boss reached your base! Game over.');
            }
          }
        }
      });

      // Towers acquire targets and fire
      this.state.towers.forEach((tower) => {
        tower.cool = (tower.cool || 0) - scaledDt;
        if (tower.cool <= 0) {
          const def = towerDefs[tower.type];
          const target = this.state.enemies
            .filter((e) => !e.dead && Math.hypot(e.x - tower.x, e.y - tower.y) <= def.range)
            .sort((a, b) => b.seg - a.seg)[0];

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
      const newShards = [];

      this.state.bullets.forEach((bullet) => {
        if (bullet.dead) return;

        if (bullet.vx !== undefined && bullet.vy !== undefined) {
          // Directional projectile or cluster shard
          const moveDist = bullet.speed * scaledDt;
          bullet.x += bullet.vx * moveDist;
          bullet.y += bullet.vy * moveDist;
          bullet.rangeLeft = (bullet.rangeLeft ?? 200) - moveDist;

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
                newShards.push({
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

      if (newShards.length > 0) {
        this.state.bullets.push(...newShards);
      }
    }

    // 3. Enemy deaths & rewards
    this.state.enemies.forEach((enemy) => {
      if (enemy.hp <= 0 && !enemy.dead) {
        enemy.dead = true;
        if (enemy.boss) {
          this.state.gems += 10;
          this.state.coins += 100;
          this.state.running = false;
          this.onMessage('BOSS DEFEATED! +10 gems and +100 coins!');
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
      this.state.coins += 25;
      this.onMessage('Stage cleared! +25 bonus coins.');
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

      // Check distance from path segments
      const isOnRoad = path.some((p) => Math.hypot(p[0] - x, p[1] - y) < 34);
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
