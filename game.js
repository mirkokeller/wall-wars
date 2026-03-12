/* ==========================================
   WALL WARS — Game Engine
   ========================================== */

// ============ CONSTANTS ============
const GRID = 6;
const DOTS = GRID + 1; // 7
const CELL = 80;
const PAD = 40;
const CANVAS_SIZE = PAD * 2 + GRID * CELL; // 560
const DOT_R = 4;
const WALL_W = 6;
const HIT_DIST = 25;
const WIN_SCORE = 10;
const DICE_MAX = 3;

// Edge types
const EMPTY = 0, P1 = 1, P2 = 2, BLK = 3, BORDER = -1;

// Game phases
const Phase = {
    SETUP_POS_A: 'setup_pos_a',
    SETUP_POS_B: 'setup_pos_b',
    CHOOSE: 'choose',
    ROLLING: 'rolling',
    PLACING_WALLS: 'placing_walls',
    PLACING_BLOCK: 'placing_block',
    GAME_OVER: 'game_over',
};

// Colors
const C = {
    BG: '#0f1520',
    GRID: 'rgba(255,255,255,0.04)',
    BORDER_W: 'rgba(255,255,255,0.20)',
    BORDER_GLOW: 'rgba(255,255,255,0.06)',
    DOT: 'rgba(255,255,255,0.30)',
    DOT_BORDER: 'rgba(255,255,255,0.55)',
    P1: '#00d4ff',
    P1_GLOW: 'rgba(0,212,255,0.30)',
    P1_FILL: 'rgba(0,212,255,0.10)',
    P1_START: 'rgba(0,212,255,0.7)',
    P2: '#ff3399',
    P2_GLOW: 'rgba(255,51,153,0.30)',
    P2_FILL: 'rgba(255,51,153,0.10)',
    P2_START: 'rgba(255,51,153,0.7)',
    BLOCK: '#ff8c00',
    BLOCK_GLOW: 'rgba(255,140,0,0.25)',
    HOVER_OK: 'rgba(255,255,255,0.35)',
    HOVER_NO: 'rgba(255,60,60,0.15)',
};

// ============ HELPERS ============
function isCorner(r, c) {
    return (r === 0 || r === GRID) && (c === 0 || c === GRID);
}

// ============ STATE ============
let hEdges = [];    // [DOTS][GRID] — horizontal edges
let vEdges = [];    // [GRID][DOTS] — vertical edges
let players = [];
let currentPlayer = 0;
let phase = Phase.SETUP_POS_A;
let wallsLeft = 0;
let diceVal = 0;
let scoredRects = new Set();
let hovered = null; // { type: 'h'|'v'|'dot', row, col }
let firstPlayerIdx = 0;
let animFrame = 0;

// DOM Elements
let canvas, ctx;
let elStartScreen, elGameScreen, elVictoryScreen;
let elP1Name, elP2Name, elStartBtn;
let elP1Score, elP2Score, elP1Bar, elP2Bar;
let elP1Panel, elP2Panel;
let elP1DisplayName, elP2DisplayName;
let elTurnDot, elTurnText, elActionMsg;
let elDiceArea, elDice;
let elWallsCounter, elWallsNum;
let elActionBtns, elBtnRoll, elBtnBlock, elBtnEndTurn;
let elScorePopup, elPopupPoints;
let elVictoryTitle, elVictorySub, elFinalScores, elBtnRestart;

