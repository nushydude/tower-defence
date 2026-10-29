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
- **Turrets & Upgrade Trees**:
  - **Spammer** → Blaster → Rotary, Harpy → Thunder
  - **Scout** → Ace, Shotgun, Scatter
  - **Spiker** → Double Spiker → ALLSPIKER
  - **Double** → Triple → Quadruple
  - 🆕 **Multi-Directional Turret Branch**:
    - **Side Turret**: Fires 2 simultaneous shots (front and back in opposite directions).
    - **Fourway**: Upgrades to 4 barrels firing in 4 perpendicular directions.
    - **Eightway**: Ultimate 8-barrel omni-turret firing across all 8 compass directions.
- **Wave Progression & Boss Battles**: 
  - Dynamic enemy waves with increasing speed and health along custom map paths.
  - Stage 10 Boss Encounter featuring a high-HP red pentagon boss.
- **Game Controls**: 
  - **Auto-Start**: Toggleable auto-start mode (`Auto-Start: ON / OFF`) that automatically launches successive rounds with a brief intermission countdown after clearing each wave.
  - **Speed**: Variable speed toggling (1x, 2x, 3x).
  - Real-time base health tracking, coins, and gems rewards.
- **Visuals**: Realistic rotating multi-barrel graphics on turrets and trajectory range previews.

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
│   ├── config.js         # Turret stats, multi-dir barrels, map themes, enemy definitions
│   ├── game.js           # Core state management, directional projectile physics & targeting
│   ├── renderer.js       # HTML5 Canvas drawing routines for turrets (barrels), enemies & maps
│   ├── main.js           # UI event listeners, shop, slot management, animation loop
│   └── style.css         # Styling for HUD, panels, buttons, map cards, and canvas
├── Tower_Defence_Game.html # Original standalone single-file prototype
└── README.md             # Project documentation
```

---

## 🕹️ How to Play

1. Pick an empty slot and click **Create Game**.
2. Select your desired map theme: **Grassland Plains**, **Desert Dunes**, or **Tropical Atoll**.
3. Purchase a starter turret such as **Side Turret**, **Spammer**, **Scout**, or **Double**.
4. Click on clear terrain away from the path to place your turret.
5. Click **Start Stage** to unleash the wave.
6. Upgrade the **Side Turret** to **Fourway** and then **Eightway** to cover multiple tracks simultaneously!
