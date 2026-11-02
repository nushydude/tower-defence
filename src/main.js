import './style.css';
import {
  TOWER_DEFINITIONS,
  BASE_TOWERS,
  MAP_CONFIGS,
  TECH_TREE_BRANCHES,
  getBossConfigForWave,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './config.js';
import { GameModel } from './game.js';
import { renderGame } from './renderer.js';
import { formatSaveTime } from './storage.js';
import { cloudStorage } from './cloudStorage.js';

const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let lastRenderedTowerId = null;
let lastRenderedTowerType = null;
let pendingMapSlotIndex = 0;
let pendingDeleteSlotIndex = null;

let msgFadeTimer = null;
function showMessage(text) {
  const msgEl = $('msg');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.classList.add('visible');
    clearTimeout(msgFadeTimer);
    msgFadeTimer = setTimeout(() => {
      msgEl.classList.remove('visible');
    }, 2400);
  }
}

// PWA update state & battle-safe guard
let pendingUpdateWorker = null;
let updateDismissed = false;

function showScreen(screen) {
  const homeEl = $('home');
  const gameEl = $('game');
  if (screen === 'game') {
    if (homeEl) {
      homeEl.classList.remove('active');
      homeEl.classList.add('hidden');
      homeEl.style.display = 'none';
    }
    if (gameEl) {
      gameEl.classList.remove('hidden');
      gameEl.classList.add('active');
      gameEl.style.display = ''; // Clear inline display so responsive CSS (grid on desktop, flex on mobile) takes effect
    }
  } else {
    if (gameEl) {
      gameEl.classList.remove('active');
      gameEl.classList.add('hidden');
      gameEl.style.display = 'none';
    }
    if (homeEl) {
      homeEl.classList.remove('hidden');
      homeEl.classList.add('active');
      homeEl.style.display = '';
    }
  }
}

function isGameActive() {
  const gameRunning = game && game.state && game.state.running && !game.state.over;
  const gameEl = $('game');
  const inGameScreen = Boolean(gameEl && gameEl.classList.contains('active') && gameEl.style.display !== 'none');
  return Boolean(gameRunning && inGameScreen);
}

function checkAndShowUpdatePrompt() {
  const banner = $('pwa-update-banner');
  if (!banner) return;
  if (!pendingUpdateWorker || updateDismissed || isGameActive()) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'flex';
}

const game = new GameModel(showMessage, updateUI);

