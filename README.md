# 🧱 Wall Wars

A **2-player strategy board game** where you build walls to form rectangles and score points. Built with vanilla HTML, CSS, and JavaScript.

![Wall Wars](https://img.shields.io/badge/Players-2-blue) ![Status](https://img.shields.io/badge/Status-Playable-green) ![Tech](https://img.shields.io/badge/Tech-HTML%2FCSS%2FJS-orange)

## 🎮 How to Play

1. Open `index.html` in your browser
2. Enter player names and click **GIOCA**
3. Pick your starting positions on the board edge
4. Take turns: **roll the dice** to place walls, or **place a block** to stop your opponent
5. Close rectangles to score points — first to **10 wins!**

## 📁 Project Structure

```
game/
├── index.html    # Main game page
├── styles.css    # Dark neon theme & layout
├── game.js       # Game engine & canvas rendering
├── rules.md      # Complete game rules (English B2)
└── README.md     # This file
```

## 📖 Rules

See [rules.md](rules.md) for the complete rulebook.

**Quick summary:**
- 6×6 grid, 2 players, D3 dice
- Roll dice → place that many walls (connected to your network)
- Or place 1 block anywhere to disrupt your opponent
- Close rectangles with your walls + board edges = points (area)
- Blocks on the border or inside a rectangle prevent scoring
- First to 10 points wins

## 🛠️ Tech

- **HTML5 Canvas** for the game board
- **Vanilla CSS** with dark theme, neon glow effects
- **Pure JavaScript** — no frameworks, no dependencies
