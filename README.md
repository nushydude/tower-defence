# Tower Defence Game

A lightweight, modular 2D Tower Defense game built with HTML5 Canvas, modern JavaScript (ES Modules), and Vite.

## 🎮 Features

- **Save Slots & Map Selection**:
  - 3 distinct save/continue slots to manage game progress.
  - When opening an empty slot, choose from **3 unique themed maps**:
    - 🌱 **Grassland Plains**: Classic lush green terrain with winding stone pathways.
    - 🏜️ **Desert Dunes**: Scorching golden dunes and canyon pathways.
    - 🏝️ **Tropical Atoll**: Deep blue waters surrounding an island and wooden boardwalk trail.
- **Diverse Enemy Roster**:
  - 🟦 **Blue Squares (Rounds 1+)**: Standard slow units to build early economy.
  - 🔺 **Purple Triangles (Rounds 3+)**: Agile, fast-moving speedsters pointing towards their movement trajectory.
  - ⬡ **Amber Hexagons (Rounds 5+)**: Heavy armored tanks that take reduced damage and deal extra damage if reaching base.
  - 🔷 **Emerald Diamonds (Rounds 7+)**: High-speed, high-health elite threats.
  - 🛑 **Red Pentagon Boss (Round 10)**: Massive slow titan with 2,200 HP and huge bounty rewards.
- **Towers & Upgrades**:
  - **Spammer** → Blaster → Rotary, Harpy → Thunder
  - **Scout** → Ace, Shotgun, Scatter
  - **Spiker** → Double Spiker → ALLSPIKER
  - **Double** → Triple → Quadruple
- **Wave Progression & Boss Battles**: 
  - Dynamic enemy waves with increasing speed and health along custom map paths.
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
├── index.html            # Main HTML entry point & map selector UI
├── package.json          # Project configuration & scripts
├── src/
│   ├── config.js         # Tower stats, upgrade paths, map themes, enemy definitions
│   ├── game.js           # Core state management, save slots, enemy wave logic & spawning
│   ├── renderer.js       # HTML5 Canvas drawing routines for enemies (shapes & rotation), maps & towers
│   ├── main.js           # UI event listeners, slot management, map picker, animation loop
│   └── style.css         # Styling for HUD, panels, buttons, map cards, and canvas
├── Tower_Defence_Game.html # Original standalone single-file prototype
└── README.md             # Project documentation
```

---

## 🕹️ How to Play

1. Pick an empty slot and click **Create Game**.
2. Select your desired map theme: **Grassland Plains**, **Desert Dunes**, or **Tropical Atoll**.
3. Select a tower from the build menu at the bottom.
4. Click on clear terrain away from the path to place your tower.
5. Click **Start Stage** to unleash the wave.
6. Click on placed towers to view their stats and purchase upgrades when you have enough coins.
7. Prepare for fast purple triangles at Wave 3, armored amber hexagons at Wave 5, emerald elites at Wave 7, and defeat the Stage 10 Boss!