function updateUI() {
  const S = game.state;
  if (!S) return;

  const currentMap = game.getCurrentMap();

  $('coins').textContent = Math.floor(S.coins);
  $('gems').textContent = S.gems;
  $('stage').textContent = S.wave + 1;
  $('hp').textContent = S.hp;
  $('active-map-name').textContent = currentMap.name.split(' ')[0];

  const enemiesLeft = S.enemies ? S.enemies.filter((e) => !e.dead).length : 0;
  
  // Update prominent central elevated Start button in bottom nav
  const startBtn = $('start');
  if (startBtn) {
    startBtn.disabled = S.running;
    let icon = '▶';
    let text = `WAVE ${S.wave + 1}`;
    if (S.over) {
      icon = '🔄';
      text = 'RETRY';
    } else if (S.running) {
      icon = '⚡';
      text = `${enemiesLeft}`;
    } else if (S.autoStart && S.autoCountdown > 0) {
      icon = '⏳';
      text = `${S.autoCountdown.toFixed(0)}s`;
    }
    startBtn.innerHTML = `
      <span class="start-btn-icon">${icon}</span>
      <span class="start-btn-text">${text}</span>
    `;
  }

  // Update Combat Intel Radar Bar
  const intelWaveText = $('intel-wave-text');
  const intelEnemyCount = $('intel-enemy-count');
  const intelProgressBar = $('intel-progress-bar');
  if (intelWaveText && intelEnemyCount && intelProgressBar) {
    if (S.over) {
      intelWaveText.textContent = 'DEFENCE BREACHED';
      intelEnemyCount.textContent = 'Mission Over';
      intelProgressBar.style.width = '100%';
      intelProgressBar.style.backgroundColor = '#ef4444';
    } else if (S.running) {
      const isBoss = S.wave % 10 === 0 && S.wave > 0;
      intelWaveText.textContent = isBoss ? `⚠️ BOSS ASSAULT` : `STAGE ${S.wave + 1} COMBAT`;
      intelEnemyCount.textContent = `${enemiesLeft} active`;
      const progress = S.total > 0 ? Math.min(100, Math.round(((S.total - enemiesLeft) / S.total) * 100)) : 0;
      intelProgressBar.style.width = `${progress}%`;
      intelProgressBar.style.backgroundColor = isBoss ? '#ec4899' : '#38bdf8';
    } else {
      intelWaveText.textContent = `STAGE ${S.wave + 1} READY`;
      intelEnemyCount.textContent = (S.autoStart && S.autoCountdown > 0) ? `Auto in ${S.autoCountdown.toFixed(1)}s` : 'Prep Phase';
      intelProgressBar.style.width = '0%';
      intelProgressBar.style.backgroundColor = '#10b981';
    }
  }

  // Update Floating Canvas HUD (Auto & Speed)
  if ($('auto')) {
    $('auto').textContent = S.autoStart ? '⚡ Auto' : 'Auto';
    if (S.autoStart) {
      $('auto').classList.add('active');
    } else {
      $('auto').classList.remove('active');
    }
  }

  if ($('speed')) {
    $('speed').textContent = `${S.speed || 1}×`;
  }

  const isBossWave = S.wave % 10 === 0 && S.wave > 0;
  const hasActiveBoss = S.enemies.some((e) => e.boss && !e.dead);
  if ($('boss')) {
    if (isBossWave && (S.running || hasActiveBoss)) {
      const bossConfig = getBossConfigForWave(S.wave);
      $('boss').style.display = 'block';
      $('boss').textContent = `⚠️ BOSS (STAGE ${S.wave}) — ${bossConfig.name.toUpperCase()}`;
    } else {
      $('boss').style.display = 'none';
    }
  }

  const selectedTower = S.towers.find((t) => t.id === S.sel);
  const selectedEl = $('selected');
  const upgradesEl = $('upgrades');
  const shopSection = $('shop-section');
  const buildAlert = $('build-alert');

  // Sync Bottom Navigation active tab indicator
  const navArsenal = $('nav-tab-arsenal');
  const navTower = $('nav-tab-tower');
  if (navArsenal && navTower) {
    if (selectedTower) {
      navArsenal.classList.remove('active');
      navTower.classList.add('active');
    } else {
      navArsenal.classList.add('active');
      navTower.classList.remove('active');
    }
  }

  // Handle Active Build Alert
  if (buildAlert) {
    if (S.build) {
      const bDef = TOWER_DEFINITIONS[S.build];
      buildAlert.style.display = 'flex';
      buildAlert.innerHTML = `
        <div class="build-alert-info">
          <span class="pulsing-radar">⚡</span>
          <span>Deploying <strong>${S.build}</strong> (${bDef?.cost || 0}🪙) · Tap map terrain</span>
        </div>
        <button id="btn-cancel-build" class="btn-cancel-mini" aria-label="Cancel placement">✕ Cancel</button>
      `;
      const cancelBtn = $('btn-cancel-build');
      if (cancelBtn) {
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          S.build = null;
          updateUI();
          showMessage('Placement cancelled.');
        };
      }
    } else {
      buildAlert.style.display = 'none';
      buildAlert.innerHTML = '';
    }
  }

  // Handle Selected Tower & Compact Inspector View
  if (selectedTower) {
    const def = TOWER_DEFINITIONS[selectedTower.type];
    const branchName = def.branch || (def.isRailgun ? 'Laser' : 'Tactical');
    const sellRefund = Math.floor((def.cost || 80) * 0.7);
    const targetMode = (selectedTower.targetMode || 'first').toUpperCase();

    if (shopSection) shopSection.style.display = 'none';
    if (selectedEl) {
      selectedEl.style.display = 'flex';
      selectedEl.innerHTML = `
        <div class="compact-inspector-bar">
          <div class="inspector-summary">
            <span class="inspector-icon">${selectedTower.type.includes('Railgun') ? '⚡' : '🛡️'}</span>
            <div class="inspector-info">
              <div class="inspector-name-row">
                <span class="inspector-name">${selectedTower.type}</span>
                <span class="inspector-tag">${branchName}</span>
              </div>
              <div class="inspector-chips">
                <span class="chip">💥${def.dmg}</span>
                <span class="chip">🎯${def.range}</span>
                <span class="chip">⏱️${def.rate}s</span>
                <span class="chip">⚡${(def.dmg / (def.rate || 0.5)).toFixed(0)}dps</span>
              </div>
            </div>
          </div>
          <div class="inspector-actions">
            <button id="btn-target-mode" class="mini-inspector-btn mini-btn-target" title="Target Priority">🎯 ${targetMode}</button>
            <button id="btn-sell-tower" class="mini-inspector-btn mini-btn-sell" title="Sell for 70% refund">💰 +${sellRefund}🪙</button>
            <button id="btn-deselect-tower" class="mini-inspector-btn mini-btn-close" aria-label="Close Inspector">✕</button>
          </div>
        </div>
      `;

      const deselectBtn = $('btn-deselect-tower');
      if (deselectBtn) {
        deselectBtn.onclick = (e) => {
          e.stopPropagation();
          S.sel = null;
          updateUI();
        };
      }
      const targetBtn = $('btn-target-mode');
      if (targetBtn) {
        targetBtn.onclick = (e) => {
          e.stopPropagation();
          game.cycleTargetMode(selectedTower.id);
        };
      }
      const sellBtn = $('btn-sell-tower');
      if (sellBtn) {
        sellBtn.onclick = (e) => {
          e.stopPropagation();
          game.sellTower(selectedTower.id, TOWER_DEFINITIONS);
        };
      }
    }
    if (upgradesEl) upgradesEl.style.display = 'flex';
  } else {
    if (shopSection) shopSection.style.display = 'flex';
    if (selectedEl) {
      selectedEl.style.display = 'none';
      selectedEl.innerHTML = '';
    }
    if (upgradesEl) {
      upgradesEl.style.display = 'none';
      upgradesEl.innerHTML = '';
    }
  }

  // Render upgrade options ONLY when selection changes or tower upgrades
  const currentTowerId = selectedTower ? selectedTower.id : null;
  const currentTowerType = selectedTower ? selectedTower.type : null;

  if (currentTowerId !== lastRenderedTowerId || currentTowerType !== lastRenderedTowerType) {
    lastRenderedTowerId = currentTowerId;
    lastRenderedTowerType = currentTowerType;

    if (upgradesEl) {
      upgradesEl.innerHTML = '';
      if (selectedTower) {
        const nextUpgrades = TOWER_DEFINITIONS[selectedTower.type].next || [];
        if (nextUpgrades.length > 0) {
          const scrollWrap = document.createElement('div');
          scrollWrap.className = 'upgrades-horizontal-scroll';

          nextUpgrades.forEach((nextName) => {
            const upgradeDef = TOWER_DEFINITIONS[nextName];
            const currentDef = TOWER_DEFINITIONS[selectedTower.type];
            const dmgDiff = upgradeDef.dmg - currentDef.dmg;
            const btn = document.createElement('button');
            const isRail = nextName.includes('Railgun');
            btn.className = `upgrade-dock-card ${isRail ? 'upgrade-card-railgun' : ''}`;
            btn.dataset.cost = upgradeDef.cost;

            btn.innerHTML = `
              <div class="upgrade-dock-top">
                <span class="upgrade-dock-name">${isRail ? '⚡ ' : ''}${nextName}</span>
                <span class="upgrade-dock-cost">${upgradeDef.cost}🪙</span>
              </div>
              <div class="upgrade-dock-bottom">
                <span class="stat-pill-mini">💥 ${upgradeDef.dmg} (${dmgDiff >= 0 ? '+' : ''}${dmgDiff})</span>
                <span class="stat-pill-mini">🎯 ${upgradeDef.range}</span>
              </div>
            `;

            btn.onclick = (e) => {
              e.stopPropagation();
              if (S.coins < upgradeDef.cost) {
                const needed = upgradeDef.cost - Math.floor(S.coins);
                showMessage(`Need ${needed} more 🪙 to upgrade to ${nextName}!`);
                btn.classList.remove('card-shake');
                void btn.offsetWidth;
                btn.classList.add('card-shake');
                return;
              }
              S.coins -= upgradeDef.cost;
              selectedTower.type = nextName;
              updateUI();
              game.saveGame();
              showMessage(`Upgraded to ${nextName}!`);
            };
            scrollWrap.appendChild(btn);
          });
          upgradesEl.appendChild(scrollWrap);
        } else {
          const maxedNotice = document.createElement('div');
          maxedNotice.className = 'maxed-branch-dock';
          maxedNotice.innerHTML = `⭐ <strong>Apex Discipline Reached</strong> · Fully upgraded!`;
          upgradesEl.appendChild(maxedNotice);
        }
      }
    }
  }

  // Update affordable state for upgrade buttons in real time based on coin balance
  if (upgradesEl) {
    const upgradeButtons = upgradesEl.querySelectorAll('button');
    upgradeButtons.forEach((btn) => {
      const cost = Number(btn.dataset.cost);
      const canAfford = !isNaN(cost) && S.coins >= cost;
      btn.classList.toggle('unaffordable', !canAfford);
      btn.classList.toggle('affordable', canAfford);
      btn.disabled = false;
      btn.setAttribute('aria-disabled', String(!canAfford));
    });
  }

  // Update affordable/unaffordable and active build state for shop buttons
  const shopButtons = $('shop').querySelectorAll('.turret-dock-card');
  shopButtons.forEach((btn, index) => {
    const cost = Number(btn.dataset.cost);
    const canAfford = !isNaN(cost) && S.coins >= cost;
    btn.classList.toggle('unaffordable', !canAfford);
    btn.classList.toggle('affordable', canAfford);
    // Never disable button with native disabled attribute to prevent event suppression and blackout
    btn.disabled = false;
    btn.setAttribute('aria-disabled', String(!canAfford));

    const costBadge = btn.querySelector('.dock-card-cost');
    if (costBadge) {
      if (!canAfford) {
        costBadge.title = `Need ${cost - Math.floor(S.coins)} more 🪙`;
      } else {
        costBadge.removeAttribute('title');
      }
    }

    const towerName = BASE_TOWERS[index];
    if (towerName && S.build === towerName) {
      btn.classList.add('active-build');
    } else {
      btn.classList.remove('active-build');
    }
  });

  // If a pending PWA update was delayed during battle, safely prompt now that wave is finished
  if (!S.running) {
    checkAndShowUpdatePrompt();
  }
}

