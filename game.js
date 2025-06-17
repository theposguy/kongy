const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");

// ——— Load Kongy Sprite Sheet ———
const kongyImg = new Image();
kongyImg.src   = "kongy_sprites.png";
kongyImg.onload = () => console.log("✅ kongy_sprites.png loaded");

// sprite constants
const SPRITE_W     = 64;
const SPRITE_H     = 64;
const SPRITE_FRAMES= 4;
let spriteFrame   = 0;
let spriteTimer   = 0;
const SPRITE_SPEED= 0.1;

// physics & gameplay constants
const SCROLL_SPEED      = 300;
const GRAVITY           = 1200;
const JUMP_FORCE        = -800;
const MAX_FALL_SPEED    = 1000;
const CANDLE_W          = 20;
const CANDLE_MIN_H      = 40;
const CANDLE_MAX_H      = 80;
const CANDLE_MIN_GAP    = 300;
const MAX_JUMP_HOLD     = 0.2;
const BASE_SCORE_RATE   = 60;

// state
let score           = 0;
let lastTime        = performance.now()/1000;
let scoreMult       = 1;
let puTimer         = 0;
let gameOver        = false;

const kongy = { x:100, y:300, width:SPRITE_W, height:SPRITE_H, vy:0, jumping:false };
let candles         = [];
let powerUps        = [];
let sinceCandle     = 0;
let sincePowerUp    = 0;

// input
let jumpPressed = false, lastJumpTime=0, spaceHeld=false, jumpHold=0;

// DOM
const overlay = document.getElementById("gameOverOverlay");
const restart = document.getElementById("restartBtn");
const finalScoreText = document.getElementById("finalScoreText");

document.addEventListener("keydown", e => {
  if (e.code==="Space") {
    if (!spaceHeld) { jumpPressed=true; lastJumpTime=Date.now(); }
    spaceHeld=true;
  }
});
document.addEventListener("keyup", e => {
  if (e.code==="Space") {
    spaceHeld=false;
    if (kongy.vy<0 && jumpHold<MAX_JUMP_HOLD) kongy.vy*=0.5;
  }
});

// spawners
function spawnCandle(){
  const h=Math.random()*(CANDLE_MAX_H-CANDLE_MIN_H)+CANDLE_MIN_H;
  const col=Math.random()<0.7?"green":"red";
  candles.push({ x:canvas.width, y:canvas.height-h, width:CANDLE_W, height:h, color:col });
}
function spawnPowerUp(){
  powerUps.push({ x:canvas.width, y:Math.random()*150+100, width:20, height:20, active:true });
}

// update
function update(dt){
  if(gameOver) return;

  // physics
  kongy.vy+=GRAVITY*dt;
  if(kongy.vy>MAX_FALL_SPEED) kongy.vy=MAX_FALL_SPEED;
  kongy.y+=kongy.vy*dt;
  if(kongy.y+kongy.height>=canvas.height){
    kongy.y=canvas.height-kongy.height;
    kongy.jumping=false;
  }

  // jump
  if(!kongy.jumping && jumpPressed && Date.now()-lastJumpTime<150){
    kongy.vy=JUMP_FORCE;
    kongy.jumping=true;
    jumpPressed=false; jumpHold=0;
  }
  if(kongy.jumping && spaceHeld){
    jumpHold+=dt;
    if(jumpHold>MAX_JUMP_HOLD) spaceHeld=false;
  }

  // candles
  candles.forEach(c=>c.x-=SCROLL_SPEED*dt);
  candles=candles.filter(c=>c.x+c.width>0);
  sinceCandle+=dt;
  const lastC=candles[candles.length-1];
  if(sinceCandle>1 && (!lastC||canvas.width-lastC.x>CANDLE_MIN_GAP+Math.random()*100)){
    spawnCandle(); sinceCandle=0;
  }

  // power-ups
  powerUps.forEach(p=>p.x-=SCROLL_SPEED*dt);
  powerUps=powerUps.filter(p=>p.x+p.width>0);
  sincePowerUp+=dt;
  if(sincePowerUp>6){ spawnPowerUp(); sincePowerUp=0; }

  // collect
  powerUps.forEach(p=>{
    if(p.active &&
       kongy.x<p.x+p.width &&
       kongy.x+kongy.width>p.x &&
       kongy.y<p.y+p.height &&
       kongy.y+kongy.height>p.y){
      scoreMult++;
      puTimer=10;
      p.active=false;
    }
  });
  if(scoreMult>1){
    puTimer-=dt;
    if(puTimer<=0) scoreMult=1;
  }

  // collision
  for(let c of candles){
    if(kongy.x<c.x+c.width &&
       kongy.x+kongy.width>c.x &&
       kongy.y+kongy.height>c.y){
      gameOver=true;
      finalScoreText.innerText=`Your Score: ${Math.floor(score)}`;
      overlay.style.display="block";
      return;
    }
  }

  // scoring
  score += BASE_SCORE_RATE*scoreMult*dt;

  // sprite advance
  spriteTimer+=dt;
  if(spriteTimer>SPRITE_SPEED){
    spriteFrame=(spriteFrame+1)%SPRITE_FRAMES;
    spriteTimer=0;
  }
}

// draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw sprite
  ctx.drawImage(
    kongyImg,
    spriteFrame*SPRITE_W, 0,
    SPRITE_W, SPRITE_H,
    kongy.x, kongy.y,
    kongy.width, kongy.height
  );

  // candles
  candles.forEach(c=>{
    ctx.fillStyle=c.color;
    ctx.fillRect(c.x,c.y,c.width,c.height);
  });

  // power-ups
  powerUps.forEach(p=>{
    if(p.active){
      ctx.fillStyle="rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(p.x+10,canvas.height-5,12,4,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="gold";
      ctx.beginPath();
      ctx.arc(p.x+10,p.y+10,10,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#000";
      ctx.font="10px monospace";
      ctx.fillText(`×${scoreMult}`,p.x+2,p.y+14);
    }
  });

  // UI
  ctx.fillStyle="white";
  ctx.font="18px monospace";
  ctx.fillText(`Score: ${score.toFixed(1)}`,600,30);
  ctx.fillStyle="cyan";
  ctx.font="14px monospace";
  ctx.fillText(`Rate: ${Math.round(BASE_SCORE_RATE*scoreMult)} pps`,600,50);
  if(scoreMult>1){
    ctx.fillStyle="yellow";
    ctx.font="bold 22px monospace";
    ctx.fillText(`💥 ${scoreMult}X PUMP MODE!`,250,80);
  }
}

// main loop
function gameLoop(ts){
  const now=ts/1000;
  const dt=Math.min(now-lastTime,0.05);
  lastTime=now;
  update(dt);
  draw();
  if(!gameOver) requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// restart
restart.onclick=()=>{
  score=0; scoreMult=1; candles=[]; powerUps=[];
  kongy.y=300; kongy.vy=0; kongy.jumping=false;
  sinceCandle=0; sincePowerUp=0; puTimer=0; gameOver=false;
  overlay.style.display="none";
  lastTime=performance.now()/1000;
  requestAnimationFrame(gameLoop);
};
