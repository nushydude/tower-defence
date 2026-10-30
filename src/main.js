import './style.css';
import { TOWER_DEFINITIONS, BASE_TOWERS, MAP_CONFIGS, getBossConfigForWave } from './config.js';
import { GameModel } from './game.js';
import { renderGame } from './renderer.js';

const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let lastRenderedTowerId = null;
let lastRenderedTowerType = null;

function showMessage(text) {
  $('msg').textContent = text;
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
  $('slots').innerHTML = '';
  game.saves.forEach((saved, index) => {
    const btn = document.createElement('button');
    btn.className = game.activeSlot === index ? 'active' : '';
    
    let slotSubtitle = 'Empty';
    if (saved) {
      const mapName = MAP_CONFIGS[saved.mapId]?.name.split(' ')[0] || 'Grassland';
      slotSubtitle = `${mapName} · Stg ${saved.wave + 1} · ${saved.coins}c`;
    }

    btn.innerHTML = `Slot ${index + 1}<br><span class="small">${slotSubtitle}</span>`;

    btn.onclick = () => {
      game.activeSlot = index;
      renderSlotList();
      hideMapSelection();

      if (saved) {
        const mapName = MAP_CONFIGS[saved.mapId]?.name || 'Grassland';
        $('slotinfo').textContent = `Stage ${saved.wave + 1} (${mapName}) · ${saved.coins} coins · ${saved.gems} gems`;
        $('play').textContent = 'Continue Game';
      } else {
        $('slotinfo').textContent = 'Empty slot — open to select a map and start.';
        $('play').textContent = 'Create Game';
      }
    };
    $('slots').appendChild(btn);
  });

  const activeSaved = game.saves[game.activeSlot];
  $('play').textContent = activeSaved ? 'Continue Game' : 'Create Game';
}

function showMapSelection() {
  $('target-slot-num').textContent = game.activeSlot + 1;
  const container = $('map-cards');
  container.innerHTML = '';

  Object.values(MAP_CONFIGS).forEach((map) => {
    const card = document.createElement('div');
    card.className = 'map-card';
    card.innerHTML = `
      <div class="map-icon">${map.icon}</div>
      <div class="map-title">${map.name}</div>
      <div class="map-desc">${map.description}</div>
    `;

    card.onclick = () => {
      startNewGameWithMap(map.id);
    };

    container.appendChild(card);
  });

  $('map-select').style.display = 'block';
}

function hideMapSelection() {
  $('map-select').style.display = 'none';
}

function startNewGameWithMap(mapId) {
  hideMapSelection();
  game.loadSlot(game.activeSlot, mapId);
  game.saveGame();
  enterGameScreen();
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

// Event Listeners
$('play').onclick = () => {
  const hasExistingSave = game.hasSave(game.activeSlot);
  if (hasExistingSave) {
    game.loadSlot(game.activeSlot);
    enterGameScreen();
  } else {
    showMapSelection();
  }
};

$('cancel-map-select').onclick = () => {
  hideMapSelection();
};

$('del').onclick = () => {
  game.deleteSlot(game.activeSlot);
  renderSlotList();
  hideMapSelection();
  $('slotinfo').textContent = 'Slot deleted.';
};

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
