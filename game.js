const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gravity = 0.5;
const jumpPower = -14;
const maxFallSpeed = 8;
let score = 0;

// Game timing
let lastTime = performance.now();

// Kongy
const kongy = {
  x: 100,
  y: 300,
  width: 40,
  height: 40,
  vy: 0,
  jumping: false
};

// Game state
let candles = [];
let powerUps = [];
let candleTimer = 0;
let nextCandleIn = Math.floor(Math.random() * 60) + 60;
let powerUpActive = false;
let powerUpTimer = 0;
let powerUpTimerGlobal = 0;
let nextPowerUpIn = Math.floor(Math.random() * 300) + 500;
let jumpPressed = false;
let lastJumpTime = 0;
let gameOver = false;

// DOM elements
const overlay = document.getElementById("gameOverOverlay");
const restartBtn = document.getElementById("restartBtn");
const finalScoreText = document.getElementById("finalScoreText");

// Controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    jumpPressed = true;
    lastJumpTime = Date.now();
  }
});

function spawnCandle() {
  const height = Math.random() * 40 + 40;
  const color = Math.random() < 0.7 ? "green" : "red";
  candles.push({
    x: canvas.width,
    y: canvas.height - height,
    width: 20,
    height: height,
    color: color
  });
}

function update(deltaTime) {
  if (gameOver) return;

  // Physics
  kongy.vy += gravity;
  if (kongy.vy > maxFallSpeed) kongy.vy = maxFallSpeed;
  kongy.y += kongy.vy;

  if (kongy.y + kongy.height >= canvas.height) {
    kongy.y = canvas.height - kongy.height;
    kongy.jumping = false;
  }

  if (!kongy.jumping && jumpPressed && Date.now() - lastJumpTime < 150) {
    kongy.vy = jumpPower;
    kongy.jumping = true;
    jumpPressed = false;
  }

  // Move candles
  candles.forEach(c => c.x -= 3.5 * deltaTime);
  candles = candles.filter(c => c.x + c.width > 0);

  // Spawn candles
  candleTimer++;
  if (candleTimer >= nextCandleIn) {
    spawnCandle();
    candleTimer = 0;
    nextCandleIn = Math.floor(Math.random() * 60) + 60;
  }

  // Spawn power-ups
  powerUpTimerGlobal++;
  if (powerUpTimerGlobal >= nextPowerUpIn) {
    powerUps.push({
      x: canvas.width,
      y: Math.floor(Math.random() * 150) + 100,
      width: 20,
      height: 20,
      active: true
    });
    powerUpTimerGlobal = 0;
    nextPowerUpIn = Math.floor(Math.random() * 300) + 500;
  }

  // Move power-ups
  powerUps.forEach(p => p.x -= 3.5 * deltaTime);
  powerUps = powerUps.filter(p => p.x + p.width > 0);

  // Collect power-ups
  powerUps.forEach((p) => {
    if (
      p.active &&
      kongy.x < p.x + p.width &&
      kongy.x + kongy.width > p.x &&
      kongy.y < p.y + p.height &&
      kongy.y + kongy.height > p.y
    ) {
      powerUpActive = true;
      powerUpTimer = 600;
      p.active = false;
    }
  });

  if (powerUpActive) {
    powerUpTimer--;
    if (powerUpTimer <= 0) powerUpActive = false;
  }

  // Collision check
  for (let c of candles) {
    if (
      kongy.x < c.x + c.width &&
      kongy.x + kongy.width > c.x &&
      kongy.y + kongy.height > c.y
    ) {
      gameOver = true;
      finalScoreText.innerText = `Your Score: ${score}`;
      overlay.style.display = "block";
      return;
    }
  }

  // Score
  score += powerUpActive ? 2 : 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "orange";
  ctx.fillRect(kongy.x, kongy.y, kongy.width, kongy.height);

  candles.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.width, c.height);
  });

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

  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.fillText("Score: " + score, 680, 30);

  if (powerUpActive) {
    ctx.fillStyle = "yellow";
    ctx.font = "bold 22px monospace";
    ctx.fillText("💥 2X PUMP MODE! 💥", 270, 50);
  }
}

function gameLoop(currentTime) {
  let deltaTime = (currentTime - lastTime) / (1000 / 60);
  if (deltaTime > 3) deltaTime = 1; // clamp for resume slowdowns
  lastTime = currentTime;

  update(deltaTime);
  draw();
  if (!gameOver) requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Restart
restartBtn.onclick = () => {
  score = 0;
  candles = [];
  powerUps = [];
  candleTimer = 0;
  powerUpTimerGlobal = 0;
  powerUpActive = false;
  powerUpTimer = 0;
  nextCandleIn = Math.floor(Math.random() * 60) + 60;
  nextPowerUpIn = Math.floor(Math.random() * 300) + 500;
  kongy.y = 300;
  kongy.vy = 0;
  kongy.jumping = false;
  gameOver = false;
  overlay.style.display = "none";
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
};
