# Tower Defence Game

A lightweight, modular 2D Tower Defense game built with HTML5 Canvas, modern JavaScript (ES Modules), and Vite.

## 🎮 Features

- **Save Slots**: 3 distinct save/continue slots to manage game progress.
- **Towers & Upgrades**:
  - **Spammer** → Blaster → Rotary, Harpy → Thunder
  - **Scout** → Ace, Shotgun, Scatter
  - **Spiker** → Double Spiker → ALLSPIKER
  - **Double** → Triple → Quadruple
- **Wave Progression & Boss Battles**: 
  - Dynamic enemy waves with increasing speed and health.
  - Stage 10 Boss Encounter featuring a high-HP red pentagon boss.
- **Game Controls**: Variable speed toggling (1x, 2x, 3x), real-time base health tracking, coins, and gems rewards.
- **Range Preview**: Visual indicator highlighting the attack range of selected towers.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18+ recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

Start the local Vite development server with hot module replacement (HMR):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

To create an optimized production build in `dist/`:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```text
tower-defense-game-basic/
├── index.html            # Main HTML entry point
├── package.json          # Project configuration & scripts
├── src/
│   ├── config.js         # Tower stats, upgrade paths, map waypoints, canvas constants
│   ├── game.js           # Core state management, game logic, updates & targeting
│   ├── renderer.js       # HTML5 Canvas drawing routines & visuals
│   ├── main.js           # UI event listeners, slot management, and animation loop
│   └── style.css         # Styling for HUD, panels, buttons, and canvas layout
├── Tower_Defence_Game.html # Original standalone single-file prototype
└── README.md             # Project documentation
```

---

## 🕹️ How to Play

1. Pick an empty slot and click **Create / Continue Game**.
2. Select a tower from the build menu at the bottom.
3. Click on clear grass away from the stone path to place your tower.
4. Click **Start Stage** to unleash the wave.
5. Click on placed towers to view their stats and purchase upgrades when you have enough coins.
6. Survive the waves and defeat the Stage 10 Boss!
