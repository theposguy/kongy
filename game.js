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

// Candle pillars
let candles = [];
let candleTimer = 0;

// Jump control buffer
let jumpPressed = false;
let lastJumpTime = 0;

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    jumpPressed = true;
    lastJumpTime = Date.now();
  }
});

function spawnCandle() {
  const height = Math.random() * 40 + 40; // shorter candles
  const color = Math.random() < 0.7 ? "green" : "red";

  candles.push({
    x: canvas.width,
    y: canvas.height - height,
    width: 20,
    height: height,
    color: color
  });
}

function update() {
  // Apply gravity and clamp fall speed
  kongy.vy += gravity;
  if (kongy.vy > maxFallSpeed) kongy.vy = maxFallSpeed;
  kongy.y += kongy.vy;

  // Ground collision
  if (kongy.y + kongy.height >= canvas.height) {
    kongy.y = canvas.height - kongy.height;
    kongy.jumping = false;
  }

  // Buffered jump
  if (!kongy.jumping && jumpPressed && Date.now() - lastJumpTime < 150) {
    kongy.vy = jumpPower;
    kongy.jumping = true;
    jumpPressed = false;
    // Sound will be added here
  }

  // Update candle positions
  candles.forEach(c => c.x -= 3.5); // slower scrolling
  candles = candles.filter(c => c.x + c.width > 0);

  // Spawn new candles
  candleTimer++;
  if (candleTimer > 80) {
    spawnCandle();
    candleTimer = 0;
  }

  // Collision detection
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

  score++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Kongy (placeholder block)
  ctx.fillStyle = "orange";
  ctx.fillRect(kongy.x, kongy.y, kongy.width, kongy.height);

  // Draw candles
  candles.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.width, c.height);
  });

  // Score
  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.fillText("Score: " + score, 680, 30);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