// ============ INITIALIZATION ============
function init() {
    // Cache DOM
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    elStartScreen = document.getElementById('start-screen');
    elGameScreen = document.getElementById('game-screen');
    elVictoryScreen = document.getElementById('victory-screen');

    elP1Name = document.getElementById('p1-name');
    elP2Name = document.getElementById('p2-name');
    elStartBtn = document.getElementById('start-btn');

    elP1Score = document.getElementById('p1-score');
    elP2Score = document.getElementById('p2-score');
    elP1Bar = document.getElementById('p1-bar');
    elP2Bar = document.getElementById('p2-bar');
    elP1Panel = document.getElementById('p1-panel');
    elP2Panel = document.getElementById('p2-panel');
    elP1DisplayName = document.getElementById('p1-display-name');
    elP2DisplayName = document.getElementById('p2-display-name');

    elTurnDot = document.getElementById('turn-dot');
    elTurnText = document.getElementById('turn-text');
    elActionMsg = document.getElementById('action-message');

    elDiceArea = document.getElementById('dice-area');
    elDice = document.getElementById('dice');

    elWallsCounter = document.getElementById('walls-counter');
    elWallsNum = document.getElementById('walls-num');

    elActionBtns = document.getElementById('action-buttons');
    elBtnRoll = document.getElementById('btn-roll');
    elBtnBlock = document.getElementById('btn-block');
    elBtnEndTurn = document.getElementById('btn-end-turn');

    elScorePopup = document.getElementById('score-popup');
    elPopupPoints = document.getElementById('popup-points');

    elVictoryTitle = document.getElementById('victory-title');
    elVictorySub = document.getElementById('victory-subtitle');
    elFinalScores = document.getElementById('final-scores');
    elBtnRestart = document.getElementById('btn-restart');

    // Event listeners
    elStartBtn.addEventListener('click', startGame);
    elBtnRestart.addEventListener('click', () => {
        showScreen('start');
    });
    elBtnRoll.addEventListener('click', rollDice);
    elBtnBlock.addEventListener('click', startBlockPlacement);
    elBtnEndTurn.addEventListener('click', endTurn);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', () => { hovered = null; render(); });
    canvas.addEventListener('click', onCanvasClick);

    // Start render loop
    requestAnimationFrame(gameLoop);
}

function gameLoop(time) {
    animFrame = time;
    render();
    requestAnimationFrame(gameLoop);
}

// ============ SCREEN MANAGEMENT ============
function showScreen(name) {
    elStartScreen.classList.toggle('active', name === 'start');
    elGameScreen.classList.toggle('active', name === 'game');
    elVictoryScreen.classList.toggle('active', name === 'game_over');
}

// ============ GAME START ============
function startGame() {
    const n1 = elP1Name.value.trim() || 'Giocatore 1';
    const n2 = elP2Name.value.trim() || 'Giocatore 2';

    // Init board
    hEdges = [];
    for (let r = 0; r < DOTS; r++) {
        hEdges[r] = [];
        for (let c = 0; c < GRID; c++) {
            hEdges[r][c] = (r === 0 || r === GRID) ? BORDER : EMPTY;
        }
    }
    vEdges = [];
    for (let r = 0; r < GRID; r++) {
        vEdges[r] = [];
        for (let c = 0; c < DOTS; c++) {
            vEdges[r][c] = (c === 0 || c === GRID) ? BORDER : EMPTY;
        }
    }

    // Random first player
    firstPlayerIdx = Math.random() < 0.5 ? 0 : 1;

    players = [
        { name: n1, startDot: null, dots: new Set(), score: 0, color: 'p1' },
        { name: n2, startDot: null, dots: new Set(), score: 0, color: 'p2' },
    ];

    currentPlayer = firstPlayerIdx;
    scoredRects = new Set();
    wallsLeft = 0;
    diceVal = 0;
    hovered = null;

    elP1DisplayName.textContent = n1;
    elP2DisplayName.textContent = n2;
    updateScores();

    showScreen('game');
    setPhase(Phase.SETUP_POS_A);
}

