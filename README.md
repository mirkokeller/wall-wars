# 🧱 Wall Wars

A fast-paced **2-player strategy board game** where you build walls, form rectangles, and score points. Built entirely with vanilla HTML5, CSS3, and JavaScript—no frameworks, no external dependencies.

👉 **[Play Wall Wars Online Now!](https://mirkokeller.github.io/wall-wars/)** 🚀

---

## 🎮 How to Play

1.  Open the **[Online Game Link](https://mirkokeller.github.io/wall-wars/)** in your browser.
2.  Enter the player names and click **GIOCA**.
3.  Choose your starting positions on the board edge.
4.  **Take turns**:
    *   **Roll the Dice**: Place walls (equal to the rolled number) connected to your existing network.
    *   **Place a Block**: Place a blocker block anywhere on the board to disrupt your opponent's path.
5.  **Score Points**: Form closed rectangles using your walls and the board borders.
6.  **Win**: The first player to reach **10 points** wins the match!

---

## 🎲 Core Rules

*   **Grid Size**: 6x6 grid.
*   **Dice**: 3-sided dice (D3).
*   **Connectivity**: Walls must be connected to your starting point or your existing wall network.
*   **Blocking**: You can opt to place 1 blocker block instead of rolling. Blocks prevent opponents from passing or closing shapes.
*   **Scoring**: Closing a shape scores points proportional to the closed area. A block inside or on the border of a shape prevents it from being scored.
*   *For a complete guide, read the full [Rulebook (rules.md)](rules.md).*

---

## 📂 Project Structure

```
├── index.html       # Main game page (HTML5 structure)
├── styles.css       # Neon dark-theme styling & responsive layout
├── game.js          # Game engine, state management, and Canvas rendering
├── rules.md         # Detailed game rules
└── README.md        # Project documentation
```

---

## 🛠️ Technology Stack

*   **Graphics**: HTML5 Canvas API for smooth, real-time board rendering and animations.
*   **Styling**: Vanilla CSS3 featuring a premium **neon-glow dark theme** with fluid transitions.
*   **Logic**: Pure, object-oriented ES6+ JavaScript for game state, dice rolling, connectivity checks, and scoring algorithms.
