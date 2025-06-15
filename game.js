const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Game constants
const SCROLL_SPEED = 120;
const GRAVITY = 1000;
const JUMP_FORCE = -550; // higher jump
const MAX_FALL_SPEED = 600;
const CANDLE_WIDTH = 20;
const CANDLE_MIN_HEIGHT = 40;
const CANDLE_MAX_HEIGHT = 80;
const CANDLE_MIN_GAP = 180;
const MAX_JUMP_HOLD = 0.35; // hold longer

// Game state
let score = 0;
let lastTime = performance.now() / 1000;

const kongy = {
  x: 100,
  y: 300,
  width: 40,
  height: 40,
  vy: 0,
  jumping: false
};

let candles = [];
let powerUps = [];
let timeSinceLastCandle = 0;
let timeSinceLastPowerUp = 0;
let powerUpActive = false;
let powerUpTimer = 0;
let gameOver = false;
let jumpPressed = false;
let lastJumpTime = 0;
let spaceHeld = false;
let jumpHoldTime = 0;

// DOM
const overlay = document.getElementById("gameOverOverlay");
const restartBtn = document.getElementById("restartBtn");
const finalScoreText = document.getElementById("finalScoreText");

// Controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!spaceHeld) {
      jumpPressed = true;
      lastJumpTime = Date.now();
    }
    spaceHeld = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    spaceHeld = false;
    if (kongy.vy < 0 && jumpHoldTime < MAX_JUMP_HOLD) {
      kongy.vy *= 0.5; // smoother short-jump
    }
  }
});

function spawnCandle() {
  const height = Math.random() * (CANDLE_MAX_HEIGHT - CANDLE_MIN_HEIGHT) + CANDLE_MIN_HEIGHT;
  const color = Math.random() < 0.7 ? "green" : "red";
  candles.push({
    x: canvas.width,
    y: canvas.height - height,
    width: CANDLE_WIDTH,
    height: height,
    color: color
  });
}

function spawnPowerUp() {
  powerUps.push({
    x: canvas.width,
    y: Math.random() * 150 + 100,
    width: 20,
    height: 20,
    active: true
  });
}

function update(dt) {
  if (gameOver) return;

  // Gravity
  kongy.vy += GRAVITY * dt;
  if (kongy.vy > MAX_FALL_SPEED) kongy.vy = MAX_FALL_SPEED;
  kongy.y += kongy.vy * dt;

  if (kongy.y + kongy.height >= canvas.height) {
    kongy.y = canvas.height - kongy.height;
    kongy.jumping = false;
  }

  // Jump logic
  if (!kongy.jumping && jumpPressed && Date.now() - lastJumpTime < 150) {
    kongy.vy = JUMP_FORCE;
    kongy.jumping = true;
    jumpPressed = false;
    jumpHoldTime = 0;
  }

  if (kongy.jumping && spaceHeld) {
    jumpHoldTime += dt;
  }

  // Move candles
  candles.forEach(c => c.x -= SCROLL_SPEED * dt);
  candles = candles.filter(c => c.x + c.width > 0);

  timeSinceLastCandle += dt;
  const lastCandle = candles[candles.length - 1];
  if (
    timeSinceLastCandle > 0.8 &&
    (!lastCandle || canvas.width - lastCandle.x > CANDLE_MIN_GAP + Math.random() * 60)
  ) {
    spawnCandle();
    timeSinceLastCandle = 0;
  }

  // Move power-ups
  powerUps.forEach(p => p.x -= SCROLL_SPEED * dt);
  powerUps = powerUps.filter(p => p.x + p.width > 0);

  timeSinceLastPowerUp += dt;
  if (timeSinceLastPowerUp > 5) {
    spawnPowerUp();
    timeSinceLastPowerUp = 0;
  }

  // Power-up collision
  powerUps.forEach((p) => {
    if (
      p.active &&
      kongy.x < p.x + p.width &&
      kongy.x + kongy.width > p.x &&
      kongy.y < p.y + p.height &&
      kongy.y + kongy.height > p.y
    ) {
      powerUpActive = true;
      powerUpTimer = 10;
      p.active = false;
    }
  });

  if (powerUpActive) {
    powerUpTimer -= dt;
    if (powerUpTimer <= 0) powerUpActive = false;
  }

  // Collision with candles
  for (let c of candles) {
    if (
      kongy.x < c.x + c.width &&
      kongy.x + kongy.width > c.x &&
      kongy.y + kongy.height > c.y
    ) {
      gameOver = true;
      finalScoreText.innerText = `Your Score: ${Math.floor(score)}`;
      overlay.style.display = "block";
      return;
    }
  }

  // Score (time-based)
  score += dt * (powerUpActive ? 120 : 60);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Kongy
  ctx.fillStyle = "orange";
  ctx.fillRect(kongy.x, kongy.y, kongy.width, kongy.height);

  // Candles
  candles.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.width, c.height);
  });

  // Power-ups
  powerUps.forEach(p => {
    if (p.active) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.ellipse(p.x + 10, canvas.height - 5, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(p.x + 10, p.y + 10, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.font = "10px monospace";
      ctx.fillText("x2", p.x + 3, p.y + 14);
    }
  });

  // Score
  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.fillText("Score: " + Math.floor(score), 680, 30);

  if (powerUpActive) {
    ctx.fillStyle = "yellow";
    ctx.font = "bold 22px monospace";
    ctx.fillText("💥 2X PUMP MODE! 💥", 270, 50);
  }
}

function gameLoop(currentTime) {
  const now = currentTime / 1000;
  const dt = Math.min(now - lastTime, 0.05); // clamp to 50ms
  lastTime = now;

  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Restart
restartBtn.onclick = () => {
  score = 0;
  candles = [];
  powerUps = [];
  kongy.y = 300;
  kongy.vy = 0;
  kongy.jumping = false;
  timeSinceLastCandle = 0;
  timeSinceLastPowerUp = 0;
  powerUpTimer = 0;
  powerUpActive = false;
  jumpHoldTime = 0;
  gameOver = false;
  overlay.style.display = "none";
  lastTime = performance.now() / 1000;
  requestAnimationFrame(gameLoop);
};
