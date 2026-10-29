import './style.css';
import { TOWER_DEFINITIONS, BASE_TOWERS } from './config.js';
import { GameModel } from './game.js';
import { renderGame } from './renderer.js';

const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');

let lastTime = 0;

function showMessage(text) {
  $('msg').textContent = text;
}

const game = new GameModel(showMessage, updateUI);

function updateUI() {
  const S = game.state;
  if (!S) return;

  $('coins').textContent = Math.floor(S.coins);
  $('gems').textContent = S.gems;
  $('stage').textContent = S.wave + 1;
  $('hp').textContent = S.hp;

  $('start').disabled = S.running;
  $('start').textContent = S.over
    ? 'Restart Game'
    : S.running
    ? 'Stage in progress'
    : 'Start Stage';

  $('boss').style.display = S.wave === 10 ? 'block' : 'none';

  const selectedTower = S.towers.find((t) => t.id === S.sel);
  if (selectedTower) {
    const def = TOWER_DEFINITIONS[selectedTower.type];
    $('selected').textContent = `Selected: ${selectedTower.type} · Damage ${def.dmg} · Range ${def.range}`;
  } else {
    $('selected').textContent = 'No tower selected';
  }

  // Render upgrade options
  $('upgrades').innerHTML = '';
  if (selectedTower) {
    const nextUpgrades = TOWER_DEFINITIONS[selectedTower.type].next || [];
    nextUpgrades.forEach((nextName) => {
      const upgradeDef = TOWER_DEFINITIONS[nextName];
      const btn = document.createElement('button');
      btn.textContent = `Upgrade to ${nextName} · ${upgradeDef.cost}`;
      btn.onclick = () => {
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

function renderSlotList() {
  $('slots').innerHTML = '';
  game.saves.forEach((saved, index) => {
    const btn = document.createElement('button');
    btn.className = game.activeSlot === index ? 'active' : '';
    btn.innerHTML = `Slot ${index + 1}<br><span class="small">${
      saved ? `Stage ${saved.wave + 1} · ${saved.coins} coins` : 'Empty'
    }</span>`;

    btn.onclick = () => {
      game.activeSlot = index;
      renderSlotList();
      $('slotinfo').textContent = saved
        ? `Stage ${saved.wave + 1} · ${saved.coins} coins · ${saved.gems} gems`
        : 'Empty slot — create a new game.';
    };
    $('slots').appendChild(btn);
  });
}

function renderShop() {
  $('shop').innerHTML = '';
  BASE_TOWERS.forEach((towerName) => {
    const btn = document.createElement('button');
    btn.textContent = `${towerName} · ${TOWER_DEFINITIONS[towerName].cost}`;
    btn.onclick = () => {
      if (!game.state) return;
      game.state.build = towerName;
      game.state.sel = null;
      updateUI();
      showMessage(`Tap clear grass to place ${towerName}.`);
    };
    $('shop').appendChild(btn);
  });
}

// Event Listeners
$('play').onclick = () => {
  game.loadSlot(game.activeSlot);
  $('home').style.display = 'none';
  $('game').style.display = 'block';
  renderShop();
  updateUI();
  showMessage('Build towers, then start the stage.');
};

$('del').onclick = () => {
  game.deleteSlot(game.activeSlot);
  renderSlotList();
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