function renderSlotList() {
  const container = $('slots');
  if (!container) return;
  container.innerHTML = '';

  game.saves.forEach((saved, index) => {
    const isTargetSlot = game.activeSlot === index;
    const card = document.createElement('div');
    card.className = `slot-card ${saved ? 'slot-card-occupied' : 'slot-card-empty'} ${isTargetSlot ? 'slot-active-target' : ''}`;

    if (saved) {
      const map = MAP_CONFIGS[saved.mapId] || MAP_CONFIGS.grassland;
      const stage = saved.wave + 1;
      const isBossNext = stage % 10 === 0;
      const hp = Math.max(0, Math.min(100, saved.hp ?? 100));
      const hpColor = hp > 60 ? '#10b981' : hp > 30 ? '#fbbf24' : '#ef4444';
      const towersCount = Array.isArray(saved.towers) ? saved.towers.length : 0;
      const coins = Math.floor(saved.coins ?? 300);
      const gems = saved.gems ?? 0;
      const saveTime = formatSaveTime(saved.lastSaved);

      card.innerHTML = `
        <div>
          <div class="slot-top-row">
            <span class="slot-index-badge">SLOT ${index + 1}</span>
            <span class="slot-badge-chip ${isBossNext ? 'chip-boss' : 'chip-active'}">
              ${isBossNext ? '⚠️ BOSS NEXT' : 'ACTIVE'}
            </span>
          </div>

          <div class="slot-map-header">
            <span class="slot-map-icon">${map.icon}</span>
            <div>
              <div class="slot-map-name">${map.name}</div>
              <div class="small" style="color: #38bdf8; font-weight: 700;">Stage ${stage}</div>
            </div>
          </div>

          <div class="slot-stats-grid">
            <div class="slot-stat-item">
              <div class="slot-stat-label">Base Health</div>
              <div class="slot-stat-value" style="color: ${hpColor}">${hp}%</div>
              <div class="hp-bar-track">
                <div class="hp-bar-fill" style="width: ${hp}%; background: ${hpColor};"></div>
              </div>
            </div>

            <div class="slot-stat-item">
              <div class="slot-stat-label">Defenses</div>
              <div class="slot-stat-value">🏰 ${towersCount} ${towersCount === 1 ? 'Tower' : 'Towers'}</div>
            </div>

            <div class="slot-stat-item">
              <div class="slot-stat-label">Coins</div>
              <div class="slot-stat-value" style="color: #fbbf24">🪙 ${coins}</div>
            </div>

            <div class="slot-stat-item">
              <div class="slot-stat-label">Gems</div>
              <div class="slot-stat-value" style="color: #60a5fa">💎 ${gems}</div>
            </div>
          </div>

          <div class="slot-save-time">🕒 Saved ${saveTime}</div>
        </div>

        <div class="slot-actions-row">
          <button class="btn-resume">▶ Resume Mission</button>
          <button class="btn-slot-delete">🗑️ Delete Save</button>
        </div>
      `;

      const btnResume = card.querySelector('.btn-resume');
      btnResume.onclick = () => {
        game.loadSlot(index);
        enterGameScreen();
      };

      const btnDelete = card.querySelector('.btn-slot-delete');
      btnDelete.onclick = (e) => {
        e.stopPropagation();
        showDeleteConfirm(index);
      };
    } else {
      card.innerHTML = `
        <div class="empty-icon-wrap">+</div>
        <div class="empty-title">Slot ${index + 1} — Empty</div>
        <div class="empty-desc">No garrison deployed. Select this slot to initialize a new campaign.</div>
        <button class="btn-primary" style="margin-top: 8px; width: 100%;">+ Deploy New Outpost</button>
      `;

      const btnNew = card.querySelector('.btn-primary');
      btnNew.onclick = () => {
        showMapModal(index);
      };
    }

    container.appendChild(card);
  });
}

