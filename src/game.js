/**
 * Neon Breakout Arcade - Core Game Engine
 * Pure Vanilla JavaScript (No React, No TypeScript)
 */

import { sound } from './audio.js';

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const COLORS = {
  bg: '#0a0e17',
  cyan: '#00f0ff',
  pink: '#ff2a85',
  emerald: '#00ff9d',
  amber: '#ffb800',
  purple: '#b55fe6',
  white: '#ffffff',
  red: '#ff3344',
  silver: '#94a3b8',
  gold: '#fbbf24',
};

const BRICK_COLORS = [
  COLORS.pink,
  COLORS.cyan,
  COLORS.emerald,
  COLORS.amber,
  COLORS.purple
];

// 4 Distinct Level Layouts
// 0: Empty, 1: Normal, 2: Armored (2 hits), 3: Armored Heavy (3 hits), 4: Explosive TNT, 5: Prism (Power-up guarantee), 6: Obsidian (Indestructible)
const LEVELS = [
  // Level 1: 霓虹矩陣 (Neon Matrix) - Clean introductory matrix
  {
    name: '霓虹矩陣 (NEON MATRIX)',
    rows: 5,
    cols: 10,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 5, 1, 4, 4, 1, 5, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    ballSpeed: 6.2
  },
  // Level 2: 雙重堡壘 (Twin Fortresses) - Armored shields with TNT cores
  {
    name: '雙重堡壘 (TWIN FORTRESSES)',
    rows: 6,
    cols: 10,
    grid: [
      [2, 2, 2, 0, 1, 1, 0, 2, 2, 2],
      [2, 4, 2, 0, 1, 1, 0, 2, 4, 2],
      [2, 2, 2, 0, 5, 5, 0, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 2, 1, 0, 0, 1, 2, 1, 0],
      [0, 0, 1, 1, 4, 4, 1, 1, 0, 0],
    ],
    ballSpeed: 6.6
  },
  // Level 3: 星核裂隙 (Core Fissure) - Diamond structure with indestructible pylons
  {
    name: '星核裂隙 (CORE FISSURE)',
    rows: 7,
    cols: 10,
    grid: [
      [0, 0, 0, 1, 5, 5, 1, 0, 0, 0],
      [0, 0, 1, 2, 4, 4, 2, 1, 0, 0],
      [0, 1, 2, 6, 2, 2, 6, 2, 1, 0],
      [1, 2, 4, 2, 5, 5, 2, 4, 2, 1],
      [0, 1, 2, 6, 2, 2, 6, 2, 1, 0],
      [0, 0, 1, 2, 4, 4, 2, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    ],
    ballSpeed: 7.0
  },
  // Level 4: 量子迷宮 (Quantum Labyrinth) - High density with armored layers and heavy TNT
  {
    name: '量子迷宮 (QUANTUM LABYRINTH)',
    rows: 7,
    cols: 10,
    grid: [
      [6, 3, 2, 1, 4, 4, 1, 2, 3, 6],
      [3, 2, 1, 5, 1, 1, 5, 1, 2, 3],
      [2, 1, 6, 1, 2, 2, 1, 6, 1, 2],
      [1, 5, 1, 4, 3, 3, 4, 1, 5, 1],
      [2, 1, 6, 1, 2, 2, 1, 6, 1, 2],
      [3, 2, 1, 5, 1, 1, 5, 1, 2, 3],
      [6, 3, 2, 1, 4, 4, 1, 2, 3, 6],
    ],
    ballSpeed: 7.4
  }
];

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // High DPI Retina Support
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvasDPI();

    // Game State
    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'LEVEL_CLEAR', 'GAME_OVER', 'VICTORY'
    this.levelIndex = 0;
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.highScore = parseInt(localStorage.getItem('neon_breakout_high') || '0', 10);

    // Paddle
    this.defaultPaddleWidth = 120;
    this.paddleHeight = 16;
    this.paddle = {
      x: CANVAS_WIDTH / 2 - this.defaultPaddleWidth / 2,
      y: CANVAS_HEIGHT - 38,
      width: this.defaultPaddleWidth,
      height: this.paddleHeight,
      targetWidth: this.defaultPaddleWidth,
      vx: 0,
      speed: 10,
    };

    // Balls list
    this.balls = [];
    this.isBallServed = false;

    // Bricks
    this.bricks = [];
    this.brickWidth = 70;
    this.brickHeight = 22;
    this.brickPadding = 8;
    this.brickOffsetTop = 64;
    this.brickOffsetLeft = 14;

    // Power-ups and Entities
    this.powerups = []; // falling capsules
    this.lasers = []; // player laser bolts
    this.particles = []; // hit particles
    this.floatingTexts = []; // score floaters

    // Active power-up timers
    this.activeEffects = {
      expand: 0,
      laser: 0,
      fireball: 0,
      slow: 0,
      shield: false,
    };

    // Screen Shake effect
    this.screenShakeTime = 0;
    this.screenShakeMagnitude = 0;

    // Input States
    this.keys = {
      left: false,
      right: false,
      space: false,
    };
    this.mouseX = CANVAS_WIDTH / 2;
    this.usingMouse = false;
    this.laserCooldown = 0;

    // Background Stars / Cyber Grid
    this.gridOffset = 0;

    // Event Listeners
    this.bindEvents();

    // Initialize First Level Layout (ready to start)
    this.loadLevel(0);

    // Start Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupCanvasDPI() {
    this.canvas.width = CANVAS_WIDTH * this.dpr;
    this.canvas.height = CANVAS_HEIGHT * this.dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.dpr = window.devicePixelRatio || 1;
      this.setupCanvasDPI();
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      sound.init();
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = true;
        this.usingMouse = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = true;
        this.usingMouse = false;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleActionTrigger();
      }
      if (e.code === 'KeyP') {
        this.togglePause();
      }
      if (e.code === 'KeyM') {
        this.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    // Mouse movement inside canvas
    const updateMousePos = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const x = (clientX - rect.left) * scaleX;
      this.mouseX = Math.max(this.paddle.width / 2, Math.min(CANVAS_WIDTH - this.paddle.width / 2, x));
      this.usingMouse = true;
    };

    this.canvas.addEventListener('mousemove', (e) => updateMousePos(e.clientX));
    window.addEventListener('mousemove', (e) => {
      if (this.state === 'PLAYING') {
        updateMousePos(e.clientX);
      }
    });

    this.canvas.addEventListener('click', () => {
      sound.init();
      this.handleActionTrigger();
    });

    // Touch support for mobile/tablet drag
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches && e.touches[0]) {
        updateMousePos(e.touches[0].clientX);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      sound.init();
      if (e.touches && e.touches[0]) {
        updateMousePos(e.touches[0].clientX);
        this.handleActionTrigger();
      }
    });
  }

  handleActionTrigger() {
    if (this.state === 'PLAYING') {
      if (!this.isBallServed) {
        this.launchBall();
      } else if (this.activeEffects.laser > 0 && this.laserCooldown <= 0) {
        this.fireLaser();
      }
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.updateUIOverlays();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.updateUIOverlays();
    }
  }

  toggleMute() {
    const isMuted = sound.toggleMute();
    const btn = document.getElementById('mute-btn');
    if (btn) {
      btn.innerHTML = isMuted
        ? '<span class="text-rose-400">🔇 靜音</span>'
        : '<span class="text-emerald-400">🔊 音效</span>';
    }
    return isMuted;
  }

  startGame() {
    sound.init();
    this.state = 'PLAYING';
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.levelIndex = 0;
    this.loadLevel(0);
    this.updateUIOverlays();
  }

  restartGame() {
    this.startGame();
  }

  nextLevel() {
    this.levelIndex++;
    if (this.levelIndex >= LEVELS.length) {
      // Completed all levels! Victory state
      this.state = 'VICTORY';
      sound.playLevelComplete();
    } else {
      this.state = 'PLAYING';
      this.loadLevel(this.levelIndex);
      sound.playPowerup();
    }
    this.updateUIOverlays();
  }

  loadLevel(levelIdx) {
    const levelData = LEVELS[levelIdx % LEVELS.length];
    this.bricks = [];
    this.balls = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.floatingTexts = [];
    this.isBallServed = false;
    this.combo = 0;

    // Reset paddle size and powerups
    this.paddle.targetWidth = this.defaultPaddleWidth;
    this.paddle.width = this.defaultPaddleWidth;
    this.paddle.x = CANVAS_WIDTH / 2 - this.paddle.width / 2;
    this.activeEffects = {
      expand: 0,
      laser: 0,
      fireball: 0,
      slow: 0,
      shield: false,
    };

    // Calculate grid layout centered horizontally
    const cols = levelData.cols;
    const totalGridWidth = cols * this.brickWidth + (cols - 1) * this.brickPadding;
    this.brickOffsetLeft = Math.floor((CANVAS_WIDTH - totalGridWidth) / 2);

    for (let r = 0; r < levelData.grid.length; r++) {
      for (let c = 0; c < levelData.grid[r].length; c++) {
        const type = levelData.grid[r][c];
        if (type === 0) continue;

        let maxHp = 1;
        let isArmored = false;
        let isExplosive = false;
        let isPrism = false;
        let isIndestructible = false;
        let baseColor = BRICK_COLORS[r % BRICK_COLORS.length];
        let points = 50 + r * 10;

        if (type === 2) {
          maxHp = 2;
          isArmored = true;
          points = 120;
          baseColor = '#94a3b8'; // Silver
        } else if (type === 3) {
          maxHp = 3;
          isArmored = true;
          points = 200;
          baseColor = '#e2e8f0'; // Heavy chrome
        } else if (type === 4) {
          isExplosive = true;
          points = 150;
          baseColor = '#ff3344'; // Radiant Red
        } else if (type === 5) {
          isPrism = true;
          points = 300;
          baseColor = '#fbbf24'; // Golden amber
        } else if (type === 6) {
          isIndestructible = true;
          points = 0;
          maxHp = Infinity;
          baseColor = '#475569'; // Dark obsidian
        }

        this.bricks.push({
          x: this.brickOffsetLeft + c * (this.brickWidth + this.brickPadding),
          y: this.brickOffsetTop + r * (this.brickHeight + this.brickPadding),
          width: this.brickWidth,
          height: this.brickHeight,
          hp: maxHp,
          maxHp: maxHp,
          type: type,
          isArmored,
          isExplosive,
          isPrism,
          isIndestructible,
          baseColor,
          points,
          r,
          c,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    // Spawn initial ball attached to paddle
    this.spawnBall(true);
    this.updateHUD();
  }

  spawnBall(attached = false) {
    const levelData = LEVELS[this.levelIndex % LEVELS.length];
    const baseSpeed = levelData.ballSpeed * (this.activeEffects.slow > 0 ? 0.65 : 1.0);

    const ball = {
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 10,
      radius: 7,
      vx: 0,
      vy: 0,
      speed: baseSpeed,
      trail: [],
      attached: attached,
    };

    this.balls.push(ball);
  }

  launchBall() {
    if (this.balls.length === 0) return;
    const levelData = LEVELS[this.levelIndex % LEVELS.length];
    const baseSpeed = levelData.ballSpeed * (this.activeEffects.slow > 0 ? 0.65 : 1.0);

    this.balls.forEach(ball => {
      if (ball.attached) {
        ball.attached = false;
        // Launch with slight natural angle
        const angle = (Math.random() * 0.4 - 0.2) - Math.PI / 2;
        ball.vx = baseSpeed * Math.cos(angle);
        ball.vy = baseSpeed * Math.sin(angle);
        ball.speed = baseSpeed;
      }
    });

    this.isBallServed = true;
    sound.playPaddleBounce(1);
  }

  fireLaser() {
    if (this.activeEffects.laser <= 0) return;
    this.laserCooldown = 0.22; // Seconds between laser shots

    // Fire dual lasers from left and right edge of paddle
    this.lasers.push({
      x: this.paddle.x + 10,
      y: this.paddle.y - 8,
      width: 4,
      height: 18,
      vy: -14,
    });
    this.lasers.push({
      x: this.paddle.x + this.paddle.width - 14,
      y: this.paddle.y - 8,
      width: 4,
      height: 18,
      vy: -14,
    });

    sound.playLaser();
    this.triggerScreenShake(0.04, 2);
  }

  triggerScreenShake(duration = 0.1, magnitude = 4) {
    this.screenShakeTime = duration;
    this.screenShakeMagnitude = magnitude;
  }

  // Spawn dropping power-up capsule
  spawnPowerup(x, y, forceType = null) {
    const types = [
      { id: 'multiball', label: '分身', color: '#00ff9d', icon: '⚡' },
      { id: 'expand', label: '加長', color: '#00f0ff', icon: '↔' },
      { id: 'laser', label: '雷射', color: '#ff2a85', icon: '💥' },
      { id: 'fireball', label: '火球', color: '#ff8800', icon: '🔥' },
      { id: 'slow', label: '減速', color: '#b55fe6', icon: '⏳' },
      { id: 'shield', label: '防護網', color: '#38bdf8', icon: '🛡' },
      { id: 'life', label: '加命', color: '#f43f5e', icon: '💖' },
    ];

    let chosenType;
    if (forceType) {
      chosenType = types.find(t => t.id === forceType) || types[0];
    } else {
      // Weighted selection
      const weights = [25, 20, 18, 14, 12, 8, 3];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        if (rand < weights[i]) {
          selectedIdx = i;
          break;
        }
        rand -= weights[i];
      }
      chosenType = types[selectedIdx];
    }

    this.powerups.push({
      x,
      y,
      width: 44,
      height: 20,
      vy: 2.3,
      type: chosenType.id,
      label: chosenType.label,
      color: chosenType.color,
      icon: chosenType.icon,
      pulse: 0,
    });
  }

  applyPowerup(type) {
    sound.playPowerup();

    switch (type) {
      case 'multiball': {
        // Duplicate all currently active balls
        const newBalls = [];
        this.balls.forEach(ball => {
          for (let i = -1; i <= 1; i += 2) {
            const angle = Math.atan2(ball.vy, ball.vx) + i * 0.45;
            newBalls.push({
              x: ball.x,
              y: ball.y,
              radius: ball.radius,
              speed: ball.speed,
              vx: ball.speed * Math.cos(angle),
              vy: ball.speed * Math.sin(angle),
              trail: [],
              attached: false,
            });
          }
        });
        this.balls.push(...newBalls);
        this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '⚡ 多重分裂球!', '#00ff9d');
        break;
      }
      case 'expand': {
        this.paddle.targetWidth = 180;
        this.activeEffects.expand = 14; // 14 seconds
        this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '↔ 板子加長!', '#00f0ff');
        break;
      }
      case 'laser': {
        this.activeEffects.laser = 10; // 10 seconds
        this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '💥 雙重雷射炮!', '#ff2a85');
        break;
      }
      case 'fireball': {
        this.activeEffects.fireball = 8; // 8 seconds
        this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '🔥 穿透火球!', '#ff8800');
        break;
      }
      case 'slow': {
        this.activeEffects.slow = 10;
        this.balls.forEach(ball => {
          ball.vx *= 0.7;
          ball.vy *= 0.7;
        });
        this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '⏳ 慢速光球!', '#b55fe6');
        break;
      }
      case 'shield': {
        this.activeEffects.shield = true;
        this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '🛡 安全防護網!', '#38bdf8');
        break;
      }
      case 'life': {
        if (this.lives < 5) {
          this.lives++;
          this.updateHUD();
          this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '💖 生命 +1!', '#f43f5e');
        } else {
          this.addScore(500);
          this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, '+500 滿命獎勵!', '#f43f5e');
        }
        break;
      }
    }
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_breakout_high', this.highScore.toString());
    }
    this.updateHUD();
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.2,
      life: 1.0,
    });
  }

  createHitParticles(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.08,
      });
    }
  }

  explodeBrick(brick) {
    sound.playExplosion();
    this.triggerScreenShake(0.18, 7);
    this.createHitParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff3344', 30);
    this.addFloatingText(brick.x + brick.width / 2, brick.y, '💥 BOOM! +150', '#ff3344');

    // Damage all neighboring bricks in 1-tile distance
    const blastRadius = 90;
    const centerBx = brick.x + brick.width / 2;
    const centerBy = brick.y + brick.height / 2;

    this.bricks.forEach(other => {
      if (other !== brick && other.hp > 0 && !other.isIndestructible) {
        const obx = other.x + other.width / 2;
        const oby = other.y + other.height / 2;
        const dist = Math.hypot(centerBx - obx, centerBy - oby);

        if (dist <= blastRadius) {
          other.hp -= 2;
          this.createHitParticles(obx, oby, other.baseColor, 10);
          if (other.hp <= 0) {
            this.addScore(other.points);
          }
        }
      }
    });
  }

  // Main Loop
  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  // Update Game Logic
  update(dt) {
    // 1. Paddle movement
    if (this.usingMouse) {
      // Lerp paddle smoothly towards mouse position
      const targetX = this.mouseX - this.paddle.width / 2;
      this.paddle.x += (targetX - this.paddle.x) * 0.35;
    } else {
      // Keyboard input
      let moveDir = 0;
      if (this.keys.left) moveDir -= 1;
      if (this.keys.right) moveDir += 1;
      this.paddle.x += moveDir * this.paddle.speed;
    }

    // Clamp paddle to canvas bounds
    this.paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - this.paddle.width, this.paddle.x));

    // Smoothly animate paddle width transition
    if (Math.abs(this.paddle.width - this.paddle.targetWidth) > 0.5) {
      this.paddle.width += (this.paddle.targetWidth - this.paddle.width) * 0.15;
    } else {
      this.paddle.width = this.paddle.targetWidth;
    }

    // 2. Power-up timers countdown
    if (this.activeEffects.expand > 0) {
      this.activeEffects.expand -= dt;
      if (this.activeEffects.expand <= 0) {
        this.paddle.targetWidth = this.defaultPaddleWidth;
      }
    }

    if (this.activeEffects.laser > 0) {
      this.activeEffects.laser -= dt;
      if (this.laserCooldown > 0) this.laserCooldown -= dt;
    }

    if (this.activeEffects.fireball > 0) {
      this.activeEffects.fireball -= dt;
    }

    if (this.activeEffects.slow > 0) {
      this.activeEffects.slow -= dt;
    }

    // 3. Screen shake countdown
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }

    // 4. Update Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      if (ball.attached) {
        ball.x = this.paddle.x + this.paddle.width / 2;
        ball.y = this.paddle.y - ball.radius - 2;
        continue;
      }

      // Add to motion trail
      ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.7 });
      if (ball.trail.length > 8) ball.trail.shift();

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Bounce on left and right walls
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        sound.playWallBounce();
        this.createHitParticles(ball.x, ball.y, COLORS.cyan, 4);
      } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        sound.playWallBounce();
        this.createHitParticles(ball.x, ball.y, COLORS.cyan, 4);
      }

      // Bounce on ceiling
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        sound.playWallBounce();
        this.createHitParticles(ball.x, ball.y, COLORS.cyan, 4);
      }

      // Check Paddle collision
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= this.paddle.y &&
        ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
        ball.x >= this.paddle.x - 4 &&
        ball.x <= this.paddle.x + this.paddle.width + 4
      ) {
        // Dynamic angle calculation based on hit offset from paddle center
        const hitOffset = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));
        const maxAngle = (62 * Math.PI) / 180; // 62 degrees max
        const bounceAngle = clampedOffset * maxAngle;

        const currentSpeed = Math.hypot(ball.vx, ball.vy);
        // Slightly increase speed on paddle hits up to safe ceiling
        const speedBoost = Math.min(10.5, currentSpeed * 1.015);

        ball.vx = speedBoost * Math.sin(bounceAngle);
        ball.vy = -Math.abs(speedBoost * Math.cos(bounceAngle));
        ball.y = this.paddle.y - ball.radius - 1;

        // Reset combo count on paddle hit
        this.combo = 0;
        sound.playPaddleBounce(currentSpeed / 6);
        this.createHitParticles(ball.x, this.paddle.y, COLORS.cyan, 8);
      }

      // Check Bottom safety shield barrier
      if (this.activeEffects.shield && ball.y + ball.radius >= CANVAS_HEIGHT - 6) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = CANVAS_HEIGHT - ball.radius - 7;
        this.activeEffects.shield = false;
        sound.playShieldBounce();
        this.triggerScreenShake(0.1, 4);
        this.createHitParticles(ball.x, CANVAS_HEIGHT - 6, '#38bdf8', 25);
        this.addFloatingText(ball.x, CANVAS_HEIGHT - 30, '🛡 防護網消耗!', '#38bdf8');
      }

      // Ball lost below bottom
      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        this.balls.splice(i, 1);
      }
    }

    // Check if all balls were lost
    if (this.balls.length === 0) {
      this.lives--;
      sound.playLoseBall();
      this.triggerScreenShake(0.2, 6);
      this.updateHUD();

      if (this.lives <= 0) {
        this.state = 'GAME_OVER';
        sound.playGameOver();
        this.updateUIOverlays();
      } else {
        // Respawn attached ball
        this.spawnBall(true);
        this.isBallServed = false;
      }
    }

    // 5. Ball vs Bricks Collision
    this.balls.forEach(ball => {
      if (ball.attached) return;

      for (let b = 0; b < this.bricks.length; b++) {
        const brick = this.bricks[b];
        if (brick.hp <= 0) continue;

        // Circle vs Rectangle AABB collision
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.hypot(distX, distY);

        if (distance < ball.radius) {
          // Brick Hit!
          const isFireball = this.activeEffects.fireball > 0;

          if (!isFireball && !brick.isIndestructible) {
            // Determine bounce direction
            const overlapLeft = (ball.x + ball.radius) - brick.x;
            const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - brick.y;
            const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }
          } else if (brick.isIndestructible) {
            // Always bounce off indestructible bricks
            ball.vy = -ball.vy;
            sound.playArmoredHit();
            this.createHitParticles(closestX, closestY, '#94a3b8', 6);
            continue;
          }

          // Damage brick
          this.combo++;
          const comboBonus = Math.min(5, 1 + Math.floor(this.combo / 3));

          if (isFireball) {
            brick.hp -= 2;
          } else {
            brick.hp -= 1;
          }

          if (brick.hp <= 0) {
            // Brick Destroyed
            const pointsEarned = brick.points * comboBonus;
            this.addScore(pointsEarned);

            this.createHitParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.baseColor, 16);

            let scoreMsg = `+${pointsEarned}`;
            if (comboBonus > 1) scoreMsg += ` (${comboBonus}x)`;
            this.addFloatingText(brick.x + brick.width / 2, brick.y, scoreMsg, brick.baseColor);

            if (brick.isExplosive) {
              this.explodeBrick(brick);
            } else if (brick.isPrism) {
              sound.playHitBrick(this.combo);
              this.spawnPowerup(brick.x + brick.width / 2, brick.y, null);
            } else {
              sound.playHitBrick(this.combo);
              // Chance to drop powerup (30%)
              if (Math.random() < 0.32) {
                this.spawnPowerup(brick.x + brick.width / 2, brick.y);
              }
            }
          } else {
            // Brick Damaged but still standing
            sound.playArmoredHit();
            this.createHitParticles(closestX, closestY, brick.baseColor, 6);
          }

          // Check Level Complete condition
          this.checkLevelCompletion();
          break; // break brick loop for this ball
        }
      }
    });

    // 6. Update Lasers
    for (let l = this.lasers.length - 1; l >= 0; l--) {
      const laser = this.lasers[l];
      laser.y += laser.vy;

      // Offscreen
      if (laser.y + laser.height < 0) {
        this.lasers.splice(l, 1);
        continue;
      }

      // Check collision with bricks
      for (let b = 0; b < this.bricks.length; b++) {
        const brick = this.bricks[b];
        if (brick.hp <= 0) continue;

        if (
          laser.x < brick.x + brick.width &&
          laser.x + laser.width > brick.x &&
          laser.y < brick.y + brick.height &&
          laser.y + laser.height > brick.y
        ) {
          // Laser hit brick
          this.lasers.splice(l, 1);
          this.createHitParticles(laser.x, laser.y, '#ff2a85', 8);

          if (!brick.isIndestructible) {
            brick.hp -= 1;
            if (brick.hp <= 0) {
              this.addScore(brick.points);
              this.createHitParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.baseColor, 14);
              this.addFloatingText(brick.x + brick.width / 2, brick.y, `+${brick.points}`, brick.baseColor);
              if (brick.isExplosive) this.explodeBrick(brick);
            } else {
              sound.playArmoredHit();
            }
          } else {
            sound.playArmoredHit();
          }

          this.checkLevelCompletion();
          break;
        }
      }
    }

    // 7. Update Power-ups
    for (let p = this.powerups.length - 1; p >= 0; p--) {
      const pu = this.powerups[p];
      pu.y += pu.vy;
      pu.pulse += 0.08;

      // Check collision with paddle
      if (
        pu.y + pu.height >= this.paddle.y &&
        pu.y <= this.paddle.y + this.paddle.height &&
        pu.x + pu.width >= this.paddle.x &&
        pu.x <= this.paddle.x + this.paddle.width
      ) {
        this.applyPowerup(pu.type);
        this.createHitParticles(pu.x + pu.width / 2, pu.y, pu.color, 12);
        this.powerups.splice(p, 1);
        continue;
      }

      // Fell into void
      if (pu.y > CANVAS_HEIGHT) {
        this.powerups.splice(p, 1);
      }
    }

    // 8. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 9. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= dt * 1.4;
      ft.alpha = Math.max(0, ft.life);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    this.updateHUD();
  }

  checkLevelCompletion() {
    // A level is won when all breakable bricks have hp <= 0
    const remainingBreakable = this.bricks.filter(b => !b.isIndestructible && b.hp > 0);
    if (remainingBreakable.length === 0 && this.state === 'PLAYING') {
      this.state = 'LEVEL_CLEAR';
      sound.playLevelComplete();
      this.updateUIOverlays();
    }
  }

  // Render Everything to Canvas
  render() {
    this.ctx.save();

    // Screen Shake Offset
    if (this.screenShakeTime > 0) {
      const offsetX = (Math.random() - 0.5) * this.screenShakeMagnitude * 2;
      const offsetY = (Math.random() - 0.5) * this.screenShakeMagnitude * 2;
      this.ctx.translate(offsetX, offsetY);
    }

    // Clear Background
    this.ctx.fillStyle = COLORS.bg;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle Cyber Grid Lines
    this.drawCyberGrid();

    // Draw Safety Shield if active
    if (this.activeEffects.shield) {
      this.drawSafetyShield();
    }

    // Draw Bricks
    this.drawBricks();

    // Draw Power-up Capsules
    this.drawPowerups();

    // Draw Lasers
    this.drawLasers();

    // Draw Paddle
    this.drawPaddle();

    // Draw Balls & Glow Trails
    this.drawBalls();

    // Draw Particles
    this.drawParticles();

    // Draw Floating Texts
    this.drawFloatingTexts();

    this.ctx.restore();
  }

  drawCyberGrid() {
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    this.ctx.lineWidth = 1;

    // Horizontal lines
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
  }

  drawSafetyShield() {
    const y = CANVAS_HEIGHT - 6;
    this.ctx.save();
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 12;
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(CANVAS_WIDTH, y);
    this.ctx.stroke();

    // Pulsing nodes
    const time = performance.now() * 0.005;
    for (let x = 20; x < CANVAS_WIDTH; x += 60) {
      const radius = 3 + Math.sin(time + x) * 1.5;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawBricks() {
    this.bricks.forEach(brick => {
      if (brick.hp <= 0) return;

      this.ctx.save();

      if (brick.isIndestructible) {
        // Obsidian Brick with metallic texture
        this.ctx.fillStyle = '#334155';
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 1.5;
        this.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        this.ctx.fill();
        this.ctx.stroke();

        // Cross pattern
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.moveTo(brick.x + 4, brick.y + 4);
        this.ctx.lineTo(brick.x + brick.width - 4, brick.y + brick.height - 4);
        this.ctx.moveTo(brick.x + brick.width - 4, brick.y + 4);
        this.ctx.lineTo(brick.x + 4, brick.y + brick.height - 4);
        this.ctx.stroke();
      } else if (brick.isExplosive) {
        // Pulsing TNT Explosive Core
        const pulse = Math.sin(performance.now() * 0.008) * 0.2 + 0.8;
        this.ctx.shadowColor = '#ff3344';
        this.ctx.shadowBlur = 10 * pulse;
        this.ctx.fillStyle = '#ff2233';
        this.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        this.ctx.fill();

        // Warning Stripes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💣 TNT', brick.x + brick.width / 2, brick.y + brick.height / 2);
      } else if (brick.isPrism) {
        // Prism Star Brick
        const pulse = Math.sin(performance.now() * 0.006) * 0.15 + 0.85;
        this.ctx.shadowColor = '#fbbf24';
        this.ctx.shadowBlur = 12 * pulse;
        const grad = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(1, '#f59e0b');
        this.ctx.fillStyle = grad;
        this.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        this.ctx.fill();

        this.ctx.fillStyle = '#78350f';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('★ ITEM', brick.x + brick.width / 2, brick.y + brick.height / 2);
      } else {
        // Normal or Armored Brick
        this.ctx.shadowColor = brick.baseColor;
        this.ctx.shadowBlur = brick.isArmored ? 6 : 8;

        // Gradient Surface
        const grad = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        grad.addColorStop(0, brick.baseColor);
        grad.addColorStop(1, this.shadeColor(brick.baseColor, -25));
        this.ctx.fillStyle = grad;

        this.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        this.ctx.fill();

        // Top edge neon highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 2);

        // Armored Brick HP indicator or crack lines
        if (brick.isArmored) {
          if (brick.hp === 1) {
            // Crack lines
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(brick.x + 12, brick.y + 3);
            this.ctx.lineTo(brick.x + brick.width / 2, brick.y + brick.height - 4);
            this.ctx.lineTo(brick.x + brick.width - 14, brick.y + 5);
            this.ctx.stroke();
          } else {
            // Armor Shield Emblem
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = 'bold 10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`🛡 ${brick.hp}`, brick.x + brick.width / 2, brick.y + brick.height / 2);
          }
        }
      }

      this.ctx.restore();
    });
  }

  drawPaddle() {
    this.ctx.save();
    const p = this.paddle;

    // Laser Turrets on paddle edges if laser active
    if (this.activeEffects.laser > 0) {
      this.ctx.fillStyle = '#ff2a85';
      this.ctx.shadowColor = '#ff2a85';
      this.ctx.shadowBlur = 10;
      // Left Cannon
      this.ctx.fillRect(p.x + 8, p.y - 6, 6, 8);
      // Right Cannon
      this.ctx.fillRect(p.x + p.width - 14, p.y - 6, 6, 8);
    }

    // Glow Effect
    this.ctx.shadowColor = COLORS.cyan;
    this.ctx.shadowBlur = 14;

    // Gradient fill
    const grad = this.ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#00f0ff');
    grad.addColorStop(1, '#0077aa');
    this.ctx.fillStyle = grad;

    this.roundRect(p.x, p.y, p.width, p.height, 8);
    this.ctx.fill();

    // Center jewel core
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawBalls() {
    const isFireball = this.activeEffects.fireball > 0;

    this.balls.forEach(ball => {
      this.ctx.save();

      // Draw Comet Trail
      if (ball.trail && ball.trail.length > 0) {
        for (let i = 0; i < ball.trail.length; i++) {
          const t = ball.trail[i];
          const radius = (ball.radius * (i + 1)) / ball.trail.length;
          this.ctx.beginPath();
          this.ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
          this.ctx.fillStyle = isFireball
            ? `rgba(255, 120, 0, ${0.15 * (i / ball.trail.length)})`
            : `rgba(0, 240, 255, ${0.15 * (i / ball.trail.length)})`;
          this.ctx.fill();
        }
      }

      // Ball Glow
      this.ctx.shadowColor = isFireball ? '#ff6600' : '#00f0ff';
      this.ctx.shadowBlur = isFireball ? 20 : 12;

      // Ball Core
      this.ctx.fillStyle = isFireball ? '#ffaa00' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Outer rim
      this.ctx.strokeStyle = isFireball ? '#ff3300' : '#00f0ff';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  drawLasers() {
    if (this.lasers.length === 0) return;
    this.ctx.save();
    this.ctx.shadowColor = '#ff2a85';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#ffffff';

    this.lasers.forEach(laser => {
      this.ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
      this.ctx.fillStyle = '#ff2a85';
      this.ctx.fillRect(laser.x - 1, laser.y + 2, laser.width + 2, laser.height - 4);
      this.ctx.fillStyle = '#ffffff';
    });

    this.ctx.restore();
  }

  drawPowerups() {
    this.powerups.forEach(pu => {
      this.ctx.save();
      const pulse = Math.sin(pu.pulse) * 0.15 + 0.85;

      this.ctx.shadowColor = pu.color;
      this.ctx.shadowBlur = 10 * pulse;

      // Capsule Pill Background
      this.ctx.fillStyle = '#0f172a';
      this.ctx.strokeStyle = pu.color;
      this.ctx.lineWidth = 2;
      this.roundRect(pu.x, pu.y, pu.width, pu.height, 10);
      this.ctx.fill();
      this.ctx.stroke();

      // Icon & Label Text
      this.ctx.fillStyle = pu.color;
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${pu.icon} ${pu.label}`, pu.x + pu.width / 2, pu.y + pu.height / 2);

      this.ctx.restore();
    });
  }

  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawFloatingTexts() {
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = ft.alpha;
      this.ctx.shadowColor = ft.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = ft.color;
      this.ctx.font = 'bold 14px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });
  }

  // Canvas utility for rounded rectangle
  roundRect(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }

  shadeColor(color, percent) {
    let num = parseInt(color.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  // Update DOM HUD & Overlay Elements
  updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const highscoreEl = document.getElementById('hud-highscore');
    const levelEl = document.getElementById('hud-level');
    const livesEl = document.getElementById('hud-lives');
    const comboEl = document.getElementById('hud-combo');
    const powerupsContainer = document.getElementById('hud-active-powerups');

    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (highscoreEl) highscoreEl.textContent = this.highScore.toLocaleString();
    if (levelEl) levelEl.textContent = `${this.levelIndex + 1} / ${LEVELS.length}`;

    if (livesEl) {
      let hearts = '';
      for (let i = 0; i < 5; i++) {
        hearts += i < this.lives ? '❤️ ' : '🖤 ';
      }
      livesEl.textContent = hearts.trim();
    }

    if (comboEl) {
      if (this.combo > 1) {
        comboEl.textContent = `COMBO x${this.combo}`;
        comboEl.classList.remove('opacity-0');
        comboEl.classList.add('opacity-100');
      } else {
        comboEl.classList.remove('opacity-100');
        comboEl.classList.add('opacity-0');
      }
    }

    // Active power-up meters
    if (powerupsContainer) {
      let html = '';
      if (this.activeEffects.expand > 0) {
        html += `<div class="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-md"><span>↔ 板子加長</span><span class="font-mono">${Math.ceil(this.activeEffects.expand)}s</span></div>`;
      }
      if (this.activeEffects.laser > 0) {
        html += `<div class="flex items-center gap-1.5 text-xs text-pink-400 bg-pink-950/60 border border-pink-800/60 px-2.5 py-1 rounded-md"><span>💥 雷射砲</span><span class="font-mono">${Math.ceil(this.activeEffects.laser)}s</span></div>`;
      }
      if (this.activeEffects.fireball > 0) {
        html += `<div class="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2.5 py-1 rounded-md"><span>🔥 穿透火球</span><span class="font-mono">${Math.ceil(this.activeEffects.fireball)}s</span></div>`;
      }
      if (this.activeEffects.slow > 0) {
        html += `<div class="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-md"><span>⏳ 慢速球</span><span class="font-mono">${Math.ceil(this.activeEffects.slow)}s</span></div>`;
      }
      if (this.activeEffects.shield) {
        html += `<div class="flex items-center gap-1.5 text-xs text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-md"><span>🛡 防護底網</span><span>ACTIVE</span></div>`;
      }
      powerupsContainer.innerHTML = html;
    }
  }

  updateUIOverlays() {
    const startOverlay = document.getElementById('overlay-start');
    const pauseOverlay = document.getElementById('overlay-pause');
    const clearOverlay = document.getElementById('overlay-clear');
    const gameoverOverlay = document.getElementById('overlay-gameover');
    const victoryOverlay = document.getElementById('overlay-victory');

    // Hide all first
    if (startOverlay) startOverlay.classList.add('hidden');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');
    if (clearOverlay) clearOverlay.classList.add('hidden');
    if (gameoverOverlay) gameoverOverlay.classList.add('hidden');
    if (victoryOverlay) victoryOverlay.classList.add('hidden');

    if (this.state === 'START' && startOverlay) {
      startOverlay.classList.remove('hidden');
    } else if (this.state === 'PAUSED' && pauseOverlay) {
      pauseOverlay.classList.remove('hidden');
    } else if (this.state === 'LEVEL_CLEAR' && clearOverlay) {
      clearOverlay.classList.remove('hidden');
      const clearLevelEl = document.getElementById('clear-level-title');
      const clearScoreEl = document.getElementById('clear-score-val');
      if (clearLevelEl) clearLevelEl.textContent = `第 ${this.levelIndex + 1} 關突破！`;
      if (clearScoreEl) clearScoreEl.textContent = this.score.toLocaleString();
    } else if (this.state === 'GAME_OVER' && gameoverOverlay) {
      gameoverOverlay.classList.remove('hidden');
      const finalScoreEl = document.getElementById('final-score-val');
      const finalHighEl = document.getElementById('final-high-val');
      if (finalScoreEl) finalScoreEl.textContent = this.score.toLocaleString();
      if (finalHighEl) finalHighEl.textContent = this.highScore.toLocaleString();
    } else if (this.state === 'VICTORY' && victoryOverlay) {
      victoryOverlay.classList.remove('hidden');
      const vicScoreEl = document.getElementById('vic-score-val');
      if (vicScoreEl) vicScoreEl.textContent = this.score.toLocaleString();
    }
  }
}
