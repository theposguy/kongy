const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gravity = 0.5;
const jumpPower = -14;
const maxFallSpeed = 8;
let score = 0;

// Kongy character
const kongy = {
  x: 100,
  y: 300,
  width: 40,
  height: 40,
  vy: 0,
  jumping: false
};

// Game objects
let candles = [];
let powerUps = [];
let candleTimer = 0;
let nextCandleIn = Math.floor(Math.random() * 60) + 60;
let powerUpActive = false;
let powerUpTimer = 0;

// Jump buffer
let jumpPressed = false;
let lastJumpTime = 0;

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

  // 20% chance to spawn power-up on green candle
  if (color === "green" && Math.random() < 0.2) {
    powerUps.push({
      x: canvas.width + 5,
      y: canvas.height - height - 25,
      width: 20,
      height: 20,
      active: true
    });
  }
}

function update() {
  // Jump physics
  kongy.vy += gravity;
  if (kongy.vy > maxFallSpeed) kongy.vy = maxFallSpeed;
  kongy.y += kongy.vy;

  if (kongy.y + kongy.height >= canvas.height) {
    kongy.y = canvas.height - kongy.height;
    kongy.jumping = false;
  }

  // Jump buffer
  if (!kongy.jumping && jumpPressed && Date.now() - lastJumpTime < 150) {
    kongy.vy = jumpPower;
    kongy.jumping = true;
    jumpPressed = false;
  }

  // Move candles
  candles.forEach(c => c.x -= 3.5);
  candles = candles.filter(c => c.x + c.width > 0);

  // Spawn candles at random intervals
  candleTimer++;
  if (candleTimer >= nextCandleIn) {
    spawnCandle();
    candleTimer = 0;
    nextCandleIn = Math.floor(Math.random() * 60) + 60;
  }

  // Move power-ups
  powerUps.forEach(p => p.x -= 3.5);
  powerUps = powerUps.filter(p => p.x + p.width > 0);

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
      powerUpTimer = 600; // 10 seconds
      p.active = false;
    }
  });

  // Power-up timer
  if (powerUpActive) {
    powerUpTimer--;
    if (powerUpTimer <= 0) powerUpActive = false;
  }

  // Collision detection (candles)
  candles.forEach(c => {
    if (
      kongy.x < c.x + c.width &&
      kongy.x + kongy.width > c.x &&
      kongy.y + kongy.height > c.y
    ) {
      alert("Game Over!\nScore: " + score);
      window.location.reload();
    }
  });

  // Scoring
  score += powerUpActive ? 2 : 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Kongy (placeholder)
  ctx.fillStyle = "orange";
  ctx.fillRect(kongy.x, kongy.y, kongy.width, kongy.height);

  // Candles
  candles.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.width, c.height);
  });

  // Power-Ups
  powerUps.forEach(p => {
    if (p.active) {
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
  ctx.fillText("Score: " + score, 680, 30);

  // Pump Mode Message
  if (powerUpActive) {
    ctx.fillStyle = "yellow";
    ctx.font = "bold 22px monospace";
    ctx.fillText("💥 2X PUMP MODE! 💥", 270, 50);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
