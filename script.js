// Charity: water Pipe Tetris - Fun Edition

// === DOM QUERIES ===
const bucketAnim = document.getElementById('bucket-animation');
const bucketWater = document.getElementById('bucket-water');
const jerryCanAnim = document.getElementById('jerrycan-bonus');
const mudSplatterAnim = document.getElementById('mud-splatter');
const factRotator = document.getElementById('fact-rotator');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnRotate = document.getElementById('btn-rotate');
const btnDrop = document.getElementById('btn-drop');
const difficultySelect = document.getElementById('difficulty');
const waterMeter = document.getElementById('water-meter');
const waterFill = document.getElementById('fill');
const linesToNext = document.getElementById('lines-to-next'); // Add this line

// Difficulty settings for the game
// These control drop speeds, mud block chance, and lines needed to level up
const DIFFICULTY_SETTINGS = {
    easy: {
        dropSpeeds: [800, 600, 500, 400, 300], // Slower drop
        mudChance: [0.05, 0.10, 0.18, 0.25, 0.35],
        linesToNextLevel: 6, // Fewer lines per level
    },
    normal: {
        dropSpeeds: [600, 450, 350, 250, 150], // Original speeds
        mudChance: [0.10, 0.18, 0.28, 0.40, 0.55],
        linesToNextLevel: 8,
    },
    hard: {
        dropSpeeds: [400, 300, 200, 120, 80], // Faster
        mudChance: [0.20, 0.30, 0.40, 0.55, 0.70], // More mud
        linesToNextLevel: 10, // More lines per level
    }
};
let currentDifficulty = 'normal';

// === Preload Tetris piece images ===
const SHAPE_TYPES = ['I','O','T','L','J','S','Z'];
const tetrominoImages = {};
let loadedCount = 0;
let pageLoaded = false;

// This maps each letter to its 4 rotations (each rotation is an array of [x, y] offsets)
const SHAPES = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]]
  ],
  O: [
    [[1,1],[2,1],[1,2],[2,2]],
    [[1,1],[2,1],[1,2],[2,2]],
    [[1,1],[2,1],[1,2],[2,2]],
    [[1,1],[2,1],[1,2],[2,2]]
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]]
  ],
  L: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]]
  ],
  J: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]]
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]]
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]]
  ]
};

// This function checks if both the page and all images are loaded
function tryInitGame() {
  if (loadedCount === SHAPE_TYPES.length && pageLoaded) {
    initGame();
  }
}

// Preload all tetromino images
SHAPE_TYPES.forEach(type => {
  const img = new Image();
  img.src = `img/pipe-tetris-${type}.png`;
  img.onload = () => {
    loadedCount++;
    tryInitGame(); // Try to start the game after each image loads
  };
  tetrominoImages[type] = img;
});

// Wait for the page to finish loading
window.onload = function() {
  pageLoaded = true;
  tryInitGame(); // Try to start the game after the page loads
};