function showMapModal(slotIndex) {
  pendingMapSlotIndex = slotIndex;
  $('target-slot-num').textContent = slotIndex + 1;
  const container = $('map-cards');
  container.innerHTML = '';

  const mapKeys = ['crossroads', 'grassland', 'desert'];
  mapKeys.forEach((mapKey) => {
    const map = MAP_CONFIGS[mapKey];
    if (!map) return;
    const card = document.createElement('div');
    card.className = 'map-card';
    card.innerHTML = `
      <div class="map-icon">${map.icon}</div>
      <div class="map-title">${map.name}</div>
      <div class="map-desc">${map.description}</div>
    `;

    card.onclick = () => {
      startNewGameWithMap(pendingMapSlotIndex, map.id);
    };

    container.appendChild(card);
  });

  $('map-modal').style.display = 'flex';
}

function hideMapModal() {
  $('map-modal').style.display = 'none';
}

function startNewGameWithMap(slotIndex, mapId) {
  hideMapModal();
  game.loadSlot(slotIndex, mapId);
  game.saveGame();
  renderSlotList();
  enterGameScreen();
}

function showDeleteConfirm(slotIndex) {
  pendingDeleteSlotIndex = slotIndex;
  $('delete-slot-num').textContent = slotIndex + 1;

  const saved = game.saves[slotIndex];
  if (saved) {
    const map = MAP_CONFIGS[saved.mapId] || MAP_CONFIGS.grassland;
    const stage = saved.wave + 1;
    const towersCount = Array.isArray(saved.towers) ? saved.towers.length : 0;
    const coins = Math.floor(saved.coins ?? 0);

    $('delete-modal-details').innerHTML = `
      Are you sure you want to delete <strong>Slot ${slotIndex + 1}</strong> (${map.name}, Stage ${stage})?
      <br><br>
      You will lose <strong>${towersCount} deployed towers</strong>, <strong>${coins} coins</strong>, and all campaign progress.
    `;
  } else {
    $('delete-modal-details').textContent = `Are you sure you want to clear Slot ${slotIndex + 1}?`;
  }

  $('delete-modal').style.display = 'flex';
}

function hideDeleteConfirm() {
  $('delete-modal').style.display = 'none';
  pendingDeleteSlotIndex = null;
}

function enterGameScreen() {
  lastRenderedTowerId = null;
  lastRenderedTowerType = null;
  showScreen('game');
  renderShop();
  updateUI();
  resizeCanvas();
  showMessage(`Welcome to ${game.getCurrentMap().name}! Build your towers.`);
}

const TOWER_METADATA = {
  Spammer: { icon: '⚡', branch: 'Rapid', perk: 'Continuous rapid stream' },
  Scout: { icon: '🎯', branch: 'Sniper', perk: 'Long sight single shots' },
  Railgun: { icon: '⚡', branch: 'Laser', perk: 'Piercing blue laser beam' },
  Shotgun: { icon: '💥', branch: 'Spread', perk: 'Multi-pellet heavy spread' },
  Double: { icon: '⚔️', branch: 'Twin', perk: 'Twin synchronized barrels' },
  'Side Turret': { icon: '🔄', branch: 'Flank', perk: 'Multi-angle omni coverage' },
  Spiker: { icon: '❇️', branch: 'Spike', perk: 'Omni-directional thorn burst' }
};

