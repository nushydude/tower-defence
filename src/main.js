import './style.css';
import {
  TOWER_DEFINITIONS,
  BASE_TOWERS,
  MAP_CONFIGS,
  TECH_TREE_BRANCHES,
  getBossConfigForWave
} from './config.js';
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
  $('start').disabled = S.running;
  $('start').textContent = S.over
    ? '🔄 Restart'
    : S.running
    ? `⚡ In Progress (${enemiesLeft} left)`
    : (S.autoStart && S.autoCountdown > 0)
    ? `⏳ Auto (${S.autoCountdown.toFixed(1)}s)`
    : `▶ Start Stage ${S.wave + 1}`;

  if ($('auto')) {
    $('auto').textContent = S.autoStart ? '⚡ Auto: ON' : 'Auto: OFF';
    $('auto').className = S.autoStart ? 'btn-hud-secondary active' : 'btn-hud-secondary';
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

  // Handle Selected Tower & Inspector View
  if (selectedTower) {
    const def = TOWER_DEFINITIONS[selectedTower.type];
    const branchName = def.branch || (def.isRailgun ? 'Laser Railgun' : 'Tactical');
    const sellRefund = Math.floor((def.cost || 80) * 0.7);
    const targetMode = (selectedTower.targetMode || 'first').toUpperCase();

    if (shopSection) shopSection.style.display = 'none';
    if (selectedEl) {
      selectedEl.style.display = 'block';
      selectedEl.innerHTML = `
        <div class="inspector-card">
          <div class="inspector-header">
            <div class="inspector-title-group">
              <span class="inspector-icon">${selectedTower.type.includes('Railgun') ? '⚡' : '🛡️'}</span>
              <div>
                <div class="inspector-title">${selectedTower.type}</div>
                <div class="inspector-subtitle">${branchName} Discipline</div>
              </div>
            </div>
            <button id="btn-deselect-tower" class="btn-deselect-icon" aria-label="Close Inspector">✕</button>
          </div>
          <div class="inspector-stats-grid">
            <div class="inspector-stat-box"><span class="lbl">DAMAGE</span><span class="val">💥 ${def.dmg}</span></div>
            <div class="inspector-stat-box"><span class="lbl">RANGE</span><span class="val">🎯 ${def.range}</span></div>
            <div class="inspector-stat-box"><span class="lbl">FIRE RATE</span><span class="val">⏱️ ${def.rate}s</span></div>
            <div class="inspector-stat-box"><span class="lbl">DPS</span><span class="val">⚡ ${(def.dmg / (def.rate || 0.5)).toFixed(1)}</span></div>
          </div>
          <div class="inspector-actions-row">
            <button id="btn-target-mode" class="btn-inspector-action btn-target-action">🎯 Target: ${targetMode}</button>
            <button id="btn-sell-tower" class="btn-inspector-action btn-sell-action">💰 Sell (+${sellRefund}🪙)</button>
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
    if (upgradesEl) upgradesEl.style.display = 'block';
  } else {
    if (shopSection) shopSection.style.display = 'block';
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
          const title = document.createElement('div');
          title.className = 'upgrades-header-title';
          title.textContent = `⚡ AVAILABLE UPGRADES (${nextUpgrades.length})`;
          upgradesEl.appendChild(title);

          const grid = document.createElement('div');
          grid.className = 'upgrades-grid';

          nextUpgrades.forEach((nextName) => {
            const upgradeDef = TOWER_DEFINITIONS[nextName];
            const currentDef = TOWER_DEFINITIONS[selectedTower.type];
            const dmgDiff = upgradeDef.dmg - currentDef.dmg;
            const btn = document.createElement('button');
            const isRail = nextName.includes('Railgun');
            btn.className = `upgrade-card ${isRail ? 'upgrade-card-railgun' : ''}`;
            btn.dataset.cost = upgradeDef.cost;

            btn.innerHTML = `
              <div class="upgrade-card-header">
                <span class="upgrade-name">${isRail ? '⚡ ' : ''}${nextName}</span>
                <span class="upgrade-cost">${upgradeDef.cost} 🪙</span>
              </div>
              <div class="upgrade-card-stats">
                <span class="stat-chip">💥 ${upgradeDef.dmg} (${dmgDiff >= 0 ? '+' : ''}${dmgDiff})</span>
                <span class="stat-chip">🎯 ${upgradeDef.range}</span>
                <span class="stat-chip">⏱️ ${upgradeDef.rate}s</span>
              </div>
              <div class="upgrade-card-hint">${isRail ? 'Fires penetrating laser beam' : (upgradeDef.branch ? `${upgradeDef.branch} discipline` : 'Advanced tactical enhancement')}</div>
            `;

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
            grid.appendChild(btn);
          });
          upgradesEl.appendChild(grid);
        } else {
          const maxedNotice = document.createElement('div');
          maxedNotice.className = 'maxed-branch-notice';
          maxedNotice.innerHTML = `⭐ <strong>Apex Discipline Reached</strong> · Fully upgraded!`;
          upgradesEl.appendChild(maxedNotice);
        }
      }
    }
  }

  // Update disabled state for upgrade buttons in real time based on coin balance
  if (upgradesEl) {
    const upgradeButtons = upgradesEl.querySelectorAll('button');
    upgradeButtons.forEach((btn) => {
      const cost = Number(btn.dataset.cost);
      btn.disabled = S.coins < cost;
    });
  }

  // Update disabled state and active build state for shop buttons
  const shopButtons = $('shop').querySelectorAll('button');
  shopButtons.forEach((btn, index) => {
    const cost = Number(btn.dataset.cost);
    if (!isNaN(cost)) {
      btn.disabled = S.coins < cost;
    }
    const towerName = BASE_TOWERS[index];
    if (towerName && S.build === towerName) {
      btn.classList.add('active-build');
    } else {
      btn.classList.remove('active-build');
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
  $('game').style.display = 'flex';
  renderShop();
  updateUI();
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
    btn.className = `turret-card ${isRail ? 'turret-card-railgun' : ''}`;
    btn.dataset.cost = cost;
    btn.dataset.tower = towerName;

    const kbd = `<span class="kbd-hint">${idx + 1}</span>`;

    btn.innerHTML = `
      <div class="card-header">
        <div class="card-icon-title">
          <span class="card-icon">${meta.icon}</span>
          <div>
            <div class="card-name">${kbd}${isRail ? '⚡ ' : ''}${towerName}</div>
            <div class="card-branch-tag">${meta.branch}</div>
          </div>
        </div>
        <div class="card-cost-badge">${cost} 🪙</div>
      </div>
      <div class="card-stats-row">
        <span class="stat-chip">💥 ${def.dmg}</span>
        <span class="stat-chip">🎯 ${def.range}</span>
        <span class="stat-chip">⏱️ ${def.rate}s</span>
      </div>
      <div class="card-perk-desc">${meta.perk}</div>
    `;

    btn.onclick = () => {
      if (!game.state) return;
      if (game.state.build === towerName) {
        game.state.build = null;
        updateUI();
        showMessage('Placement cancelled.');
        return;
      }
      game.state.build = towerName;
      game.state.sel = null;
      updateUI();
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

// Keyboard Shortcuts (Desktop PC & Hardware Keyboards)
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'Escape') {
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
  if (game.state && $('game').style.display !== 'none') {
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

// HiDPI Canvas Backing Resolution
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const targetW = Math.round(720 * dpr);
  const targetH = Math.round(470 * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
}

// Game loop
function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;

  game.update(dt, TOWER_DEFINITIONS);

  resizeCanvas();
  ctx.save();
  ctx.scale(canvas.width / 720, canvas.height / 470);
  renderGame(ctx, game.state, TOWER_DEFINITIONS);
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// Initialise
renderShop();
renderSlotList();
requestAnimationFrame(gameLoop);