// ============ PHASE MANAGEMENT ============
function setPhase(p) {
    phase = p;
    elActionBtns.style.display = 'none';
    elBtnEndTurn.style.display = 'none';
    elDiceArea.style.display = 'none';
    elWallsCounter.style.display = 'none';
    elDice.className = 'dice';

    const cpName = players[currentPlayer].name;
    const cpColor = currentPlayer === 0 ? 'p1' : 'p2';

    // Turn dot color
    elTurnDot.className = 'turn-dot ' + cpColor + '-turn';

    // Panel highlighting
    elP1Panel.classList.toggle('active-panel', currentPlayer === 0);
    elP2Panel.classList.toggle('active-panel', currentPlayer === 1);

    switch (p) {
        case Phase.SETUP_POS_A:
            elTurnText.textContent = `${players[firstPlayerIdx].name}`;
            elActionMsg.textContent = `Scegli la posizione di partenza (clicca un punto sul bordo)`;
            currentPlayer = firstPlayerIdx;
            elTurnDot.className = 'turn-dot ' + (firstPlayerIdx === 0 ? 'p1' : 'p2') + '-turn';
            elP1Panel.classList.toggle('active-panel', firstPlayerIdx === 0);
            elP2Panel.classList.toggle('active-panel', firstPlayerIdx === 1);
            break;

        case Phase.SETUP_POS_B: {
            const secondIdx = 1 - firstPlayerIdx;
            currentPlayer = secondIdx;
            elTurnText.textContent = `${players[secondIdx].name}`;
            elActionMsg.textContent = `Scegli la posizione di partenza (clicca un punto sul bordo)`;
            elTurnDot.className = 'turn-dot ' + (secondIdx === 0 ? 'p1' : 'p2') + '-turn';
            elP1Panel.classList.toggle('active-panel', secondIdx === 0);
            elP2Panel.classList.toggle('active-panel', secondIdx === 1);
            break;
        }

        case Phase.CHOOSE:
            elTurnText.textContent = `Turno di ${cpName}`;
            elActionMsg.textContent = `Scegli: tira il dado o piazza un blocco`;
            elActionBtns.style.display = 'flex';
            break;

        case Phase.PLACING_WALLS:
            elTurnText.textContent = `Turno di ${cpName}`;
            elActionMsg.textContent = `Piazza i tuoi muri sulla griglia`;
            elDiceArea.style.display = 'flex';
            elDice.textContent = diceVal;
            elDice.className = 'dice result-' + cpColor;
            elWallsCounter.style.display = 'flex';
            elWallsNum.textContent = wallsLeft;
            break;

        case Phase.PLACING_BLOCK:
            elTurnText.textContent = `Turno di ${cpName}`;
            elActionMsg.textContent = `Clicca su un bordo libero per piazzare il blocco`;
            break;

        case Phase.GAME_OVER:
            showVictory();
            break;
    }

    render();
}

// ============ DICE ============
function rollDice() {
    if (phase !== Phase.CHOOSE) return;
    phase = Phase.ROLLING;
    elActionBtns.style.display = 'none';
    elDiceArea.style.display = 'flex';
    elDice.className = 'dice rolling';

    let ticks = 0;
    const maxTicks = 12;
    const interval = setInterval(() => {
        elDice.textContent = Math.floor(Math.random() * DICE_MAX) + 1;
        ticks++;
        if (ticks >= maxTicks) {
            clearInterval(interval);
            diceVal = Math.floor(Math.random() * DICE_MAX) + 1;
            wallsLeft = diceVal;
            elDice.textContent = diceVal;
            elDice.className = 'dice result-' + (currentPlayer === 0 ? 'p1' : 'p2');
            // Check if player can place any walls
            if (!hasValidWallPlacement(currentPlayer)) {
                elActionMsg.textContent = 'Nessun muro piazzabile! Turno perso.';
                setTimeout(() => endTurn(), 1500);
                return;
            }
            setPhase(Phase.PLACING_WALLS);
        }
    }, 100);
}

// ============ BLOCK PLACEMENT ============
function startBlockPlacement() {
    if (phase !== Phase.CHOOSE) return;
    setPhase(Phase.PLACING_BLOCK);
}

// ============ END TURN ============
function endTurn() {
    currentPlayer = 1 - currentPlayer;
    setPhase(Phase.CHOOSE);
}

