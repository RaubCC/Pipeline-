// Charity: water Pipe Tetris - Fun Edition

window.addEventListener('DOMContentLoaded', function() {
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
    const factRotator = document.getElementById('fact-rotator');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnDrop = document.getElementById('btn-drop');
    const linesToNext = document.getElementById('lines-to-next');
    const howToModal = document.getElementById('how-to-modal');
    const closeHowTo = document.getElementById('close-how-to');
    const sidebarToggle = document.getElementById('sidebar-toggle');

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

    // Game state
    let board, current, next, pos, liters, dropStart, gameOver, linesCleared, level, linesToNextLevel, mudChance, dropSpeeds, paused;
    let factIndex = 0;

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
    function drawBlock(x, y, color, ctx = context) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        // Draw can icon if Jerry Can
        if (color === COLORS[8]) {
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
        // Draw mud icon if mud block
        if (color === COLORS[9]) {
            ctx.fillStyle = '#6B3E14';
            ctx.beginPath();
            ctx.arc(x * BLOCK_SIZE + BLOCK_SIZE/2, y * BLOCK_SIZE + BLOCK_SIZE/2, BLOCK_SIZE/4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    function drawBoard() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < ROWS; ++y)
            for (let x = 0; x < COLS; ++x)
                if (board[y][x])
                    drawBlock(x, y, COLORS[board[y][x]]);
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
        // Show a fact in the popup or sidebar
        if (fact) {
            factText.textContent = fact;
            factPopup.style.display = 'block';
            paused = true; // Pause the game while popup is visible
            pauseBtn.textContent = 'Resume';
        } else {
            // Show a random rotating fact in the sidebar
            factRotator.textContent = WATER_FACTS[factIndex];
            factIndex = (factIndex + 1) % WATER_FACTS.length;
        }
    }

    function mergeTetromino() {
        if (current.index === 8) {
            // Jerry Can: clear this row instantly and double liters
            let clearRow = pos.y;
            for (let x = 0; x < COLS; x++) {
                board[clearRow][x] = 0;
            }
            liters += 400;
            showFact("JERRY CAN POWER! Doubled liters for this row!");
        } else if (current.index === 9) {
            // Mud block: place on board, reduce liters
            board[pos.y][pos.x] = 9;
            liters = Math.max(0, liters - 100);
            deliveredDisplay.textContent = `Liters Delivered: ${liters}`;
            showFact("Oh no! Mud block! -100 liters delivered.");
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
        if (linesCleared >= linesToNextLevel) {
            if (level < 5) {
                level++;
                linesCleared = 0;
                linesToNextLevel += 8;
                if (level === 2) { mudChance = 0.18; dropSpeeds[1] = 450; }
                if (level === 3) { mudChance = 0.28; dropSpeeds[2] = 350; }
                if (level === 4) { mudChance = 0.40; dropSpeeds[3] = 250; }
                if (level === 5) { mudChance = 0.55; dropSpeeds[4] = 150; }
                showFact(`Level Up! Welcome to Level ${level}.`);
                showConfetti();
                updateLevelDisplay();
            }
        }
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
        if (gameOver && e.key !== "Enter") return;
        if (e.key === "ArrowLeft" && validMove(-1, 0)) pos.x--;
        if (e.key === "ArrowRight" && validMove(1, 0)) pos.x++;
        if (e.key === "ArrowDown" && validMove(0, 1)) pos.y++;
        if (e.key === "ArrowUp") {
            const rotated = rotate(current.shape);
            if (validMove(0, 0, rotated)) current.shape = rotated;
        }
        if (e.key === " ") {
            while (validMove(0, 1)) pos.y++;
        }
        if (e.key === "Enter" && gameOver) {
            startGame();
            factPopup.style.display = 'none';
        }
        drawBoard();
    }
    document.addEventListener('keydown', function(e) {
        // Prevent arrow keys and space from scrolling the page
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
            e.preventDefault();
        }
        handleKey(e);
    });

    pauseBtn.onclick = function() {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        if (!paused) drop();
    };
    sidebarToggle.onclick = function() {
        sidebar.classList.toggle('collapsed');
    };
    document.getElementById('instructions').onclick = function() {
        howToModal.style.display = 'flex';
    };
    closeHowTo.onclick = function() {
        howToModal.style.display = 'none';
    };

    // Allow user to close the fact popup and return to the game
    closeFact.addEventListener('click', function() {
        factPopup.style.display = 'none';
        paused = false; // Resume the game
        pauseBtn.textContent = 'Pause';
        drop(); // Resume the drop loop if needed
    });

    function startGame() {
        liters = 0;
        linesCleared = 0;
        level = 1;
        linesToNextLevel = 8;
        mudChance = 0.10;
        dropSpeeds = [600, 450, 350, 250, 150];
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
    function updateLevelDisplay() {
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${level}`;
        }
    }

    // Start the game
    startGame();
});
