import './style.css';
import { TOWER_DEFINITIONS, BASE_TOWERS, MAP_CONFIGS, getBossConfigForWave } from './config.js';
import { GameModel } from './game.js';
import { renderGame } from './renderer.js';
import { formatSaveTime } from './storage.js';

const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let lastRenderedTowerId = null;
let lastRenderedTowerType = null;
let pendingMapSlotIndex = 0;
let pendingDeleteSlotIndex = null;

function showMessage(text) {
  const msgEl = $('msg');
  if (msgEl) msgEl.textContent = text;
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

  $('start').disabled = S.running;
  $('start').textContent = S.over
    ? 'Restart Game'
    : S.running
    ? 'Stage in progress'
    : (S.autoStart && S.autoCountdown > 0)
    ? `Auto starting (${S.autoCountdown.toFixed(1)}s)...`
    : 'Start Stage';

  if ($('auto')) {
    $('auto').textContent = `Auto-Start: ${S.autoStart ? 'ON' : 'OFF'}`;
    $('auto').className = S.autoStart ? 'active' : '';
  }

  const isBossWave = S.wave % 10 === 0 && S.wave > 0;
  const hasActiveBoss = S.enemies.some((e) => e.boss && !e.dead);
  if ($('boss')) {
    if (isBossWave && (S.running || hasActiveBoss)) {
      const bossConfig = getBossConfigForWave(S.wave);
      $('boss').style.display = 'block';
      $('boss').textContent = `⚠️ BOSS BATTLE (STAGE ${S.wave}) — ${bossConfig.name.toUpperCase()}`;
    } else {
      $('boss').style.display = 'none';
    }
  }

  const selectedTower = S.towers.find((t) => t.id === S.sel);
  if (selectedTower) {
    const def = TOWER_DEFINITIONS[selectedTower.type];
    $('selected').textContent = `Selected: ${selectedTower.type} · Damage ${def.dmg} · Range ${def.range}`;
  } else {
    $('selected').textContent = 'No tower selected';
  }

  // Render upgrade options ONLY when selection changes or tower upgrades
  const currentTowerId = selectedTower ? selectedTower.id : null;
  const currentTowerType = selectedTower ? selectedTower.type : null;

  if (currentTowerId !== lastRenderedTowerId || currentTowerType !== lastRenderedTowerType) {
    lastRenderedTowerId = currentTowerId;
    lastRenderedTowerType = currentTowerType;

    $('upgrades').innerHTML = '';
    if (selectedTower) {
      const nextUpgrades = TOWER_DEFINITIONS[selectedTower.type].next || [];
      nextUpgrades.forEach((nextName) => {
        const upgradeDef = TOWER_DEFINITIONS[nextName];
        const btn = document.createElement('button');
        btn.textContent = `Upgrade to ${nextName} · ${upgradeDef.cost}`;
        btn.dataset.cost = upgradeDef.cost;
        btn.onclick = (e) => {
          e.stopPropagation();
          if (S.coins < upgradeDef.cost) {
            showMessage('Not enough coins!');
            return;
          }
          S.coins -= upgradeDef.cost;
          selectedTower.type = nextName;
          updateUI();
          game.saveGame();
          showMessage(`Upgraded to ${nextName}!`);
        };
        $('upgrades').appendChild(btn);
      });
    }
  }

  // Update disabled state for upgrade buttons in real time based on coin balance
  const upgradeButtons = $('upgrades').querySelectorAll('button');
  upgradeButtons.forEach((btn) => {
    const cost = Number(btn.dataset.cost);
    btn.disabled = S.coins < cost;
  });

  // Update disabled state for shop build buttons based on coin balance
  const shopButtons = $('shop').querySelectorAll('button');
  shopButtons.forEach((btn) => {
    const cost = Number(btn.dataset.cost);
    if (!isNaN(cost)) {
      btn.disabled = S.coins < cost;
    }
  });
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
  $('home').style.display = 'none';
  $('game').style.display = 'block';
  renderShop();
  updateUI();
  showMessage(`Welcome to ${game.getCurrentMap().name}! Build your towers.`);
}

function renderShop() {
  $('shop').innerHTML = '';
  BASE_TOWERS.forEach((towerName) => {
    const cost = TOWER_DEFINITIONS[towerName].cost;
    const btn = document.createElement('button');
    btn.textContent = `${towerName} · ${cost}`;
    btn.dataset.cost = cost;
    btn.onclick = () => {
      if (!game.state) return;
      game.state.build = towerName;
      game.state.sel = null;
      updateUI();
      showMessage(`Tap clear terrain to place ${towerName}.`);
    };
    $('shop').appendChild(btn);
  });
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

// Global escape key to close open modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideMapModal();
    hideDeleteConfirm();
  }
});

// Crash / Termination Persistence Listeners
window.addEventListener('beforeunload', () => {
  if (game.state) {
    game.saveGame();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state) {
    game.saveGame();
  }
});

// Game In-HUD Buttons
$('homebtn').onclick = () => {
  if (game.state) game.state.running = false;
  game.saveGame();
  renderSlotList();
  $('game').style.display = 'none';
  $('home').style.display = 'block';
};

$('speed').onclick = () => {
  game.cycleSpeed();
  $('speed').textContent = `Speed: ${game.state.speed}×`;
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

canvas.addEventListener('pointerdown', (ev) => {
  if (!game.state || $('game').style.display === 'none') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) * 720) / rect.width;
  const y = ((ev.clientY - rect.top) * 470) / rect.height;
  game.handleCanvasClick(x, y, TOWER_DEFINITIONS);
});

// Game loop
function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;

  game.update(dt, TOWER_DEFINITIONS);
  renderGame(ctx, game.state, TOWER_DEFINITIONS);

  requestAnimationFrame(gameLoop);
}

// Initialise
renderSlotList();
requestAnimationFrame(gameLoop);