// ============ MOUSE HANDLING ============
function dotPos(row, col) {
    return { x: PAD + col * CELL, y: PAD + row * CELL };
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    hovered = findNearest(mx, my);
    // No need to call render() — gameLoop handles it
}

function findNearest(mx, my) {
    // In dot-selection phases, find nearest border dot
    if (phase === Phase.SETUP_POS_A || phase === Phase.SETUP_POS_B) {
        return findNearestDot(mx, my, true);
    }

    // In wall/block placement, find nearest edge
    if (phase === Phase.PLACING_WALLS || phase === Phase.PLACING_BLOCK) {
        return findNearestEdge(mx, my);
    }

    return null;
}

function findNearestDot(mx, my, borderOnly) {
    let best = null, bestDist = 25; // max click distance for dots
    for (let r = 0; r < DOTS; r++) {
        for (let c = 0; c < DOTS; c++) {
            if (borderOnly && r > 0 && r < GRID && c > 0 && c < GRID) continue;
            // Exclude corners
            if (borderOnly && isCorner(r, c)) continue;
            const p = dotPos(r, c);
            const d = Math.hypot(mx - p.x, my - p.y);
            if (d < bestDist) {
                bestDist = d;
                best = { type: 'dot', row: r, col: c };
            }
        }
    }
    return best;
}

function pointToSegmentDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function findNearestEdge(mx, my) {
    let best = null, bestDist = HIT_DIST;

    // Horizontal edges
    for (let r = 0; r < DOTS; r++) {
        for (let c = 0; c < GRID; c++) {
            if (hEdges[r][c] === BORDER) continue; // skip border edges
            const p1 = dotPos(r, c);
            const p2 = dotPos(r, c + 1);
            const d = pointToSegmentDist(mx, my, p1.x, p1.y, p2.x, p2.y);
            if (d < bestDist) {
                bestDist = d;
                best = { type: 'h', row: r, col: c };
            }
        }
    }

    // Vertical edges
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < DOTS; c++) {
            if (vEdges[r][c] === BORDER) continue;
            const p1 = dotPos(r, c);
            const p2 = dotPos(r + 1, c);
            const d = pointToSegmentDist(mx, my, p1.x, p1.y, p2.x, p2.y);
            if (d < bestDist) {
                bestDist = d;
                best = { type: 'v', row: r, col: c };
            }
        }
    }

    return best;
}

// ============ CANVAS CLICK ============
function onCanvasClick(e) {
    if (!hovered) return;

    switch (phase) {
        case Phase.SETUP_POS_A:
        case Phase.SETUP_POS_B:
            handleDotClick();
            break;

        case Phase.PLACING_WALLS:
            handleWallClick();
            break;

        case Phase.PLACING_BLOCK:
            handleBlockClick();
            break;
    }
}

function handleDotClick() {
    if (hovered.type !== 'dot') return;
    const { row, col } = hovered;

    // Must be on border and not a corner
    if (row > 0 && row < GRID && col > 0 && col < GRID) return;
    if (isCorner(row, col)) return;

    // Check not already taken
    const otherPlayer = players[1 - currentPlayer];
    if (otherPlayer.startDot &&
        otherPlayer.startDot.row === row && otherPlayer.startDot.col === col) return;

    const p = players[currentPlayer];
    p.startDot = { row, col };
    p.dots.add(`${row},${col}`);

    if (phase === Phase.SETUP_POS_A) {
        setPhase(Phase.SETUP_POS_B);
    } else {
        // After both positions chosen, first player starts with normal turn (dice)
        currentPlayer = firstPlayerIdx;
        setPhase(Phase.CHOOSE);
    }
}

