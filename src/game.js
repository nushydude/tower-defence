import { MAP_CONFIGS, ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, getBossConfigForWave } from './config.js';
import { tacticalConfig } from './tacticalConfig.js';
import {
  loadAllSaves,
  saveSlotToStorage,
  deleteSlotFromStorage,
  getStoredActiveSlot,
  setStoredActiveSlot
} from './storage.js';

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
    this.saves = loadAllSaves();
    this.activeSlot = getStoredActiveSlot();
    this.state = null;
    this.nextTowerId = 1;
    this.autoSaveTimer = 0;
  }

  getCurrentMap() {
    const mapId = this.state?.mapId || 'grassland';
    return MAP_CONFIGS[mapId] || MAP_CONFIGS.grassland;
  }

  getTowerCost(towerType, towerDefs) {
    const baseCost = towerDefs?.[towerType]?.cost || 0;
    return tacticalConfig.calculateTowerCost(baseCost, towerType, this.state?.towers || []);
  }

  applyDamage(enemy, rawDmg, bullet) {
    if (!enemy || enemy.dead || enemy.hp <= 0) return 0;

    let dmg = rawDmg;

    // 1. Vantage Pad buff: +15% damage bonus
    if (bullet && bullet.isVantage) {
      dmg = Math.round(dmg * 1.15);
    }

    // 2. Phase Energy Shields: Absorbs damage first
    if (enemy.shield && enemy.shield > 0) {
      // Directed energy/laser weapons deal 2.0x damage to energy shields!
      const isEnergy = Boolean(bullet && (bullet.isRailgun || bullet.isLaser || bullet.isAtomic || bullet.isGamma || bullet.isPulsar));
      const shieldDmg = isEnergy ? Math.round(dmg * 2.0) : dmg;

      if (enemy.shield >= shieldDmg) {
        enemy.shield -= shieldDmg;
        return shieldDmg;
      } else {
        // Shield broken! Remaining damage carries over
        const absorbed = enemy.shield;
        const remainder = Math.round((shieldDmg - absorbed) / (isEnergy ? 2.0 : 1.0));
        enemy.shield = 0;
        dmg = remainder;
      }
    }

    // 3. Flat Enemy Armor: Reduces damage per hit (anti-spam plating)
    if (enemy.armor && enemy.armor > 0) {
      let effectiveArmor = enemy.armor;
      // Vantage pad towers ignore 50% armor
      if (bullet && bullet.isVantage) {
        effectiveArmor = Math.round(effectiveArmor * 0.5);
      }
      // Piercing lances / Railguns pierce heavy armor
      if (bullet && (bullet.isPiercing || bullet.isRailgun)) {
        effectiveArmor = Math.round(effectiveArmor * 0.25);
      }
      dmg = Math.max(1, dmg - effectiveArmor);
    }

    enemy.hp -= dmg;
    return dmg;
  }

  hasSave(slotIndex) {
    return Boolean(this.saves[slotIndex]);
  }

  saveGame() {
    if (this.state) {
      saveSlotToStorage(this.activeSlot, this.state);
      this.saves = loadAllSaves();
      setStoredActiveSlot(this.activeSlot);
    }
  }

  loadSlot(slotIndex, chosenMapId = 'grassland') {
    this.activeSlot = slotIndex;
    setStoredActiveSlot(slotIndex);
    this.saves = loadAllSaves();
    const saved = this.saves[slotIndex];
    if (saved) {
      this.state = {
        ...createInitialState(saved.mapId || 'grassland'),
        ...saved,
        running: false,
        over: false,
        bullets: [],
        enemies: [],
        spawned: 0,
        clock: 0,
        sel: null,
        build: null
      };
      if (Array.isArray(saved.towers) && saved.towers.length > 0) {
        const maxId = saved.towers.reduce((max, t) => Math.max(max, t.id || 0), 0);
        this.nextTowerId = maxId + 1;
      } else {
        this.nextTowerId = 1;
      }
    } else {
      this.state = createInitialState(chosenMapId);
      this.state.createdAt = Date.now();
      this.nextTowerId = 1;
      this.saveGame();
    }
  }

  deleteSlot(slotIndex) {
    deleteSlotFromStorage(slotIndex);
    this.saves = loadAllSaves();
    if (this.activeSlot === slotIndex) {
      this.state = null;
    }
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
      const bossArmor = tacticalConfig.getEnemyArmor(bossConfig.shape, true, bossConfig.tier);
      const bossShield = tacticalConfig.getEnemyShield(bossConfig.shape, bossConfig.hp, true);
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
        armor: bossArmor,
        shield: bossShield,
        maxShield: bossShield,
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
    const armor = tacticalConfig.getEnemyArmor(def.shape, false, 1);
    const shield = tacticalConfig.getEnemyShield(def.shape, hp, false);

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
      armor,
      shield,
      maxShield: shield,
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
        const def = towerDefs[tower.type];
        if (!def) return;

        // Check adjacency command synergy (+15% cadence boost if near advanced tier 3+ tower)
        let cdMult = 1.0;
        if (tacticalConfig.get().adjacencySynergyEnabled) {
          const hasAlly = this.state.towers.some((other) => {
            if (other.id === tower.id) return false;
            return Math.hypot(other.x - tower.x, other.y - tower.y) <= 95 && (towerDefs[other.type]?.cost >= 160 || other.isVantage);
          });
          tower.hasSynergy = hasAlly;
          if (hasAlly) cdMult = 1.15;
        } else {
          tower.hasSynergy = false;
        }

        tower.cool = (tower.cool || 0) - scaledDt * cdMult;

        // Smoothly track targets based on tower.targetMode and Vantage Overlook buff (+25% range)
        const effectiveRange = (tower.isVantage && tacticalConfig.get().vantagePadsEnabled)
          ? def.range * 1.25
          : def.range;

        const inRange = this.state.enemies
          .filter((e) => !e.dead && Math.hypot(e.x - tower.x, e.y - tower.y) <= effectiveRange);
        let target;
        const mode = tower.targetMode || 'first';
        if (mode === 'strongest') {
          target = inRange.sort((a, b) => (b.hp - a.hp) || ((b.distance || 0) - (a.distance || 0)))[0];
        } else if (mode === 'last') {
          target = inRange.sort((a, b) => (a.distance || 0) - (b.distance || 0))[0];
        } else if (mode === 'closest') {
          target = inRange.sort((a, b) => Math.hypot(a.x - tower.x, a.y - tower.y) - Math.hypot(b.x - tower.x, b.y - tower.y))[0];
        } else {
          // 'first'
          target = inRange.sort((a, b) => (b.distance || 0) - (a.distance || 0))[0];
        }

        if (target) {
          tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        }

        if (tower.cool <= 0 && target) {
          const bulletsStart = this.state.bullets.length;
          const aimAngle = tower.angle !== undefined ? tower.angle : Math.atan2(target.y - tower.y, target.x - tower.x);

          if (def.multiDir) {
            // Multi-directional Turrets (Side Turret, Fourway, Eightway, ALLSPIKER, Nova, Cyclone, Vortex)
            def.multiDir.forEach((offsetAngle) => {
              const shotAngle = aimAngle + offsetAngle;
              const vx = Math.cos(shotAngle);
              const vy = Math.sin(shotAngle);
              this.state.bullets.push({
                x: tower.x + vx * 15,
                y: tower.y + vy * 15,
                vx,
                vy,
                dmg: def.dmg,
                speed: def.bulletSpeed || 330,
                rangeLeft: def.range + 35,
                isSpikeTriangle: Boolean(def.isSpiker),
                r: def.isSpiker ? 5.5 : 4
              });
            });
          } else if (def.isTwinFlank) {
            // Twin Flank: 2 parallel forward shots and 2 parallel rear shots
            [0, Math.PI].forEach((baseAngle) => {
              const shotAngle = aimAngle + baseAngle;
              const fx = Math.cos(shotAngle);
              const fy = Math.sin(shotAngle);
              const px = -fy;
              const py = fx;
              [-5, 5].forEach((offset) => {
                this.state.bullets.push({
                  x: tower.x + px * offset + fx * 15,
                  y: tower.y + py * offset + fy * 15,
                  vx: fx,
                  vy: fy,
                  dmg: def.dmg,
                  speed: 350,
                  rangeLeft: def.range + 35,
                  isParallel: true,
                  r: 3.0
                });
              });
            });
          } else if (def.fanAngles) {
            // Fan Spread salvos (Flak Cannon, Spreadshot, Hydra, Trident)
            def.fanAngles.forEach((relAngle) => {
              const shotAngle = aimAngle + relAngle;
              const vx = Math.cos(shotAngle);
              const vy = Math.sin(shotAngle);
              this.state.bullets.push({
                x: tower.x + vx * 16,
                y: tower.y + vy * 16,
                vx,
                vy,
                dmg: def.dmg,
                speed: def.bulletSpeed || 350,
                rangeLeft: def.range + 35,
                isFanBullet: true,
                isTrident: Boolean(def.isTrident),
                isSpikeTriangle: Boolean(def.isTrident),
                isPiercing: Boolean(def.pierceCount && def.pierceCount > 1),
                pierceLeft: def.pierceCount || 1,
                r: def.bulletR || (def.isTrident ? 5.5 : 3.0)
              });
            });
          } else if (def.isRailgun) {
            // Penetrating laser beam railgun (Railgun: 1 blue laser, Double: 2 red lasers, Triple: 3 purple lasers)
            const fx = Math.cos(aimAngle);
            const fy = Math.sin(aimAngle);
            const px = -fy;
            const py = fx;
            const offsets = def.parallelShots || [0];

            offsets.forEach((offset) => {
              this.state.bullets.push({
                x: tower.x + px * offset + fx * 18,
                y: tower.y + py * offset + fy * 18,
                vx: fx,
                vy: fy,
                dmg: def.dmg,
                speed: def.bulletSpeed || 580,
                rangeLeft: def.range + 45,
                isRailgun: true,
                laserColor: def.laserColor || 'blue',
                isPiercing: true,
                pierceLeft: def.pierceCount || 4,
                r: 5.5
              });
            });
          } else if (def.parallelShots) {
            // Multi-barrel parallel volleys (Double, Triple, Quadruple, Penta, Double Spiker, Dual Thunder)
            const fx = Math.cos(aimAngle);
            const fy = Math.sin(aimAngle);
            const px = -fy;
            const py = fx;

            def.parallelShots.forEach((offset) => {
              this.state.bullets.push({
                x: tower.x + px * offset + fx * 15,
                y: tower.y + py * offset + fy * 15,
                vx: fx,
                vy: fy,
                dmg: def.dmg,
                speed: def.bulletSpeed || 350,
                rangeLeft: def.range + 35,
                isParallel: !def.isSpiker && !def.isDualThunder,
                isSpikeTriangle: Boolean(def.isSpiker),
                isDualThunder: Boolean(def.isDualThunder),
                r: def.bulletR || (def.isSpiker ? 5.0 : 3.0)
              });
            });
          } else if (def.isCitadel) {
            // Citadel: 12-point star fortress with 6 slow spikes + 6 machine gun bullets
            for (let i = 0; i < 6; i++) {
              const a = aimAngle + (i * Math.PI) / 3;
              const vx = Math.cos(a);
              const vy = Math.sin(a);
              this.state.bullets.push({
                x: tower.x + vx * 16,
                y: tower.y + vy * 16,
                vx,
                vy,
                dmg: def.dmg,
                speed: 175,
                rangeLeft: def.range + 35,
                isSpikeTriangle: true,
                r: 6.5
              });
            }
            for (let i = 0; i < 6; i++) {
              const a = aimAngle + Math.PI / 6 + (i * Math.PI) / 3;
              const vx = Math.cos(a);
              const vy = Math.sin(a);
              this.state.bullets.push({
                x: tower.x + vx * 16,
                y: tower.y + vy * 16,
                vx,
                vy,
                dmg: Math.round(def.dmg * 0.85),
                speed: 350,
                rangeLeft: def.range + 35,
                isBastionBullet: true,
                r: 4.5
              });
            }
          } else if (def.isBastion) {
            // Bastion: 3 spike triangles in 3 directions (0, 120, 240 deg), with a bullet in between each (60, 180, 300 deg)
            const spikeOffsets = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
            const bulletOffsets = [Math.PI / 3, Math.PI, (5 * Math.PI) / 3];

            // 1. Three slow spike triangles
            spikeOffsets.forEach((offsetAngle) => {
              const shotAngle = aimAngle + offsetAngle;
              const vx = Math.cos(shotAngle);
              const vy = Math.sin(shotAngle);
              this.state.bullets.push({
                x: tower.x + vx * 16,
                y: tower.y + vy * 16,
                vx,
                vy,
                dmg: def.dmg,
                speed: def.bulletSpeed || 175,
                rangeLeft: def.range + 35,
                isSpikeTriangle: true,
                r: 6.0
              });
            });

            // 2. Three energetic cannon bullets in between each spike shooter
            bulletOffsets.forEach((offsetAngle) => {
              const shotAngle = aimAngle + offsetAngle;
              const vx = Math.cos(shotAngle);
              const vy = Math.sin(shotAngle);
              this.state.bullets.push({
                x: tower.x + vx * 16,
                y: tower.y + vy * 16,
                vx,
                vy,
                dmg: Math.max(6, Math.round(def.dmg * 0.85)),
                speed: 340,
                rangeLeft: def.range + 35,
                isBastionBullet: true,
                r: 4.5
              });
            });
          } else if (def.isPiercingLance) {
            // Heavy armor-piercing kinetic lance (Ballista, Javelin)
            const fx = Math.cos(aimAngle);
            const fy = Math.sin(aimAngle);
            this.state.bullets.push({
              x: tower.x + fx * 16,
              y: tower.y + fy * 16,
              vx: fx,
              vy: fy,
              dmg: def.dmg,
              speed: def.bulletSpeed || 240,
              rangeLeft: def.range + 35,
              isSpikeTriangle: true,
              isPiercing: true,
              pierceLeft: def.pierceCount || 2,
              r: 6.5
            });
          } else if (def.isSpiker) {
            // Single Spiker forward slow triangle
            const fx = Math.cos(aimAngle);
            const fy = Math.sin(aimAngle);
            this.state.bullets.push({
              x: tower.x + fx * 16,
              y: tower.y + fy * 16,
              vx: fx,
              vy: fy,
              dmg: def.dmg,
              speed: def.bulletSpeed || 175,
              rangeLeft: def.range + 35,
              isSpikeTriangle: true,
              r: 5.5
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
          } else if (def.isGamma) {
            // Gamma Turret: Rapid-fire expanding radiation orb that grows larger and more damaging the further it goes
            const vx = Math.cos(aimAngle);
            const vy = Math.sin(aimAngle);
            this.state.bullets.push({
              x: tower.x + vx * 14,
              y: tower.y + vy * 14,
              vx,
              vy,
              baseDmg: def.dmg,
              dmg: def.dmg,
              speed: 340,
              rangeLeft: def.range + 30,
              maxRange: def.range + 30,
              distTraveled: 0,
              isGamma: true,
              initialR: 3.5,
              maxR: 16,
              r: 3.5
            });
          } else {
            // Standard, explosive, or cluster bullet
            this.state.bullets.push({
              x: tower.x,
              y: tower.y,
              target,
              dmg: def.dmg,
              speed: def.bulletSpeed || 330,
              burstShards: def.burstShards || 0,
              shardDmg: def.shardDmg || 0,
              isExplosive: Boolean(def.isExplosive),
              splashRadius: def.splashRadius || 0,
              splashDmg: def.splashDmg || 0
            });
          }
            if (tower.isVantage && tacticalConfig.get().vantagePadsEnabled) {
              for (let i = bulletsStart; i < this.state.bullets.length; i++) {
                this.state.bullets[i].isVantage = true;
              }
            }
            tower.cool = def.rate;
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

          // Gamma radiation pulse expands in size and power the further it travels
          if (bullet.isGamma) {
            const progress = Math.min(1.4, bullet.distTraveled / (bullet.maxRange || 240));
            bullet.r = bullet.initialR + progress * (bullet.maxR - bullet.initialR);
            bullet.dmg = Math.round(bullet.baseDmg + progress * 9);
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
            if (!enemy.dead && enemy.hp > 0) {
              const hitDist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
              if (hitDist <= (bullet.r || 4) + enemy.r) {
                if (bullet.isPiercing) {
                  bullet.hitEnemies = bullet.hitEnemies || [];
                  if (!bullet.hitEnemies.includes(enemy)) {
                    bullet.hitEnemies.push(enemy);
                    this.applyDamage(enemy, bullet.dmg, bullet);
                    bullet.pierceLeft = (bullet.pierceLeft || 1) - 1;
                    if (bullet.pierceLeft <= 0) {
                      bullet.dead = true;
                      break;
                    }
                  }
                } else {
                  this.applyDamage(enemy, bullet.dmg, bullet);
                  bullet.dead = true;
                  break;
                }
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
            this.applyDamage(target, bullet.dmg, bullet);
            bullet.dead = true;

            // Area of effect splash damage (Bombard, Colossus)
            if (bullet.isExplosive && bullet.splashRadius > 0) {
              for (const otherEnemy of this.state.enemies) {
                if (otherEnemy !== target && !otherEnemy.dead && otherEnemy.hp > 0) {
                  const splashDist = Math.hypot(otherEnemy.x - bullet.x, otherEnemy.y - bullet.y);
                  if (splashDist <= bullet.splashRadius + otherEnemy.r) {
                    const falloff = 1 - (splashDist / (bullet.splashRadius + otherEnemy.r)) * 0.5;
                    this.applyDamage(otherEnemy, Math.max(5, Math.round((bullet.splashDmg || bullet.dmg * 0.5) * falloff)), bullet);
                  }
                }
              }
            }

            // Explode into non-exploding outward shards if configured (Scatter = 5, Cluster = 10, Supercluster = 16)
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
      this.saveGame();
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
      this.saveGame();
    }

    // Periodic auto-save (every 3 seconds) for crash and termination safety
    this.autoSaveTimer = (this.autoSaveTimer || 0) + dt;
    if (this.autoSaveTimer >= 3.0) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }

    this.onUIUpdate();
  }

  handleCanvasClick(x, y, towerDefs) {
    if (!this.state || this.state.over) return;

    // Check if an existing tower was clicked
    const clickedTower = [...this.state.towers].reverse().find(
      (t) => Math.hypot(t.x - x, t.y - y) < 26
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

      // Check command deployment cap
      if (tacticalConfig.isCapReached(this.state.towers.length)) {
        const max = tacticalConfig.get().maxTowers;
        this.onMessage(`⚡ Command Cap Reached (${max}/${max})! Upgrade existing towers or sell.`);
        return;
      }

      // Calculate dynamic cost with duplicate surcharge
      const dynamicCost = tacticalConfig.calculateTowerCost(def.cost, type, this.state.towers);

      if (this.state.coins < dynamicCost) {
        this.onMessage(`Not enough coins! (${dynamicCost}🪙 required)`);
        return;
      }

      // Check vantage pad snapping
      let finalX = x;
      let finalY = y;
      let isVantage = false;
      const vantagePad = tacticalConfig.checkVantage(x, y, this.state.mapId);
      if (vantagePad) {
        finalX = vantagePad.x;
        finalY = vantagePad.y;
        isVantage = true;
      }

      // Check distance from all road segments
      const isOnRoad = isPointNearPath(finalX, finalY, path, 34);
      const isNearTower = this.state.towers.some((t) => Math.hypot(t.x - finalX, t.y - finalY) < 28);

      if (isOnRoad || isNearTower) {
        this.onMessage('Place towers on clear terrain or tactical vantage pads.');
        return;
      }

      this.state.coins -= dynamicCost;
      this.state.towers.push({
        id: this.nextTowerId++,
        x: finalX,
        y: finalY,
        type,
        cool: 0,
        angle: 0,
        isVantage
      });
      this.state.sel = this.state.towers.at(-1).id;
      this.state.build = null;
      this.onUIUpdate();
      this.saveGame();
      const vantageNotice = isVantage ? ` on ${vantagePad.name}! (+25% Range & +15% Dmg)` : ' placed!';
      this.onMessage(`${type}${vantageNotice}`);
      return;
    }

    // Deselect if clicked empty area
    this.state.sel = null;
    this.onUIUpdate();
  }

  sellTower(towerId, towerDefs) {
    if (!this.state || this.state.over) return;
    const index = this.state.towers.findIndex((t) => t.id === towerId);
    if (index === -1) return;
    const tower = this.state.towers[index];
    const def = towerDefs[tower.type];
    const refund = Math.floor((def?.cost || 80) * 0.7);
    this.state.coins += refund;
    this.state.towers.splice(index, 1);
    if (this.state.sel === towerId) this.state.sel = null;
    this.onUIUpdate();
    this.saveGame();
    this.onMessage(`Sold ${tower.type} (+${refund} 🪙)`);
  }

  cycleTargetMode(towerId) {
    if (!this.state) return;
    const tower = this.state.towers.find((t) => t.id === towerId);
    if (!tower) return;
    const modes = ['first', 'strongest', 'last', 'closest'];
    const curIdx = modes.indexOf(tower.targetMode || 'first');
    tower.targetMode = modes[(curIdx + 1) % modes.length];
    this.onUIUpdate();
    this.saveGame();
    this.onMessage(`Target: ${tower.targetMode.toUpperCase()}`);
  }
}