// Replace window.addEventListener('DOMContentLoaded', ...) with initGame
function initGame() {
    // DOM elements
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next');
    const nextContext = nextCanvas.getContext('2d');
    const deliveredDisplay = document.getElementById('water-delivered');
    const factPopup = document.getElementById('fact-popup');
    const factText = document.getElementById('fact-text');
    const closeFact = document.getElementById('close-fact');
    const pauseBtn = document.getElementById('pause-btn');
    const sidebar = document.getElementById('sidebar');
    const levelDisplay = document.getElementById('level-display');
    const overlayRestart = document.getElementById('overlay-restart');
    const howToModal = document.getElementById('how-to-modal');
    const closeHowTo = document.getElementById('close-how-to');
    let factIndex = 0;

    // Game constants
    const ROWS = 20, COLS = 10, BLOCK_SIZE = 30;
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    const SHAPES = [
        [[1, 1, 1, 1]],
        [[2, 2], [2, 2]],
        [[0, 3, 0], [3, 3, 3]],
        [[0, 4, 4], [4, 4, 0]],
        [[5, 5, 0], [0, 5, 5]],
        [[6, 0, 0], [6, 6, 6]],
        [[0, 0, 7], [7, 7, 7]],
        [[8]],
    ];
    const COLORS = [
        null,
        '#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#F5402C', '#FF902A', '#F16061', '#FFD700'
    ];
    const PIECE_NAMES = [
        '', 'I-pipe', 'O-pipe', 'T-pipe', 'S-pipe', 'Z-pipe', 'J-pipe', 'L-pipe', 'Jerry Can'
    ];
    const WATER_FACTS = [
        "Every $1 invested in clean water yields $4–$12 in economic returns.",
        "Women and girls spend 200 million hours every day collecting water.",
        "1 in 10 people on Earth don’t have access to clean water.",
        "Access to clean water reduces global disease and increases education.",
        "Over 2 billion people use a drinking water source contaminated with feces.",
        "Clean water saves lives. You’re helping, line by line.",
        "Diarrhea from unsafe water kills more children than malaria, measles, and HIV/AIDS combined.",
        "Clean water = more time for school, work, and dreams.",
        "You’re not just clearing lines. You’re delivering hope."
    ];
    // Add mud block
    const MUD_INDEX = 9;
    SHAPES.push([[MUD_INDEX]]);
    COLORS.push('#8B5C2A');
    PIECE_NAMES.push('Mud Block');

    // Preload mud image for mud block
    const mudImg = new window.Image();
    mudImg.src = 'img/Mud.png';

    // Show loading message until pipesSprite is loaded
    const loadingMsg = document.getElementById('loading-message');

    // Game state
    let board, current, next, pos, liters, dropStart, gameOver, linesCleared, level, linesToNextLevel, mudChance, dropSpeeds, paused;

    // Utility
    function randomTetromino() {
        // 3% Jerry Can, mudChance for Mud Block, rest normal
        const rand = Math.random();
        let index;
        if (rand < 0.03) {
            index = 7; // Jerry Can
        } else if (rand < 0.03 + mudChance) {
            index = 8; // Mud Block
        } else {
            index = Math.floor(Math.random() * 7);
        }
        return {
            shape: SHAPES[index],
            color: COLORS[index + 1],
            index: index + 1,
            name: PIECE_NAMES[index + 1]
        };
    }
    function drawBlock(x, y, color, ctx = context, index = null, rotation = 0) {
        // If this is a normal tetromino (1-7), draw the image
        if (index && index >= 1 && index <= 7) {
            // index 1-7 correspond to SHAPE_TYPES[0-6]
            const type = SHAPE_TYPES[index - 1];
            ctx.drawImage(
                tetrominoImages[type],
                x * BLOCK_SIZE,
                y * BLOCK_SIZE,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
            // Draw a border for visibility
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 2;
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            return;
        }
        // For Jerry Can (8), Mud (9), or empty, use color or special logic
        ctx.fillStyle = color || '#888';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = "#222";
        ctx.lineWidth   = 2;
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        // Jerry Can icon
        if (index === 8) {
            ctx.fillStyle = "#FFC907";
            ctx.fillRect(
                x * BLOCK_SIZE + BLOCK_SIZE * 0.2,
                y * BLOCK_SIZE + BLOCK_SIZE * 0.4,
                BLOCK_SIZE * 0.6,
                BLOCK_SIZE * 0.4
            );
            ctx.fillRect(
                x * BLOCK_SIZE + BLOCK_SIZE * 0.35,
                y * BLOCK_SIZE + BLOCK_SIZE * 0.2,
                BLOCK_SIZE * 0.3,
                BLOCK_SIZE * 0.25
            );
        }
        // Mud image icon
        if (index === 9) {
            ctx.drawImage(
                mudImg,
                x * BLOCK_SIZE,
                y * BLOCK_SIZE,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
        }
    }
    // Draw a pipe segment with end-caps, gradient shine, and outlines
    function drawPipeSegment(ctx, col, row, rotation = 0) {
      const px = col * BLOCK_SIZE;
      const py = row * BLOCK_SIZE;
      const w  = BLOCK_SIZE;
      const h  = BLOCK_SIZE;
      const r  = w * 0.15;    // cap radius
      // 1) create a nice blue gradient down the pipe:
      const grad = ctx.createLinearGradient(px, py, px + w, py + h);
      grad.addColorStop(0, '#A4ECFF');
      grad.addColorStop(1, '#68CFFF');
      // 2) draw a horizontal “barrel” + two semicircular endcaps:
      ctx.save();
      // move to centre then rotate so you can reuse same shape:
      ctx.translate(px + w/2, py + h/2);
      ctx.rotate(rotation * Math.PI/2);
      ctx.translate(-w/2, -h/2);

      // barrel
      ctx.fillStyle   = grad;
      ctx.strokeStyle = '#2795D6';
      ctx.lineWidth   = 4;
      ctx.beginPath();
      ctx.moveTo(r, h/2);
      ctx.lineTo(w - r, h/2);
      // right cap
      ctx.arc(w - r, h/2, r,  -Math.PI/2, Math.PI/2);
      // back to barrel
      ctx.lineTo(r, h/2 + r);
      // left cap
      ctx.arc(r, h/2,  r,  Math.PI/2,   -Math.PI/2, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function drawBoard() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < ROWS; ++y)
            for (let x = 0; x < COLS; ++x) {
                const val = board[y][x];
                if (val) {
                    drawBlock(x, y, COLORS[val], context, val);
                }
            }
        drawTetromino();
    }
    function drawTetromino() {
        current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) drawBlock(pos.x + x, pos.y + y, current.color);
            });
        });
    }
    function drawNext() {
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        next.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) drawBlock(x + 1, y + 1, next.color, nextContext);
            });
        });
    }
    function validMove(offsetX = 0, offsetY = 0, tetromino = current.shape) {
        for (let y = 0; y < tetromino.length; ++y) {
            for (let x = 0; x < tetromino[y].length; ++x) {
                if (!tetromino[y][x]) continue;
                let nx = pos.x + x + offsetX;
                let ny = pos.y + y + offsetY;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                if (ny < 0) continue;
                if (board[ny][nx]) return false;
            }
        }
        return true;
    }
    // Define the function first
    function showFact(fact) {
        // Only use the sidebar, never popups
        if (fact) {
            // Show it in sidebar rotator area instead
            factRotator.textContent = fact;
        } else {
            factRotator.textContent = WATER_FACTS[factIndex];
            factIndex = (factIndex + 1) % WATER_FACTS.length;
        }
    }

    function mergeTetromino() {
        // Jerry Can block logic
        if (current.index === 8) {
            // Play sound and show animation for Jerry Can bonus first
            showJerryCanBonus();
            // Jerry Can: clear this row instantly and double liters
            let clearRow = pos.y;
            if (clearRow >= 0 && clearRow < ROWS) {
                for (let x = 0; x < COLS; x++) {
                    board[clearRow][x] = 0;
                }
            }
            liters += 400;
        } else if (current.index === 9) {
            // Mud block: place on board, reduce liters
            board[pos.y][pos.x] = 9;
            liters = Math.max(0, liters - 100);
            deliveredDisplay.textContent = `Liters Delivered: ${liters}`;
            updateWaterMeter(liters);
            showMudSplatter();
            deliveredDisplay.classList.remove('score-up', 'score-down');
            deliveredDisplay.classList.add('score-down');
            setTimeout(() => deliveredDisplay.classList.remove('score-down'), 400);
        } else {
            current.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) board[pos.y + y][pos.x + x] = current.index;
                });
            });
        }
    }
    function rotate(matrix) {
        return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
    }
    function clearLines() {
        let lines = 0;
        board = board.filter(row => {
            if (row.every(x => x)) {
                lines++;
                return false;
            }
            return true;
        });
        while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
        return lines;
    }
    function animateLiters(oldVal, newVal) {
        let step = Math.max(1, Math.floor((newVal - oldVal) / 16));
        let val = oldVal;
        const up = newVal > oldVal;
        deliveredDisplay.classList.remove('score-up', 'score-down');
        deliveredDisplay.classList.add(up ? 'score-up' : 'score-down');
        function tick() {
            if ((up && val < newVal) || (!up && val > newVal)) {
                val += up ? step : -step;
                if ((up && val > newVal) || (!up && val < newVal)) val = newVal;
                deliveredDisplay.textContent = `Liters Delivered: ${val}`;
                updateWaterMeter(val);
                requestAnimationFrame(tick);
            } else {
                deliveredDisplay.textContent = `Liters Delivered: ${newVal}`;
                setTimeout(() => deliveredDisplay.classList.remove('score-up', 'score-down'), 400);
            }
        }
        tick();
    }
    const splashEffect = document.getElementById('splash-effect');
    function showSplash() {
        const splash = document.createElement('div');
        splash.className = 'splash';
        // Randomize a little for fun
        const offsetX = (Math.random() - 0.5) * 120;
        const offsetY = (Math.random() - 0.5) * 60;
        splash.style.left = `calc(50% + ${offsetX}px)`;
        splash.style.top = `calc(40% + ${offsetY}px)`;
        splashEffect.appendChild(splash);
        setTimeout(() => splash.remove(), 700);
    }

    // Confetti effect for level up
    function showConfetti() {
        const confettiColors = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#F5402C', '#FF902A', '#F16061'];
        const splashEffect = document.getElementById('splash-effect');
        for (let i = 0; i < 32; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'absolute';
            conf.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
            conf.style.top = '40%';
            conf.style.width = '12px';
            conf.style.height = '12px';
            conf.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            conf.style.borderRadius = '3px';
            conf.style.opacity = '0.85';
            conf.style.transform = `rotate(${Math.random() * 360}deg)`;
            conf.style.zIndex = 301;
            conf.style.transition = 'all 1.1s cubic-bezier(.4,1.4,.6,1)';
            setTimeout(() => {
                conf.style.top = `${60 + Math.random() * 30}%`;
                conf.style.left = `${50 + (Math.random() - 0.5) * 60}%`;
                conf.style.opacity = '0';
            }, 10);
            setTimeout(() => conf.remove(), 1200);
            splashEffect.appendChild(conf);
        }
    }

    function updateLiters(lines) {
        if (lines) {
            showBucketFill(lines);
            showSplash();
            let litersOld = liters;
            liters += lines * 200;
            linesCleared += lines;
            animateLiters(litersOld, liters);
            showFact();
            updateLevel();
            updateLinesToNext();
        }
    }
    function updateLevel() {
        let levelUp = false;
        if (linesCleared >= linesToNextLevel) {
            if (level < 5) {
                level++;
                linesCleared = 0;
                linesToNextLevel += DIFFICULTY_SETTINGS[currentDifficulty].linesToNextLevel;
                
                const mudArr = DIFFICULTY_SETTINGS[currentDifficulty].mudChance;
                mudChance = mudArr[Math.min(mudArr.length - 1, level - 1)];
                
                dropSpeeds = DIFFICULTY_SETTINGS[currentDifficulty].dropSpeeds;
                showFact(`Level Up! Welcome to Level ${level}.`);
                levelUp = true;
                showConfetti();
                updateLevelDisplay();
            }
        }
        if (levelUp) ;
    }
    function updateLinesToNext() {
        const left = Math.max(0, linesToNextLevel - linesCleared);
        linesToNext.textContent = `Next Level in ${left} line${left === 1 ? '' : 's'}`;
    }
    function showRotatingFact() {
        factRotator.textContent = WATER_FACTS[factIndex];
        factIndex = (factIndex + 1) % WATER_FACTS.length;
    }
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }
    function showHowToModal() {
        const modal = document.getElementById('how-to-modal');
        modal.style.display = 'flex';
    }
    function hideHowToModal() {
        const modal = document.getElementById('how-to-modal');
        modal.style.display = 'none';
    }
    function drop() {
        if (gameOver || paused) return;
        let now = Date.now(), delta = now - dropStart;
        let speed = dropSpeeds[level - 1] || 200;
        if (delta > speed) {
            if (validMove(0, 1)) {
                pos.y++;
            } else {
                mergeTetromino();
                let lines = clearLines();
                updateLiters(lines);
                resetTetromino();
                if (!validMove()) {
                    // Play the game over sound if sound is on
                    showGameOverOverlay();
                    gameOver = true;
                    return;
                }
            }
            dropStart = Date.now();
        }
        drawBoard();
        if (!gameOver && !paused) requestAnimationFrame(drop);
    }
    function resetTetromino() {
        current = next;
        next = randomTetromino();
        pos = {x: 3, y: 0};
        drawNext();
    }
    function handleKey(e) {
        if (gameOver && e.key !== "Enter" && e.key !== "w" && e.key !== "W") return;

        const key = e.key.toLowerCase();

        // Allow WASD as arrow key controls for beginners
        if (key === "arrowleft" || key === "a") {
            if (validMove(-1, 0)) pos.x--;
        }
        if (key === "arrowright" || key === "d") {
            if (validMove(1, 0)) pos.x++;
        }
        if (key === "arrowdown" || key === "s") {
            if (validMove(0, 1)) pos.y++;
        }
        if (key === "arrowup" || key === "w") {
            const rotated = rotate(current.shape);
            if (validMove(0, 0, rotated)) current.shape = rotated;
        }
        if (key === " ") {
            while (validMove(0, 1)) pos.y++;
        }
        if ((key === "enter") && gameOver) {
            startGame();
        }
        drawBoard();
    }
    document.addEventListener('keydown', function(e) {
        // Prevent arrow keys, space, and WASD from scrolling the page
        if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "spacebar", "a", "d", "w", "s"].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        handleKey(e);
    });

    // Assume an element with the ID 'sidebar-toggle' exists in your HTML
    const sidebarToggle = document.getElementById('sidebar-toggle');

    pauseBtn.onclick = function() {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        if (!paused) drop();
    };

    // Now sidebarToggle is defined and can be used
    sidebarToggle.onclick = function() {
        sidebar.classList.toggle('collapsed');
    };

    document.getElementById('instructions').onclick = function() {
        howToModal.style.display = 'flex';
    };
    closeHowTo.onclick = function() {
        howToModal.style.display = 'none';
    };

    // Removed factPopup close logic, since popup is no longer used
    // closeFact.addEventListener('click', function() {
    //     factPopup.style.display = 'none';
    //     paused = false; // Resume the game
    //     pauseBtn.textContent = 'Pause';
    //     drop(); // Resume the drop loop if needed
    // });

    // Only start the game after pipesSprite is loaded
    pipesSprite.onload = function() {
        if (loadingMsg) loadingMsg.style.display = 'none';
        startGame();
    };
    // If the image is already cached, onload may not fire
    if (pipesSprite.complete) {
        if (loadingMsg) loadingMsg.style.display = 'none';
        startGame();
    }

    function startGame() {
        liters = 0;
        linesCleared = 0;
        level = 1;
        // Use difficulty settings selected by the player
        const settings = DIFFICULTY_SETTINGS[currentDifficulty];
        dropSpeeds = settings.dropSpeeds.slice(); // Copy the array for this game
        mudChance = settings.mudChance[0]; // Start with the first mud chance
        linesToNextLevel = settings.linesToNextLevel;
        board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        current = randomTetromino();
        next = randomTetromino();
        pos = {x: 3, y: 0};
        gameOver = false;
        paused = false;
        pauseBtn.textContent = 'Pause';
        sidebar.classList.remove('collapsed');
        drawNext();
        deliveredDisplay.textContent = `Liters Delivered: 0`;
        updateWaterMeter(0);
        updateLevelDisplay();
        updateLinesToNext();
        dropStart = Date.now();
        hideGameOverOverlay();
        drop();
    }
    document.getElementById('restart').onclick = startGame;

    // Overlay restart button
    overlayRestart.onclick = () => {
        hideGameOverOverlay();
        startGame();
    };

    // Also allow Enter key to restart from overlay
    overlayRestart.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            hideGameOverOverlay();
            startGame();
        }
    });

    // Charity: water Fact Rotator
    setInterval(showRotatingFact, 8000);
    showRotatingFact();

    // Listen for difficulty changes
    if (difficultySelect) {
        difficultySelect.value = currentDifficulty; // Set initial value
        difficultySelect.addEventListener('change', function() {
            currentDifficulty = difficultySelect.value;
            startGame(); // Restart game with new difficulty
        });
    }

    // --- Mobile Controls for Touch Devices ---
    // These buttons let users play on phones/tablets without a keyboard.
    if (btnLeft && btnRight && btnRotate && btnDrop) {
        // Move left
        function moveLeft(e) {
            e.preventDefault();
            if (!gameOver && validMove(-1, 0)) {
                pos.x--;
                drawBoard();
                dropStart = Date.now(); // Reset drop timer
            }
        }
        btnLeft.addEventListener('touchstart', moveLeft);
        btnLeft.addEventListener('click', moveLeft);

        // Move right
        function moveRight(e) {
            e.preventDefault();
            if (!gameOver && validMove(1, 0)) {
                pos.x++;
                drawBoard();
                dropStart = Date.now();
            }
        }
        btnRight.addEventListener('touchstart', moveRight);
        btnRight.addEventListener('click', moveRight);

        // Rotate
        function rotatePiece(e) {
            e.preventDefault();
            if (!gameOver) {
                const rotated = rotate(current.shape);
                if (validMove(0, 0, rotated)) {
                    current.shape = rotated;
                    drawBoard();
                    dropStart = Date.now();
                }
            }
        }
        btnRotate.addEventListener('touchstart', rotatePiece);
        btnRotate.addEventListener('click', rotatePiece);

        // Drop
        function dropPiece(e) {
            e.preventDefault();
            if (!gameOver) {
                while (validMove(0, 1)) pos.y++;
                drawBoard();
                dropStart = Date.now();
            }
        }
        btnDrop.addEventListener('touchstart', dropPiece);
        btnDrop.addEventListener('click', dropPiece);
    }

    // Get the game over overlay element
    const gameOverOverlay = document.getElementById('game-over-overlay'); // Use correct id from HTML

    // Add this function so the game does not crash
    function hideGameOverOverlay() {
        if (gameOverOverlay) {
            gameOverOverlay.style.display = 'none';
            gameOverOverlay.classList.remove('active');
        }
    }

    // Add this function so the game does not crash
    function showGameOverOverlay() {
        if (gameOverOverlay) {
            gameOverOverlay.style.display = 'flex';
            gameOverOverlay.classList.add('active');
        }
    }

    // Add this function so the game does not crash
    function updateLevelDisplay() {
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${level}`;
        }
    }

    // Show the bucket fill animation when lines are cleared
    function showBucketFill(lines) {
        if (!bucketAnim || !bucketWater) return;
        bucketAnim.style.display = 'block';
        bucketWater.style.height = '0';
        setTimeout(() => {
            bucketWater.style.height = `${Math.min(56, 16 * lines)}px`;
        }, 50);
        setTimeout(() => {
            bucketAnim.style.display = 'none';
            bucketWater.style.height = '0';
        }, 950);
    }

    // Show the jerrycan bonus animation
    function showJerryCanBonus() {
        if (!jerryCanAnim) return;
        jerryCanAnim.style.display = 'block';
        jerryCanAnim.children[0].style.animation = 'none';
        void jerryCanAnim.children[0].offsetWidth;
        jerryCanAnim.children[0].style.animation = 'jerry-bounce 0.7s cubic-bezier(.34,1.8,.64,1) forwards';
        setTimeout(() => { jerryCanAnim.style.display = 'none'; }, 720);
    }

    // Show the mud splatter animation
    function showMudSplatter() {
        if (!mudSplatterAnim) return;
        mudSplatterAnim.style.display = 'block';
        mudSplatterAnim.children[0].style.animation = 'none';
        void mudSplatterAnim.children[0].offsetWidth;
        mudSplatterAnim.children[0].style.animation = 'mud-fade 0.5s cubic-bezier(.64,0,.34,1) forwards';
        setTimeout(() => { mudSplatterAnim.style.display = 'none'; }, 520);
    }

    // Helper to update the water meter bar
    function updateWaterMeter(liters) {
        // For beginners: 0 liters = empty, 2000 liters = full bar
        const maxLiters = 2000;
        let percent = Math.min(100, Math.round((liters / maxLiters) * 100));
        if (waterFill) {
            waterFill.style.width = `${percent}%`;
        }
    }

    // Helper function to animate a drop icon with a squirt/ripple effect
    function popDrop(el) {
      el.classList.add('active');
      setTimeout(() => el.classList.remove('active'), 200);
    }

    // === DOM PIPE BLOCK DEMO FOR BEGINNERS ===
    // This is a simple demo to show how to render pipe blocks using DOM and images.
    // It does not replace the canvas game, but helps beginners understand DOM-based rendering.
    window.renderPipeBoardDemo = function() {
      // Example 2D array of pipe types ("straight", "corner", "t", "cross", or null)
      const demoBoard = [
        ["straight", "straight", "corner", null, null],
        [null, "t", "straight", "corner", null],
        ["cross", null, "straight", null, "corner"],
        ["corner", "straight", null, "t", null],
        [null, null, "corner", "straight", "straight"]
      ];
      const boardDiv = document.getElementById('board');
      if (!boardDiv) return;
      boardDiv.innerHTML = '';
      for (let row = 0; row < demoBoard.length; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        for (let col = 0; col < demoBoard[row].length; col++) {
          const type = demoBoard[row][col];
          const block = document.createElement('div');
          block.className = 'block';
          if (type === 'straight') {
            block.style.backgroundImage = "url('img/pipe-straight.png')";
          } else if (type === 'corner') {
            block.style.backgroundImage = "url('img/pipe-corner.png')";
          } else if (type === 't') {
            block.style.backgroundImage = "url('img/pipe-t.png')";
          } else if (type === 'cross') {
            block.style.backgroundImage = "url('img/pipe-cross.png')";
          } else {
            block.style.backgroundColor = '#eee';
          }
          rowDiv.appendChild(block);
        }
        boardDiv.appendChild(rowDiv);
      }
    }
}

// At the end of the file, after all function definitions:
window.onload = function() {
  // If all images are already loaded (from cache), loadedCount will be SHAPES.length
  if (loadedCount === SHAPES.length) {
    initGame();
  }
  // Otherwise, initGame will be called by the last image's onload
};

    // Draw a tetromino piece using its image
    function drawPiece(type, shape, offsetX, offsetY, ctx = context) {
        // shape is an array of [dx, dy] pairs for each block in the piece
        shape.forEach(([dx, dy]) => {
            const px = (offsetX + dx) * BLOCK_SIZE;
            const py = (offsetY + dy) * BLOCK_SIZE;
            ctx.drawImage(
                tetrominoImages[type],
                px, py,
                BLOCK_SIZE, BLOCK_SIZE
            );
        });
    }