function handleWallClick() {
    if (hovered.type !== 'h' && hovered.type !== 'v') return;
    const { type, row, col } = hovered;
    const edgeArr = type === 'h' ? hEdges : vEdges;

    // Edge must be empty
    if (edgeArr[row][col] !== EMPTY) return;

    // Must be connected to player's network
    if (!isEdgeConnected(type, row, col, currentPlayer)) return;

    // Place wall
    const pVal = currentPlayer === 0 ? P1 : P2;
    edgeArr[row][col] = pVal;

    // Add endpoints to player's dot set
    addEdgeEndpoints(type, row, col, currentPlayer);

    // PLACING_WALLS phase
    wallsLeft--;
    elWallsNum.textContent = wallsLeft;

    // Check for rectangles
    const result = checkNewRectangles(currentPlayer);
    if (result.points > 0) {
        players[currentPlayer].score += result.points;
        showScorePopup(result.points, currentPlayer);
        updateScores();
        if (players[currentPlayer].score >= WIN_SCORE) {
            setPhase(Phase.GAME_OVER);
            return;
        }
    }

    if (wallsLeft <= 0) {
        // Turn ends
        setTimeout(() => endTurn(), 400);
    } else if (!hasValidWallPlacement(currentPlayer)) {
        elActionMsg.textContent = 'Nessun altro muro piazzabile!';
        setTimeout(() => endTurn(), 1200);
    }

    render();
}

function handleBlockClick() {
    if (hovered.type !== 'h' && hovered.type !== 'v') return;
    const { type, row, col } = hovered;
    const edgeArr = type === 'h' ? hEdges : vEdges;

    // Edge must be empty
    if (edgeArr[row][col] !== EMPTY) return;

    // Place block
    edgeArr[row][col] = BLK;

    // Block placed — end turn
    setTimeout(() => endTurn(), 300);
    render();
}

// ============ EDGE CONNECTIVITY ============
function getEdgeEndpoints(type, row, col) {
    if (type === 'h') {
        // Horizontal edge (row, col) connects dot(row,col) and dot(row,col+1)
        return [{ row, col }, { row, col: col + 1 }];
    } else {
        // Vertical edge (row, col) connects dot(row,col) and dot(row+1,col)
        return [{ row, col }, { row: row + 1, col }];
    }
}

function addEdgeEndpoints(type, row, col, playerIdx) {
    const eps = getEdgeEndpoints(type, row, col);
    const p = players[playerIdx];
    eps.forEach(ep => p.dots.add(`${ep.row},${ep.col}`));
}

function isEdgeConnected(type, row, col, playerIdx) {
    const eps = getEdgeEndpoints(type, row, col);
    const p = players[playerIdx];
    return eps.some(ep => p.dots.has(`${ep.row},${ep.col}`));
}

function hasValidWallPlacement(playerIdx) {
    // Check if any empty edge is connected to player's network
    for (let r = 0; r < DOTS; r++) {
        for (let c = 0; c < GRID; c++) {
            if (hEdges[r][c] === EMPTY && isEdgeConnected('h', r, c, playerIdx)) return true;
        }
    }
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < DOTS; c++) {
            if (vEdges[r][c] === EMPTY && isEdgeConnected('v', r, c, playerIdx)) return true;
        }
    }
    return false;
}

// ============ RECTANGLE DETECTION ============
function checkNewRectangles(playerIdx) {
    const pVal = playerIdx === 0 ? P1 : P2;
    let totalPoints = 0;
    const newRects = [];

    for (let r1 = 0; r1 < DOTS; r1++) {
        for (let r2 = r1 + 1; r2 < DOTS; r2++) {
            for (let c1 = 0; c1 < DOTS; c1++) {
                for (let c2 = c1 + 1; c2 < DOTS; c2++) {
                    const key = `${r1},${c1},${r2},${c2}`;
                    if (scoredRects.has(key)) continue;

                    if (isRectClosed(r1, c1, r2, c2, pVal)) {
                        scoredRects.add(key);
                        const area = (r2 - r1) * (c2 - c1);
                        totalPoints += area;
                        newRects.push({ r1, c1, r2, c2, area, player: playerIdx });
                    }
                }
            }
        }
    }

    return { points: totalPoints, rects: newRects };
}

