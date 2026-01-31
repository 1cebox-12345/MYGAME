const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// ============ AUDIO SYSTEM ============
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let isMuted = false;
let musicPlaying = false;
let musicInterval = null;

// Initialize audio on first user interaction
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Sound effect: Eat food
function playEatSound() {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
}

// Sound effect: Game Over
function playGameOverSound() {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
}

// Background Music - Synthwave style
const musicNotes = [
    { freq: 130.81, dur: 0.2 }, // C3
    { freq: 164.81, dur: 0.2 }, // E3
    { freq: 196.00, dur: 0.2 }, // G3
    { freq: 261.63, dur: 0.2 }, // C4
    { freq: 196.00, dur: 0.2 }, // G3
    { freq: 164.81, dur: 0.2 }, // E3
    { freq: 146.83, dur: 0.2 }, // D3
    { freq: 174.61, dur: 0.2 }, // F3
];
let musicNoteIndex = 0;

function playMusicNote() {
    if (!audioCtx || isMuted || !musicPlaying) return;

    const note = musicNotes[musicNoteIndex];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + note.dur);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + note.dur);

    musicNoteIndex = (musicNoteIndex + 1) % musicNotes.length;
}

function startMusic() {
    if (musicPlaying) return;
    initAudio();
    musicPlaying = true;
    musicInterval = setInterval(playMusicNote, 250);
}

function stopMusic() {
    musicPlaying = false;
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

function toggleMute() {
    // Initialize audio on first interaction
    initAudio();

    isMuted = !isMuted;
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
    }
    if (isMuted) {
        stopMusic();
    } else {
        // Play a test beep to confirm audio works
        playEatSound();
        startMusic();
    }
}

// ============ GAME SETTINGS ============
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let score = 0;

// Snake
let snake = [
    { x: 10, y: 10 }, // Head
    { x: 9, y: 10 },
    { x: 8, y: 10 }
];
let dx = 1;
let dy = 0;

// Food
let food = { x: 15, y: 15 };

// Game Loop
function drawGame() {
    changeSnakePosition();
    let result = isGameOver();
    if (result) {
        return;
    }

    clearScreen();

    checkAppleCollision();
    drawApple();
    drawSnake();

    setTimeout(drawGame, 100); // 10 FPS
}

function clearScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = '#0f0'; // Green body
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0f0';

    snake.forEach((part) => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw Head distinctively
    const head = snake[0];
    ctx.fillStyle = '#ccffcc';
    ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize - 2, gridSize - 2);

    // Reset shadow
    ctx.shadowBlur = 0;
}

function drawApple() {
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
}

function changeSnakePosition() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop();
}

function checkAppleCollision() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        score++;
        scoreElement.innerText = score;
        snake.push({}); // Grow snake
        playEatSound(); // Play eat sound
        // Respawn food
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
    }
}

function isGameOver() {
    let gameOver = false;
    const head = snake[0];

    // Walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
    }

    // Body collision (skip head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
        }
    }

    if (gameOver) {
        stopMusic(); // Stop background music
        playGameOverSound(); // Play game over sound

        ctx.fillStyle = 'white';
        ctx.font = '50px Verdana';
        ctx.fillText('Game Over!', canvas.width / 6.5, canvas.height / 2);

        ctx.font = '20px Verdana';
        ctx.fillText('按空白鍵或按鈕重玩', canvas.width / 4.5, canvas.height / 2 + 40);

        // Show restart button for mobile
        document.getElementById('restart-btn').classList.add('visible');

        document.addEventListener('keydown', restartGame);
    }
    return gameOver;
}

function restartGame(event) {
    if (event.code === 'Space') {
        document.removeEventListener('keydown', restartGame);
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        score = 0;
        scoreElement.innerText = score;
        dx = 1; dy = 0;
        startMusic(); // Resume background music
        drawGame();
    }
}

// Input Control
document.body.addEventListener('keydown', keyDown);

function keyDown(event) {
    const key = event.key.toLowerCase();
    // Up
    if (event.keyCode == 38 || key === 'w') {
        moveUp();
    }
    // Down
    if (event.keyCode == 40 || key === 's') {
        moveDown();
    }
    // Left
    if (event.keyCode == 37 || key === 'a') {
        moveLeft();
    }
    // Right
    if (event.keyCode == 39 || key === 'd') {
        moveRight();
    }
}

function moveUp() { if (dy !== 1) { dx = 0; dy = -1; } }
function moveDown() { if (dy !== -1) { dx = 0; dy = 1; } }
function moveLeft() { if (dx !== 1) { dx = -1; dy = 0; } }
function moveRight() { if (dx !== -1) { dx = 1; dy = 0; } }

// Mobile Button Listeners
document.getElementById('btn-up').addEventListener('click', moveUp);
document.getElementById('btn-down').addEventListener('click', moveDown);
document.getElementById('btn-left').addEventListener('click', moveLeft);
document.getElementById('btn-right').addEventListener('click', moveRight);

// Prevent default touch behavior (scrolling) on buttons
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scroll/zoom
        btn.click(); // Trigger click
    }, { passive: false });
});

// Restart button for mobile
const restartBtn = document.getElementById('restart-btn');
restartBtn.addEventListener('click', () => {
    restartBtn.classList.remove('visible');
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    score = 0;
    scoreElement.innerText = score;
    dx = 1; dy = 0;
    startMusic(); // Resume background music
    drawGame();
});

// Swipe gesture support for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
    e.preventDefault();
}, { passive: false });

function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const minSwipeDistance = 30;

    // Determine if horizontal or vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                moveRight();
            } else {
                moveLeft();
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > minSwipeDistance) {
            if (diffY > 0) {
                moveDown();
            } else {
                moveUp();
            }
        }
    }
}

// Start Game
drawGame();

// Sound toggle button
const soundBtn = document.getElementById('sound-btn');
if (soundBtn) {
    soundBtn.addEventListener('click', toggleMute);
}

// Initialize audio and start music on first interaction
document.body.addEventListener('click', function initOnClick() {
    initAudio();
    startMusic();
    document.body.removeEventListener('click', initOnClick);
}, { once: true });

document.body.addEventListener('keydown', function initOnKey() {
    initAudio();
    startMusic();
    document.body.removeEventListener('keydown', initOnKey);
}, { once: true });