function renderShop() {
  const shopEl = $('shop');
  if (!shopEl) return;
  shopEl.innerHTML = '';
  BASE_TOWERS.forEach((towerName, idx) => {
    const def = TOWER_DEFINITIONS[towerName];
    const cost = def.cost;
    const meta = TOWER_METADATA[towerName] || { icon: '🛡️', branch: 'Tactical', perk: 'Combat turret' };
    const btn = document.createElement('button');
    const isRail = towerName === 'Railgun';
    btn.className = `turret-dock-card ${isRail ? 'turret-card-railgun' : ''}`;
    btn.dataset.cost = cost;
    btn.dataset.tower = towerName;
    btn.title = `${towerName} (${cost}🪙): 💥${def.dmg} 🎯${def.range} ⏱️${def.rate}s — ${meta.perk}`;

    const dps = (def.dmg / (def.rate || 0.5)).toFixed(0);
    btn.innerHTML = `
      <div class="dock-card-leading">
        <span class="dock-card-icon">${meta.icon}</span>
        <span class="dock-card-num">${idx + 1}</span>
      </div>
      <div class="dock-card-body">
        <div class="dock-card-title-row">
          <span class="dock-card-name">${isRail ? '⚡ ' : ''}${towerName}</span>
          <span class="dock-card-role">${meta.branch}</span>
        </div>
        <div class="dock-card-stats-preview">
          <span class="micro-stat stat-dmg" title="Damage">💥 ${def.dmg}</span>
          <span class="micro-stat stat-rng" title="Range">🎯 ${def.range}</span>
          <span class="micro-stat stat-rate" title="Attack Period">⏱️ ${def.rate}s</span>
          <span class="micro-stat stat-dps" title="Damage Per Second">⚡ ${dps}/s</span>
        </div>
      </div>
      <div class="dock-card-trailing">
        <div class="dock-card-cost">${cost}🪙</div>
      </div>
    `;

    btn.onmouseenter = () => {
      const intelEl = $('desktop-intel-text');
      if (intelEl) {
        const coins = game.state ? Math.floor(game.state.coins) : 0;
        const canAfford = coins >= cost;
        const needed = Math.max(0, cost - coins);
        const statusBadge = canAfford
          ? `<span style="color:#34d399; font-weight:800; background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.35); padding:1px 6px; border-radius:4px;">✓ READY TO DEPLOY</span>`
          : `<span style="color:#f87171; font-weight:800; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); padding:1px 6px; border-radius:4px;">⚠️ NEED ${needed} MORE 🪙</span>`;

        intelEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#f8fafc; font-size:12px;">${isRail ? '⚡ ' : ''}${towerName} (${cost}🪙)</strong>
            ${statusBadge}
          </div>
          <div style="color:#38bdf8; font-weight:750; font-size:11px; margin-bottom:2px;">
            💥 ${def.dmg} Damage · 🎯 ${def.range} Range · ⏱️ ${def.rate}s Speed · ⚡ ${dps} DPS
          </div>
          <div style="color:#94a3b8; font-size:10px;">Branch: <span style="color:#cbd5e1; font-weight:700;">${meta.branch}</span> — ${meta.perk}</div>
        `;
      }
    };

    btn.onmouseleave = () => {
      const intelEl = $('desktop-intel-text');
      if (intelEl) {
        if (game.state && game.state.build) {
          const bName = game.state.build;
          const bDef = TOWER_DEFINITIONS[bName];
          intelEl.innerHTML = `<strong style="color:#facc15">DEPLOYING ${bName.toUpperCase()}</strong> (${bDef?.cost || 0}🪙) · Tap any clear grass on the map to place!`;
        } else {
          intelEl.textContent = 'Hover or select any turret to inspect combat stats and specialization perks.';
        }
      }
    };

    btn.onclick = () => {
      if (!game.state) return;
      if (game.state.coins < cost) {
        const needed = cost - Math.floor(game.state.coins);
        showMessage(`Need ${needed} more 🪙 to deploy ${towerName}!`);
        btn.classList.remove('card-shake');
        void btn.offsetWidth;
        btn.classList.add('card-shake');
        return;
      }
      if (game.state.build === towerName) {
        game.state.build = null;
        updateUI();
        const intelEl = $('desktop-intel-text');
        if (intelEl) intelEl.textContent = 'Hover or select any turret to inspect combat stats and specialization perks.';
        showMessage('Placement cancelled.');
        return;
      }
      game.state.build = towerName;
      game.state.sel = null;
      updateUI();
      const intelEl = $('desktop-intel-text');
      if (intelEl) {
        intelEl.innerHTML = `<strong style="color:#facc15">DEPLOYING ${towerName.toUpperCase()}</strong> (${cost}🪙) · Tap any clear grass on the map to place!`;
      }
      showMessage(`Tap clear terrain to place ${towerName} (${cost}🪙)`);
    };
    shopEl.appendChild(btn);
  });
}

function showTechTree() {
  const container = $('techtree-content');
  if (!container) return;
  container.innerHTML = '';

  TECH_TREE_BRANCHES.forEach((b) => {
    const card = document.createElement('div');
    card.className = `techtree-card ${b.root === 'Railgun' ? 'techtree-card-railgun' : ''}`;

    let contentHtml = `
      <div>
        <div class="techtree-header">
          <span class="techtree-icon">${b.icon}</span>
          <span class="techtree-title">${b.name}</span>
          ${b.badge ? `<span class="techtree-badge">${b.badge}</span>` : ''}
        </div>
        <div class="techtree-desc">${b.description}</div>
    `;

    if (b.chain) {
      contentHtml += `<div class="techtree-chain">`;
      b.chain.forEach((step, idx) => {
        contentHtml += `
          <div class="techtree-step">
            <div>
              <strong>${idx + 1}. ${step.name}</strong>
              <div class="small" style="color: ${b.color}; font-weight: 600;">${step.desc}</div>
            </div>
            <span class="techtree-cost">${step.cost}c</span>
          </div>
        `;
      });
      contentHtml += `</div>`;
    } else if (b.sublines) {
      contentHtml += `<div class="techtree-chain">`;
      b.sublines.forEach((sub) => {
        contentHtml += `
          <div class="techtree-subline">
            <strong>${sub.name}:</strong> ${sub.towers.join(' → ')}
          </div>
        `;
      });
      contentHtml += `</div>`;
    }

    contentHtml += `</div>`;
    card.innerHTML = contentHtml;
    container.appendChild(card);
  });

  const modal = $('techtree-modal');
  if (modal) modal.style.display = 'flex';
}

function hideTechTree() {
  const modal = $('techtree-modal');
  if (modal) modal.style.display = 'none';
}

// Tech Tree Modal Listeners
if ($('hero-techtree-btn')) $('hero-techtree-btn').onclick = showTechTree;
if ($('hero-techtree-banner-btn')) $('hero-techtree-banner-btn').onclick = showTechTree;
if ($('game-techtree-btn')) $('game-techtree-btn').onclick = showTechTree;
if ($('close-techtree-btn')) $('close-techtree-btn').onclick = hideTechTree;
if ($('cancel-techtree-x')) $('cancel-techtree-x').onclick = hideTechTree;
if ($('techtree-modal')) {
  $('techtree-modal').onclick = (e) => {
    if (e.target === $('techtree-modal')) hideTechTree();
  };
}

// Map Modal Listeners
$('cancel-map-select').onclick = hideMapModal;
$('cancel-map-select-x').onclick = hideMapModal;
$('map-modal').onclick = (e) => {
  if (e.target === $('map-modal')) hideMapModal();
};

// Delete Modal Listeners
$('cancel-delete-btn').onclick = hideDeleteConfirm;
$('delete-modal').onclick = (e) => {
  if (e.target === $('delete-modal')) hideDeleteConfirm();
};

$('confirm-delete-btn').onclick = () => {
  if (pendingDeleteSlotIndex !== null) {
    const slotNum = pendingDeleteSlotIndex + 1;
    game.deleteSlot(pendingDeleteSlotIndex);
    renderSlotList();
    hideDeleteConfirm();
    showMessage(`Slot ${slotNum} deleted.`);
  }
};

// =========================================================
// CLOUD ACCOUNT & STATE PERSISTENCE SYSTEM
// =========================================================

let resendCountdownTimer = null;
let resendSecondsRemaining = 60;
let activeAuthEmail = '';

function updateCloudUI(cloudState) {
  const pillBtn = $('cloud-account-btn');
  const pillLabel = $('cloud-pill-label');
  const saveIndicator = $('save-status-indicator');

  if (!pillBtn) return;

  // Auto-detection: Only display if backend is configured and working!
  if (!cloudState.status.enabled) {
    pillBtn.style.display = 'none';
    if (saveIndicator) {
      saveIndicator.innerHTML = '<span class="pulse-dot"></span> Storage Active';
    }
    return;
  }

  // Backend is enabled & wired up!
  pillBtn.style.display = 'inline-flex';

  if (cloudState.isLoggedIn && cloudState.user) {
    const emailPrefix = cloudState.user.email.split('@')[0];
    pillBtn.classList.remove('syncing');
    pillBtn.classList.add('synced');
    if (cloudState.syncState === 'syncing') {
      pillBtn.classList.add('syncing');
      if (pillLabel) pillLabel.textContent = `${emailPrefix} · Syncing...`;
    } else {
      if (pillLabel) pillLabel.textContent = `${emailPrefix} · Synced ✓`;
    }
    if (saveIndicator) {
      saveIndicator.innerHTML = '<span class="pulse-dot" style="background:#10b981; box-shadow:0 0 8px #10b981;"></span> Cloud Active';
    }
  } else {
    pillBtn.classList.remove('synced', 'syncing');
    if (pillLabel) pillLabel.textContent = 'Cloud Save';
    if (saveIndicator) {
      saveIndicator.innerHTML = '<span class="pulse-dot"></span> Storage Active';
    }
  }
}

function openAccountModal() {
  const modal = $('account-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  const cloudState = cloudStorage.getState();
  if (cloudState.isLoggedIn && cloudState.user) {
    showAccountView('profile');
    const profileEmail = $('profile-email-display');
    if (profileEmail) profileEmail.textContent = cloudState.user.email;
    const badge = $('profile-sync-badge');
    if (badge) {
      badge.textContent = cloudState.syncState === 'syncing' ? '⏳ Syncing with Cloud...' : '☁️ Synced with Cloud';
    }
    const lastSyncEl = $('profile-last-sync');
    if (lastSyncEl) {
      lastSyncEl.textContent = cloudState.lastSynced ? `Saved ${formatSaveTime(cloudState.lastSynced)}` : 'Just now';
    }
  } else {
    showAccountView('login');
    const emailInput = $('auth-email-input');
    if (emailInput) {
      emailInput.value = '';
      setTimeout(() => emailInput.focus(), 100);
    }
  }
}

function closeAccountModal() {
  const modal = $('account-modal');
  if (!modal) return;
  modal.style.display = 'none';
  clearInterval(resendCountdownTimer);
}

function showAccountView(view) {
  const loginView = $('account-login-view');
  const verifyView = $('account-verify-view');
  const profileView = $('account-profile-view');
  const emailErr = $('auth-email-error');
  const verifyErr = $('auth-verify-error');

  if (emailErr) emailErr.style.display = 'none';
  if (verifyErr) verifyErr.style.display = 'none';

  if (loginView) loginView.style.display = view === 'login' ? 'flex' : 'none';
  if (verifyView) verifyView.style.display = view === 'verify' ? 'flex' : 'none';
  if (profileView) profileView.style.display = view === 'profile' ? 'flex' : 'none';
}

function startResendCountdown() {
  clearInterval(resendCountdownTimer);
  resendSecondsRemaining = 60;
  const resendBtn = $('resend-code-btn');
  const timerSpan = $('resend-timer-sec');
  if (resendBtn) resendBtn.disabled = true;
  if (timerSpan) timerSpan.textContent = '60';

  resendCountdownTimer = setInterval(() => {
    resendSecondsRemaining--;
    if (timerSpan) timerSpan.textContent = String(resendSecondsRemaining);
    if (resendSecondsRemaining <= 0) {
      clearInterval(resendCountdownTimer);
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = '🔄 Resend Code';
      }
    }
  }, 1000);
}

// Modal Trigger
if ($('cloud-account-btn')) {
  $('cloud-account-btn').onclick = openAccountModal;
}
if ($('close-account-modal-x')) {
  $('close-account-modal-x').onclick = closeAccountModal;
}
if ($('close-account-modal-btn')) {
  $('close-account-modal-btn').onclick = closeAccountModal;
}
if ($('account-modal')) {
  $('account-modal').onclick = (e) => {
    if (e.target === $('account-modal')) closeAccountModal();
  };
}

// Form A: Send Verification Code
const authEmailForm = $('auth-email-form');
if (authEmailForm) {
  authEmailForm.onsubmit = (e) => {
    e.preventDefault();
    const emailInput = $('auth-email-input');
    const emailErr = $('auth-email-error');
    const sendBtn = $('send-code-btn');
    const email = (emailInput?.value || '').trim();

    if (!email || !email.includes('@')) {
      if (emailErr) {
        emailErr.textContent = 'Please enter a valid email address.';
        emailErr.style.display = 'block';
      }
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = '⚡ Dispatching Code...';
    if (emailErr) emailErr.style.display = 'none';

    cloudStorage.sendTacticalCode(email)
      .then((data) => {
        activeAuthEmail = email;
        const display = $('verify-email-display');
        if (display) display.textContent = email;
        showAccountView('verify');
        const codeInput = $('auth-code-input');
        if (codeInput) {
          codeInput.value = data?.devCode || '';
          setTimeout(() => codeInput.focus(), 100);
        }
        startResendCountdown();
        if (data?.devCode) {
          showMessage(`Passcode: ${data.devCode} (Dev Mode)`);
        } else {
          showMessage('Tactical code dispatched! Check your inbox.');
        }
      })
      .catch((err) => {
        if (emailErr) {
          emailErr.textContent = err.message || 'Failed to dispatch code.';
          emailErr.style.display = 'block';
        }
      })
      .finally(() => {
        sendBtn.disabled = false;
        sendBtn.textContent = '⚡ Send Tactical Code';
      });
  };
}

// Form B: Verify OTP Code
const authVerifyForm = $('auth-verify-form');
if (authVerifyForm) {
  authVerifyForm.onsubmit = (e) => {
    e.preventDefault();
    const codeInput = $('auth-code-input');
    const verifyErr = $('auth-verify-error');
    const verifyBtn = $('verify-code-btn');
    const code = (codeInput?.value || '').trim();

    if (code.length < 6) {
      if (verifyErr) {
        verifyErr.textContent = 'Please enter the full 6-digit passcode.';
        verifyErr.style.display = 'block';
      }
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Authorizing...';
    if (verifyErr) verifyErr.style.display = 'none';

    cloudStorage.verifyTacticalCode(activeAuthEmail, code, (mergedSaves) => {
      game.saves = mergedSaves;
      renderSlotList();
    })
      .then((result) => {
        clearInterval(resendCountdownTimer);
        showAccountView('profile');
        const profileEmail = $('profile-email-display');
        if (profileEmail) profileEmail.textContent = result.user.email;
        const badge = $('profile-sync-badge');
        if (badge) badge.textContent = '☁️ Synced with Cloud';
        const lastSync = $('profile-last-sync');
        if (lastSync) lastSync.textContent = 'Just now';
        renderSlotList();
        showMessage(`Welcome Commander ${result.user.email}! Cloud saves synchronized.`);
      })
      .catch((err) => {
        if (verifyErr) {
          verifyErr.textContent = err.message || 'Verification failed.';
          verifyErr.style.display = 'block';
        }
      })
      .finally(() => {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✓ Authorize & Synchronize';
      });
  };
}

// Resend Code Listener
const resendCodeBtn = $('resend-code-btn');
if (resendCodeBtn) {
  resendCodeBtn.onclick = () => {
    if (resendSecondsRemaining <= 0 && activeAuthEmail) {
      resendCodeBtn.disabled = true;
      cloudStorage.sendTacticalCode(activeAuthEmail)
        .then(() => {
          showMessage('New authorization code dispatched.');
          startResendCountdown();
        })
        .catch((err) => {
          const verifyErr = $('auth-verify-error');
          if (verifyErr) {
            verifyErr.textContent = err.message;
            verifyErr.style.display = 'block';
          }
        });
    }
  };
}

// Change Email Listener
const changeEmailBtn = $('change-email-btn');
if (changeEmailBtn) {
  changeEmailBtn.onclick = () => {
    clearInterval(resendCountdownTimer);
    showAccountView('login');
  };
}

// Force Sync Listener
const manualSyncBtn = $('manual-sync-btn');
if (manualSyncBtn) {
  manualSyncBtn.onclick = () => {
    manualSyncBtn.disabled = true;
    manualSyncBtn.textContent = 'Syncing...';
    cloudStorage.syncWithCloud((mergedSaves) => {
      game.saves = mergedSaves;
      renderSlotList();
    })
      .then(() => {
        showMessage('Cloud saves synchronized.');
        const lastSync = $('profile-last-sync');
        if (lastSync) lastSync.textContent = 'Just now';
      })
      .catch((err) => {
        showMessage(`Sync error: ${err.message}`);
      })
      .finally(() => {
        manualSyncBtn.disabled = false;
        manualSyncBtn.textContent = '🔄 Force Sync Now';
      });
  };
}

// Sign Out Listener
const signOutBtn = $('sign-out-btn');
if (signOutBtn) {
  signOutBtn.onclick = () => {
    cloudStorage.signOut();
    showAccountView('login');
    renderSlotList();
    showMessage('Signed out. Local guest mode active.');
  };
}

// Keyboard Shortcuts (Desktop PC & Hardware Keyboards)
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'Escape') {
    if ($('account-modal') && $('account-modal').style.display === 'flex') {
      closeAccountModal();
      return;
    }
    if ($('techtree-modal') && $('techtree-modal').style.display === 'flex') {
      hideTechTree();
      return;
    }
    if ($('map-modal') && $('map-modal').style.display === 'flex') {
      hideMapModal();
      return;
    }
    if ($('delete-modal') && $('delete-modal').style.display === 'flex') {
      hideDeleteConfirm();
      return;
    }
    if (game.state && (game.state.sel || game.state.build)) {
      game.state.sel = null;
      game.state.build = null;
      updateUI();
      showMessage('Selection cleared.');
      return;
    }
  }

  // Active Game screen controls
  if (game.state && $('game').classList.contains('active')) {
    if (e.code === 'Space') {
      e.preventDefault();
      game.startStage();
      updateUI();
      return;
    }
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      game.toggleAutoStart();
      updateUI();
      return;
    }
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      game.cycleSpeed();
      $('speed').textContent = `Speed: ${game.state.speed}×`;
      return;
    }
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      if ($('techtree-modal') && $('techtree-modal').style.display === 'flex') {
        hideTechTree();
      } else {
        showTechTree();
      }
      return;
    }

    // Number keys 1-7 for base towers
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= BASE_TOWERS.length) {
      e.preventDefault();
      const towerName = BASE_TOWERS[num - 1];
      const def = TOWER_DEFINITIONS[towerName];
      if (game.state.coins >= def.cost) {
        if (game.state.build === towerName) {
          game.state.build = null;
          updateUI();
          showMessage('Placement cancelled.');
        } else {
          game.state.build = towerName;
          game.state.sel = null;
          updateUI();
          showMessage(`[${num}] Tap clear terrain to place ${towerName}.`);
        }
      } else {
        showMessage(`Not enough coins for ${towerName} (${def.cost}c needed).`);
      }
      return;
    }
  }
});

// Page Visibility & Auto-save on Backgrounding
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state) {
    game.saveGame();
  }
});

// =========================================================
// PAGE RELOAD CONFIRMATION & TERMINATION SAFETY GUARD
// =========================================================
let bypassReloadConfirmation = false;

window.addEventListener('beforeunload', (e) => {
  // Always persist state to storage on exit or reload
  if (game && game.state) {
    try {
      game.saveGame();
    } catch (err) {
      console.warn('Could not auto-save on beforeunload:', err);
    }
  }

  if (bypassReloadConfirmation) return;

  // Modern browser standard for showing reload confirmation prompt
  e.preventDefault();
  e.returnValue = '';
  return '';
});

// Game In-HUD Buttons & Bottom Navigation
$('homebtn').onclick = () => {
  if (game.state) game.state.running = false;
  game.saveGame();
  renderSlotList();
  showScreen('home');
  checkAndShowUpdatePrompt();
};

$('speed').onclick = () => {
  game.cycleSpeed();
  updateUI();
};

if ($('auto')) {
  $('auto').onclick = () => {
    game.toggleAutoStart();
    updateUI();
  };
}

$('start').onclick = () => {
  game.startStage();
};

if ($('nav-tab-arsenal')) {
  $('nav-tab-arsenal').onclick = () => {
    if (!game.state) return;
    game.state.sel = null;
    updateUI();
  };
}

if ($('nav-tab-tower')) {
  $('nav-tab-tower').onclick = () => {
    if (!game.state) return;
    if (game.state.towers.length > 0) {
      if (!game.state.sel) {
        game.state.sel = game.state.towers[game.state.towers.length - 1].id;
        game.state.build = null;
        updateUI();
      }
    } else {
      showMessage('No towers deployed yet! Tap Arsenal to build one.');
    }
  };
}

canvas.addEventListener('pointerdown', (ev) => {
  if (!game.state || !$('game').classList.contains('active')) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) * CANVAS_WIDTH) / rect.width;
  const y = ((ev.clientY - rect.top) * CANVAS_HEIGHT) / rect.height;
  game.handleCanvasClick(x, y, TOWER_DEFINITIONS);
});

// HiDPI Canvas Backing Resolution (1:1 physical pixel density for razor-sharp rendering)
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
}

// Game loop
function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;

  if (game.state && $('game').classList.contains('active')) {
    game.update(dt, TOWER_DEFINITIONS);

    resizeCanvas();
    ctx.save();
    ctx.scale(canvas.width / CANVAS_WIDTH, canvas.height / CANVAS_HEIGHT);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    renderGame(ctx, game.state, TOWER_DEFINITIONS);
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

// Initialise
renderShop();
renderSlotList();
cloudStorage.subscribe(updateCloudUI);
cloudStorage.init((mergedSaves) => {
  game.saves = mergedSaves;
  renderSlotList();
});
requestAnimationFrame(gameLoop);

// =========================================================
// PROGRESSIVE WEB APP (PWA): SMART UPDATE SYSTEM & INSTALL
// =========================================================

function setupUpdateListeners(reg) {
  function handleWaitingWorker(worker) {
    if (!worker) return;
    pendingUpdateWorker = worker;
    // Check if safe to display immediately (not in active battle)
    checkAndShowUpdatePrompt();
  }

  // Check if an updated worker is already waiting in the background
  if (reg.waiting) {
    handleWaitingWorker(reg.waiting);
  }

  // Listen for new worker installing in the background
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // A new version is ready and waiting
        handleWaitingWorker(newWorker);
      }
    });
  });

  // Periodically check for updates every 15 minutes
  setInterval(() => {
    reg.update().catch(() => {});
  }, 15 * 60 * 1000);

  // Check for updates when app regains focus or comes back from background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reg.update().catch(() => {});
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('PWA Service Worker active:', reg.scope);
      setupUpdateListeners(reg);
    }).catch((err) => {
      console.warn('PWA SW registration notice:', err);
    });
  });

  // When new SW activates and claims control, reload cleanly with new version
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    bypassReloadConfirmation = true;
    window.location.reload();
  });
}

// Banner action buttons
const btnUpdateReload = $('btn-update-reload');
if (btnUpdateReload) {
  btnUpdateReload.onclick = () => {
    if (pendingUpdateWorker) {
      bypassReloadConfirmation = true;
      if (game) game.saveGame();
      btnUpdateReload.disabled = true;
      btnUpdateReload.textContent = 'Updating...';
      pendingUpdateWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };
}

const btnUpdateDismiss = $('btn-update-dismiss');
if (btnUpdateDismiss) {
  btnUpdateDismiss.onclick = () => {
    updateDismissed = true;
    const banner = $('pwa-update-banner');
    if (banner) banner.style.display = 'none';
  };
}

// PWA Install Prompt Handler & Standalone Mode Detection
let deferredInstallPrompt = null;
const installBtn = $('btn-install-pwa');

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
  document.body.classList.add('pwa-standalone');
  if (installBtn) installBtn.style.display = 'none';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn && !isStandalone) {
    installBtn.style.display = 'inline-flex';
  }
});

if (installBtn) {
  installBtn.onclick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showMessage('Installing Tower Defence Outpost...');
      }
      deferredInstallPrompt = null;
      installBtn.style.display = 'none';
    } else {
      // iOS Safari guide
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        showMessage('To install on iPhone/iPad: Tap Share ⎋ and choose "Add to Home Screen" ⊞');
      } else {
        showMessage('To install: Use your browser menu (⋮) and tap "Install App" or "Add to Home screen".');
      }
    }
  };
}

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installBtn) installBtn.style.display = 'none';
  showMessage('App installed! Launch from home screen for full-screen gameplay.');
});