function isRectClosed(r1, c1, r2, c2, pVal) {
    let hasPlayerWall = false;

    // Check PERIMETER edges: must all be player walls or borders
    // Top horizontal edges
    for (let c = c1; c < c2; c++) {
        const v = hEdges[r1][c];
        if (v === pVal) hasPlayerWall = true;
        else if (v !== BORDER) return false;
    }

    // Bottom horizontal edges
    for (let c = c1; c < c2; c++) {
        const v = hEdges[r2][c];
        if (v === pVal) hasPlayerWall = true;
        else if (v !== BORDER) return false;
    }

    // Left vertical edges
    for (let r = r1; r < r2; r++) {
        const v = vEdges[r][c1];
        if (v === pVal) hasPlayerWall = true;
        else if (v !== BORDER) return false;
    }

    // Right vertical edges
    for (let r = r1; r < r2; r++) {
        const v = vEdges[r][c2];
        if (v === pVal) hasPlayerWall = true;
        else if (v !== BORDER) return false;
    }

    if (!hasPlayerWall) return false;

    // Check INTERNAL edges: no blocks allowed inside the rectangle
    // Internal horizontal edges (rows between top and bottom)
    for (let r = r1 + 1; r < r2; r++) {
        for (let c = c1; c < c2; c++) {
            if (hEdges[r][c] === BLK) return false;
        }
    }

    // Internal vertical edges (cols between left and right)
    for (let r = r1; r < r2; r++) {
        for (let c = c1 + 1; c < c2; c++) {
            if (vEdges[r][c] === BLK) return false;
        }
    }

    return true;
}

// ============ UI UPDATES ============
function updateScores() {
    elP1Score.textContent = players[0].score;
    elP2Score.textContent = players[1].score;
    elP1Bar.style.width = Math.min(100, (players[0].score / WIN_SCORE) * 100) + '%';
    elP2Bar.style.width = Math.min(100, (players[1].score / WIN_SCORE) * 100) + '%';
}

function showScorePopup(points, playerIdx) {
    elPopupPoints.textContent = '+' + points;
    elPopupPoints.className = 'popup-points ' + (playerIdx === 0 ? 'p1-points' : 'p2-points');
    elScorePopup.classList.remove('show');
    void elScorePopup.offsetWidth; // reflow
    elScorePopup.classList.add('show');
}

function showVictory() {
    const winner = players[0].score >= WIN_SCORE ? 0 : 1;
    const winnerP = players[winner];
    const loserP = players[1 - winner];

    elVictoryTitle.textContent = `${winnerP.name} vince!`;
    elVictoryTitle.className = 'victory-title ' + (winner === 0 ? 'p1-winner' : 'p2-winner');
    elVictorySub.textContent = `Ha raggiunto ${winnerP.score} punti!`;

    elFinalScores.innerHTML = `
        <div class="final-score-card winner">
            <span class="final-name">🏆 ${winnerP.name}</span>
            <span class="final-points" style="color: var(--${winner === 0 ? 'p1' : 'p2'})">${winnerP.score}</span>
        </div>
        <div class="final-score-card">
            <span class="final-name">${loserP.name}</span>
            <span class="final-points" style="color: var(--text-secondary)">${loserP.score}</span>
        </div>
    `;

    showScreen('game_over');
    spawnConfetti();
}

function spawnConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#00d4ff', '#ff3399', '#ff8c00', '#7c3aed', '#22c55e', '#ffd700'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.width = (6 + Math.random() * 8) + 'px';
        piece.style.height = (6 + Math.random() * 8) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }
}

// ============ RENDERING ============
function render() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = C.BG;
    ctx.fillRect(0, 0, w, h);

    drawGrid();
    drawScoredRects();
    drawBorders();
    drawWalls();
    drawBlocks();
    drawHover();
    drawDots();
    drawStartDots();
}

