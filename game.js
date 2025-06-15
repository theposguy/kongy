const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ——— Tuned Constants ———
const SCROLL_SPEED    = 180;   // px/sec (was 120)
const GRAVITY         = 800;   // px/sec² (was 1000)
const JUMP_FORCE      = -700;  // px/sec initial (was -550)
const MAX_FALL_SPEED  = 800;   // px/sec (was 600)
const CANDLE_WIDTH    = 20;
const CANDLE_MIN_HEIGHT = 40;
const CANDLE_MAX_HEIGHT = 80;
const CANDLE_MIN_GAP  = 250;   // px (was 180)
const MAX_JUMP_HOLD   = 0.5;   // sec (was 0.35)

let score = 0;
let lastTime = performance.now() / 1000;

const kongy = {
  x: 100, y: 300, width: 40, height: 40,
  vy: 0, jumping: false
};

let candles = [];
let powerUps = [];
let timeSinceLastCandle = 0;
let timeSinceLastPowerUp = 0;
let powerUpActive = false;
let powerUpTimer = 0;
let gameOver = false;

// Jump control
let jumpPressed = false;
let lastJumpTime  = 0;
let spaceHeld     = false;
let jumpHoldTime  = 0;

// DOM
const overlay         = document.getElementById("gameOverOverlay");
const restartBtn      = document.getElementById("restartBtn");
const finalScoreText  = document.getElementById("finalScoreText");

// ——— Input Listeners ———
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    if (!spaceHeld) {
      jumpPressed   = true;
      lastJumpTime  = Date.now();
    }
    spaceHeld = true;
  }
});
document.addEventListener("keyup", e => {
  if (e.code === "Space") {
    spaceHeld = false;
    // if released early, dampen upward velocity
    if (kongy.vy < 0 && jumpHoldTime < MAX_JUMP_HOLD) {
      kongy.vy *= 0.5;
    }
  }
});

// ——— Spawning ———
function spawnCandle() {
  const h     = Math.random() * (CANDLE_MAX_HEIGHT - CANDLE_MIN_HEIGHT) + CANDLE_MIN_HEIGHT;
  const col   = Math.random() < 0.7 ? "green" : "red";
  candles.push({ x: canvas.width, y: canvas.height - h, width: CANDLE_WIDTH, height: h, color: col });
}
function spawnPowerUp() {
  powerUps.push({ x: canvas.width, y: Math.random() * 150 + 100, width:20, height:20, active:true });
}

// ——— Update Loop ———
function update(dt) {
  if (gameOver) return;

  // gravity & fall
  kongy.vy += GRAVITY * dt;
  if (kongy.vy > MAX_FALL_SPEED) kongy.vy = MAX_FALL_SPEED;
  kongy.y += kongy.vy * dt;
  if (kongy.y + kongy.height >= canvas.height) {
    kongy.y = canvas.height - kongy.height;
    kongy.jumping = false;
  }

  // initial jump trigger
  if (!kongy.jumping && jumpPressed && Date.now() - lastJumpTime < 150) {
    kongy.vy = JUMP_FORCE;
    kongy.jumping = true;
    jumpPressed     = false;
    jumpHoldTime    = 0;
  }
  // extend jump while holding
  if (kongy.jumping && spaceHeld) {
    jumpHoldTime += dt;
    if (jumpHoldTime > MAX_JUMP_HOLD) spaceHeld = false;
  }

  // candles movement
  candles.forEach(c => c.x -= SCROLL_SPEED * dt);
  candles = candles.filter(c => c.x + c.width > 0);

  // spawn new candle if enough time & distance passed
  timeSinceLastCandle += dt;
  const lastC = candles[candles.length -1];
  if (
    timeSinceLastCandle > 1.0 && 
    (!lastC || canvas.width - lastC.x > CANDLE_MIN_GAP + Math.random() * 80)
  ) {
    spawnCandle();
    timeSinceLastCandle = 0;
  }

  // power-ups movement & spawn
  powerUps.forEach(p => p.x -= SCROLL_SPEED * dt);
  powerUps = powerUps.filter(p => p.x + p.width > 0);
  timeSinceLastPowerUp += dt;
  if (timeSinceLastPowerUp > 6) {
    spawnPowerUp();
    timeSinceLastPowerUp = 0;
  }

  // power-up collision
  powerUps.forEach(p => {
    if (
      p.active &&
      kongy.x < p.x + p.width &&
      kongy.x + kongy.width > p.x &&
      kongy.y < p.y + p.height &&
      kongy.y + kongy.height > p.y
    ) {
      powerUpActive  = true;
      powerUpTimer   = 10;
      p.active       = false;
    }
  });
  if (powerUpActive) {
    powerUpTimer -= dt;
    if (powerUpTimer <= 0) powerUpActive = false;
  }

  // collision with candles
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

  // time-based scoring
  score += dt * (powerUpActive ? 120 : 60);
}

// ——— Draw Loop ———
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
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(p.x+10, canvas.height-5, 12,4,0,0,Math.PI*2);
      ctx.fill();
      // coin
      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(p.x+10, p.y+10, 10,0,Math.PI*2);
      ctx.fill();
      // label
      ctx.fillStyle = "#000";
      ctx.font = "10px monospace";
      ctx.fillText("x2", p.x+3, p.y+14);
    }
  });

  // score
  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.fillText("Score: " + Math.floor(score), 680, 30);

  if (powerUpActive) {
    ctx.fillStyle = "yellow";
    ctx.font = "bold 22px monospace";
    ctx.fillText("💥 2X PUMP MODE! 💥", 270, 50);
  }
}

// ——— Main Loop ———
function gameLoop(ts) {
  const now = ts/1000;
  const dt  = Math.min(now - lastTime, 0.05);
  lastTime  = now;

  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ——— Restart ———
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
  lastTime = performance.now()/1000;
  requestAnimationFrame(gameLoop);
};