function drawGrid() {
    ctx.strokeStyle = C.GRID;
    ctx.lineWidth = 1;
    for (let r = 0; r <= GRID; r++) {
        const y = PAD + r * CELL;
        ctx.beginPath();
        ctx.moveTo(PAD, y);
        ctx.lineTo(PAD + GRID * CELL, y);
        ctx.stroke();
    }
    for (let c = 0; c <= GRID; c++) {
        const x = PAD + c * CELL;
        ctx.beginPath();
        ctx.moveTo(x, PAD);
        ctx.lineTo(x, PAD + GRID * CELL);
        ctx.stroke();
    }
}

function drawScoredRects() {
    for (const key of scoredRects) {
        const [r1, c1, r2, c2] = key.split(',').map(Number);
        // Determine which player scored this rect by checking a perimeter edge
        const owner = findRectOwner(r1, c1, r2, c2);
        if (owner < 0) continue;

        const x = PAD + c1 * CELL;
        const y = PAD + r1 * CELL;
        const rw = (c2 - c1) * CELL;
        const rh = (r2 - r1) * CELL;

        ctx.fillStyle = owner === 0 ? C.P1_FILL : C.P2_FILL;
        ctx.fillRect(x, y, rw, rh);

        // Draw area text
        const area = (r2 - r1) * (c2 - c1);
        ctx.fillStyle = owner === 0 ? 'rgba(0,212,255,0.35)' : 'rgba(255,51,153,0.35)';
        ctx.font = `bold ${Math.min(24, CELL * 0.4)}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(area, x + rw / 2, y + rh / 2);
    }
}

function findRectOwner(r1, c1, r2, c2) {
    // Check perimeter edges for a player-owned edge
    for (let c = c1; c < c2; c++) {
        if (hEdges[r1][c] === P1 || hEdges[r2][c] === P1) return 0;
        if (hEdges[r1][c] === P2 || hEdges[r2][c] === P2) return 1;
    }
    for (let r = r1; r < r2; r++) {
        if (vEdges[r][c1] === P1 || vEdges[r][c2] === P1) return 0;
        if (vEdges[r][c1] === P2 || vEdges[r][c2] === P2) return 1;
    }
    return -1;
}

function drawBorders() {
    ctx.strokeStyle = C.BORDER_W;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    // Draw border edges with subtle glow
    ctx.shadowColor = C.BORDER_GLOW;
    ctx.shadowBlur = 6;

    // Top & Bottom
    for (let c = 0; c < GRID; c++) {
        drawEdgeLine('h', 0, c);
        drawEdgeLine('h', GRID, c);
    }
    // Left & Right
    for (let r = 0; r < GRID; r++) {
        drawEdgeLine('v', r, 0);
        drawEdgeLine('v', r, GRID);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function drawWalls() {
    ctx.lineWidth = WALL_W;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);

    // Player 1 walls
    ctx.strokeStyle = C.P1;
    ctx.shadowColor = C.P1_GLOW;
    ctx.shadowBlur = 10;
    for (let r = 0; r < DOTS; r++)
        for (let c = 0; c < GRID; c++)
            if (hEdges[r][c] === P1) drawEdgeLine('h', r, c);
    for (let r = 0; r < GRID; r++)
        for (let c = 0; c < DOTS; c++)
            if (vEdges[r][c] === P1) drawEdgeLine('v', r, c);

    // Player 2 walls
    ctx.strokeStyle = C.P2;
    ctx.shadowColor = C.P2_GLOW;
    ctx.shadowBlur = 10;
    for (let r = 0; r < DOTS; r++)
        for (let c = 0; c < GRID; c++)
            if (hEdges[r][c] === P2) drawEdgeLine('h', r, c);
    for (let r = 0; r < GRID; r++)
        for (let c = 0; c < DOTS; c++)
            if (vEdges[r][c] === P2) drawEdgeLine('v', r, c);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function drawBlocks() {
    ctx.strokeStyle = C.BLOCK;
    ctx.lineWidth = WALL_W;
    ctx.lineCap = 'round';
    ctx.setLineDash([6, 4]);
    ctx.shadowColor = C.BLOCK_GLOW;
    ctx.shadowBlur = 8;

    for (let r = 0; r < DOTS; r++)
        for (let c = 0; c < GRID; c++)
            if (hEdges[r][c] === BLK) drawEdgeLine('h', r, c);
    for (let r = 0; r < GRID; r++)
        for (let c = 0; c < DOTS; c++)
            if (vEdges[r][c] === BLK) drawEdgeLine('v', r, c);

    ctx.setLineDash([]);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function drawEdgeLine(type, row, col) {
    const eps = getEdgeEndpoints(type, row, col);
    const p1 = dotPos(eps[0].row, eps[0].col);
    const p2 = dotPos(eps[1].row, eps[1].col);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

function drawHover() {
    if (!hovered) return;

    if (hovered.type === 'dot') {
        // Dot hover for position selection
        if (phase !== Phase.SETUP_POS_A && phase !== Phase.SETUP_POS_B) return;
        const { row, col } = hovered;
        if (row > 0 && row < GRID && col > 0 && col < GRID) return; // not border
        if (isCorner(row, col)) return; // no corners

        // Check not taken
        const otherPlayer = players[1 - currentPlayer];
        if (otherPlayer.startDot &&
            otherPlayer.startDot.row === row && otherPlayer.startDot.col === col) return;

        const p = dotPos(row, col);
        const color = currentPlayer === 0 ? C.P1 : C.P2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = color + '80';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
    }

    // Edge hover
    const { type, row, col } = hovered;
    const edgeArr = type === 'h' ? hEdges : vEdges;
    if (edgeArr[row][col] !== EMPTY) return; // occupied

    let valid = false;
    let color = C.HOVER_OK;

    if (phase === Phase.PLACING_BLOCK) {
        valid = true; // any empty edge is valid for blocks
        color = C.BLOCK + '80';
    } else {
        // Wall placement — check connectivity
        valid = isEdgeConnected(type, row, col, currentPlayer);
        color = valid
            ? (currentPlayer === 0 ? C.P1 + '60' : C.P2 + '60')
            : C.HOVER_NO;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = WALL_W;
    ctx.lineCap = 'round';
    ctx.setLineDash(valid ? [] : [4, 4]);

    if (valid) {
        const playerColor = phase === Phase.PLACING_BLOCK ? C.BLOCK : (currentPlayer === 0 ? C.P1 : C.P2);
        ctx.shadowColor = playerColor + '40';
        ctx.shadowBlur = 8;
    }

    drawEdgeLine(type, row, col);
    ctx.setLineDash([]);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function drawDots() {
    for (let r = 0; r < DOTS; r++) {
        for (let c = 0; c < DOTS; c++) {
            const p = dotPos(r, c);
            const isBorder = r === 0 || r === GRID || c === 0 || c === GRID;
            ctx.beginPath();
            ctx.arc(p.x, p.y, isBorder ? DOT_R + 1 : DOT_R, 0, Math.PI * 2);
            ctx.fillStyle = isBorder ? C.DOT_BORDER : C.DOT;
            ctx.fill();
        }
    }
}

function drawStartDots() {
    const pulse = Math.sin(animFrame / 400) * 0.3 + 0.7;

    for (let i = 0; i < 2; i++) {
        const p = players[i];
        if (!p.startDot) continue;

        const pos = dotPos(p.startDot.row, p.startDot.col);
        const color = i === 0 ? C.P1 : C.P2;
        const glowColor = i === 0 ? C.P1_GLOW : C.P2_GLOW;

        // Outer glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = color;
        ctx.font = `bold 11px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.name, pos.x, pos.y - 16);
    }
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', init);
