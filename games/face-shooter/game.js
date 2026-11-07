// ==========================================
// FACE SHOOTER ARCADE - GAME ENGINE
// ==========================================

// --- Web Audio 8-Bit Synthesizer ---
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLaser() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playPop() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playHurt() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPowerup() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [330, 440, 550, 660, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  playWaveJingle() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [400, 350, 300, 220, 150].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }
}

// --- Face Pre-renderer (Crops to circular canvas) ---
function createCircularAvatarCanvas(source, isEmoji = false, bgColor = '#00f0ff') {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  // Circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (isEmoji) {
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.font = '72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(source, size / 2, size / 2 + 6);
  } else if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
    // Draw cropped square image
    const sw = source.naturalWidth;
    const sh = source.naturalHeight;
    const minDim = Math.min(sw, sh);
    const sx = (sw - minDim) / 2;
    const sy = (sh - minDim) / 2;
    ctx.drawImage(source, sx, sy, minDim, minDim, 0, 0, size, size);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.restore();

  // Outer border ring
  ctx.strokeStyle = bgColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}

// --- Floating Text Effect ---
class FloatingText {
  constructor(x, y, text, color = '#ffd700', size = 18) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.life = 40;
    this.vy = -1.5;
  }

  update() {
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / 40);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.size}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// --- Particle ---
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 4 + 2;
    this.life = Math.random() * 25 + 20;
    this.maxLife = this.life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Bullet ---
class Bullet {
  constructor(x, y, angle, damage = 25, speed = 12, isCrit = false) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = isCrit ? 6 : 4;
    this.damage = damage;
    this.isCrit = isCrit;
    this.distance = 0;
    this.maxDistance = 900;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.distance += Math.hypot(this.vx, this.vy);
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.isCrit ? '#ff0055' : '#00f0ff';
    ctx.shadowColor = this.isCrit ? '#ff0055' : '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Powerup Drop ---
class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'health', 'rapid', 'spread'
    this.radius = 16;
    this.life = 450;
    this.bobAngle = Math.random() * Math.PI;
  }

  update() {
    this.life--;
    this.bobAngle += 0.05;
  }

  draw(ctx) {
    ctx.save();
    const bob = Math.sin(this.bobAngle) * 4;
    const colors = { health: '#00ff88', rapid: '#ffd700', spread: '#ff007f' };
    const icons = { health: '❤️', rapid: '⚡', spread: '🔱' };

    ctx.fillStyle = colors[this.type];
    ctx.shadowColor = colors[this.type];
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y + bob, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[this.type], this.x, this.y + bob);
    ctx.restore();
  }
}

// --- Enemy ---
class Enemy {
  constructor(x, y, wave, faceCanvas) {
    this.x = x;
    this.y = y;
    this.wave = wave;
    this.faceCanvas = faceCanvas;

    // Type variations
    const rand = Math.random();
    if (rand < 0.15 && wave > 1) {
      // Brute
      this.type = 'brute';
      this.radius = 36;
      this.speed = 1.3 + Math.min(wave * 0.05, 1);
      this.maxHp = 90 + wave * 25;
      this.scoreVal = 100;
    } else if (rand < 0.35) {
      // Speeder
      this.type = 'runner';
      this.radius = 20;
      this.speed = 3.2 + Math.min(wave * 0.1, 1.8);
      this.maxHp = 25 + wave * 6;
      this.scoreVal = 40;
    } else {
      // Standard
      this.type = 'standard';
      this.radius = 26;
      this.speed = 2.1 + Math.min(wave * 0.08, 1.4);
      this.maxHp = 45 + wave * 10;
      this.scoreVal = 25;
    }
    this.hp = this.maxHp;
    this.hitFlash = 0;
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    if (this.hitFlash > 0) this.hitFlash--;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.faceCanvas) {
      ctx.drawImage(this.faceCanvas, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else {
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar above enemy if damaged
    if (this.hp < this.maxHp) {
      const bw = this.radius * 1.8;
      const bh = 4;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-bw / 2, -this.radius - 10, bw, bh);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-bw / 2, -this.radius - 10, bw * hpRatio, bh);
    }

    ctx.restore();
  }
}

// --- Main Game Class ---
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundSynth();

    // Game state
    this.active = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('faceshooter_highscore') || '0', 10);
    this.wave = 1;
    this.waveState = 'starting'; // 'spawning', 'clearing', 'starting'
    this.waveTimer = 0;
    this.enemiesToSpawn = 0;
    this.screenShake = 0;

    // Entities
    this.player = {
      x: 0,
      y: 0,
      radius: 28,
      speed: 4.8,
      hp: 100,
      maxHp: 100,
      angle: 0,
      fireRateCooldown: 0,
      spreadDuration: 0,
      rapidDuration: 0
    };
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.powerups = [];

    // Face Canvases
    this.heroFaceCanvas = null;
    this.enemyFaceCanvas = null;

    // Inputs
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    this.joystick = { active: false, dx: 0, dy: 0, touchId: null };
    this.isFiring = false;

    this.initCanvasSize();
    this.initInputs();
    this.initUI();
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    window.addEventListener('resize', () => {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.scale(dpr, dpr);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    });
  }

  initInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') this.isFiring = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') this.isFiring = false;
    });

    // Mouse
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (this.active) {
        this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
      }
    });
    window.addEventListener('mousedown', (e) => {
      this.sound.init();
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.isFiring = true;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
        if (!this.touchFireActive) this.isFiring = false;
      }
    });

    // Mobile Virtual Joystick
    const joystickZone = document.getElementById('joystick-zone');
    const joystickStick = document.getElementById('joystick-stick');
    const joystickBase = document.getElementById('joystick-base');

    const handleJoystickMove = (clientX, clientY) => {
      const rect = joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const maxRadius = rect.width / 2 - 5;

      if (distance > maxRadius) {
        dx = (dx / distance) * maxRadius;
        dy = (dy / distance) * maxRadius;
      }

      joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joystick.dx = dx / maxRadius;
      this.joystick.dy = dy / maxRadius;
      this.joystick.active = true;
    };

    const resetJoystick = () => {
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      this.joystick.touchId = null;
      joystickStick.style.transform = 'translate(0px, 0px)';
    };

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.sound.init();
      const touch = e.changedTouches[0];
      this.joystick.touchId = touch.identifier;
      handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystick.touchId) {
          handleJoystickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    joystickZone.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystick.touchId) {
          resetJoystick();
          break;
        }
      }
    }, { passive: false });

    joystickZone.addEventListener('touchcancel', resetJoystick);

    // Mobile Shoot Button
    const shootBtn = document.getElementById('shoot-btn');
    shootBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.sound.init();
      this.touchFireActive = true;
      this.isFiring = true;
    }, { passive: false });

    shootBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchFireActive = false;
      this.isFiring = false;
    }, { passive: false });

    shootBtn.addEventListener('touchcancel', () => {
      this.touchFireActive = false;
      this.isFiring = false;
    });

    // Quick Audio Toggle
    const audioBtn = document.getElementById('audio-toggle');
    audioBtn.addEventListener('click', () => {
      this.sound.muted = !this.sound.muted;
      audioBtn.textContent = this.sound.muted ? '🔇' : '🔊';
    });
  }

  initUI() {
    // Face upload handlers
    const setupAvatarInput = (inputId, imgId, defaultId, previewBoxId, isHero) => {
      const input = document.getElementById(inputId);
      const img = document.getElementById(imgId);
      const defaultDiv = document.getElementById(defaultId);

      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            img.src = event.target.result;
            img.onload = () => {
              img.classList.remove('hidden');
              defaultDiv.classList.add('hidden');
              if (isHero) {
                this.heroFaceCanvas = createCircularAvatarCanvas(img, false, '#00f0ff');
              } else {
                this.enemyFaceCanvas = createCircularAvatarCanvas(img, false, '#ff007f');
              }
            };
          };
          reader.readAsDataURL(file);
        }
      });
    };

    setupAvatarInput('hero-photo-input', 'hero-avatar-img', 'hero-avatar-default', 'hero-preview-box', true);
    setupAvatarInput('enemy-photo-input', 'enemy-avatar-img', 'enemy-avatar-default', 'enemy-preview-box', false);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-type');
        const emoji = btn.getAttribute('data-emoji');
        if (type === 'hero') {
          document.getElementById('hero-avatar-img').classList.add('hidden');
          const def = document.getElementById('hero-avatar-default');
          def.textContent = emoji;
          def.classList.remove('hidden');
          this.heroFaceCanvas = createCircularAvatarCanvas(emoji, true, '#00f0ff');
        } else {
          document.getElementById('enemy-avatar-img').classList.add('hidden');
          const def = document.getElementById('enemy-avatar-default');
          def.textContent = emoji;
          def.classList.remove('hidden');
          this.enemyFaceCanvas = createCircularAvatarCanvas(emoji, true, '#ff007f');
        }
      });
    });

    // Default Canvas generation
    this.heroFaceCanvas = createCircularAvatarCanvas('😎', true, '#00f0ff');
    this.enemyFaceCanvas = createCircularAvatarCanvas('😈', true, '#ff007f');

    // Start Button
    document.getElementById('start-btn').addEventListener('click', () => {
      this.sound.init();
      this.startGame();
    });

    // Restart Button
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.sound.init();
      this.startGame();
    });

    document.getElementById('high-score-val').textContent = this.highScore;
  }

  startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('touch-controls').classList.remove('hidden');

    this.score = 0;
    this.wave = 1;
    this.active = true;
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.player.hp = 100;
    this.player.spreadDuration = 0;
    this.player.rapidDuration = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.powerups = [];

    this.updateHUD();
    this.startWave(1);
    this.sound.playWaveJingle();
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.waveState = 'spawning';
    this.enemiesToSpawn = 7 + waveNum * 4;
    this.waveTimer = 0;
    this.floatingTexts.push(new FloatingText(this.width / 2, this.height / 3, `WAVE ${waveNum}`, '#00f0ff', 32));
    this.updateHUD();
  }

  spawnEnemy() {
    // Spawn around arena borders
    let x, y;
    const margin = 50;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -margin : this.width + margin;
      y = Math.random() * this.height;
    } else {
      x = Math.random() * this.width;
      y = Math.random() < 0.5 ? -margin : this.height + margin;
    }
    this.enemies.push(new Enemy(x, y, this.wave, this.enemyFaceCanvas));
  }

  shoot() {
    const isRapid = this.player.rapidDuration > 0;
    const isSpread = this.player.spreadDuration > 0;

    // Auto-aim closest enemy if mobile or joystick active
    let targetAngle = this.player.angle;
    if (this.enemies.length > 0 && (this.touchFireActive || this.joystick.active)) {
      let closest = null;
      let minD = Infinity;
      for (const enemy of this.enemies) {
        const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (d < minD) {
          minD = d;
          closest = enemy;
        }
      }
      if (closest && minD < 650) {
        targetAngle = Math.atan2(closest.y - this.player.y, closest.x - this.player.x);
        this.player.angle = targetAngle;
      }
    }

    const muzzleX = this.player.x + Math.cos(targetAngle) * (this.player.radius + 6);
    const muzzleY = this.player.y + Math.sin(targetAngle) * (this.player.radius + 6);

    if (isSpread) {
      [-0.25, 0, 0.25].forEach((offset) => {
        this.bullets.push(new Bullet(muzzleX, muzzleY, targetAngle + offset, 24, 13));
      });
    } else {
      const isCrit = Math.random() < 0.2;
      this.bullets.push(new Bullet(muzzleX, muzzleY, targetAngle, isCrit ? 45 : 28, 14, isCrit));
    }

    this.sound.playLaser();
    this.player.fireRateCooldown = isRapid ? 6 : 14;
  }

  update() {
    if (!this.active) return;

    // Screen Shake decay
    if (this.screenShake > 0) this.screenShake *= 0.88;

    // Movement calculation
    let mx = 0;
    let my = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

    // Virtual Joystick priority
    if (this.joystick.active) {
      mx = this.joystick.dx;
      my = this.joystick.dy;
    } else if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
    }

    this.player.x += mx * this.player.speed;
    this.player.y += my * this.player.speed;

    // Arena boundary clamp
    this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

    // Powerup durations
    if (this.player.spreadDuration > 0) this.player.spreadDuration--;
    if (this.player.rapidDuration > 0) this.player.rapidDuration--;

    // Firing
    if (this.player.fireRateCooldown > 0) this.player.fireRateCooldown--;
    if (this.isFiring && this.player.fireRateCooldown <= 0) {
      this.shoot();
    }

    // Wave Spawning
    if (this.waveState === 'spawning') {
      this.waveTimer++;
      const spawnInterval = Math.max(18, 55 - this.wave * 4);
      if (this.waveTimer % spawnInterval === 0 && this.enemiesToSpawn > 0) {
        this.spawnEnemy();
        this.enemiesToSpawn--;
      }
      if (this.enemiesToSpawn <= 0) {
        this.waveState = 'clearing';
      }
    } else if (this.waveState === 'clearing' && this.enemies.length === 0) {
      this.sound.playWaveJingle();
      this.startWave(this.wave + 1);
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update();
      if (b.distance > b.maxDistance || b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Enemies & Bullet Collisions
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei];
      e.update(this.player);

      // Check collision with player
      const distToPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (distToPlayer < e.radius + this.player.radius) {
        this.player.hp -= 0.65;
        this.screenShake = 6;
        if (Math.random() < 0.12) this.sound.playHurt();
        this.updateHUD();

        if (this.player.hp <= 0) {
          this.gameOver();
          return;
        }
      }

      // Check collision with bullets
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius) {
          e.hp -= b.damage;
          e.hitFlash = 3;

          // Floating damage number
          this.floatingTexts.push(new FloatingText(e.x, e.y - 12, `-${b.damage}`, b.isCrit ? '#ff0055' : '#ffd700', b.isCrit ? 22 : 16));

          // Bullet sparks
          for (let p = 0; p < 4; p++) {
            this.particles.push(new Particle(b.x, b.y, b.isCrit ? '#ff0055' : '#00f0ff'));
          }

          this.bullets.splice(bi, 1);

          if (e.hp <= 0) {
            // Enemy Popped!
            this.sound.playPop();
            this.score += e.scoreVal;
            this.updateHUD();

            // Big particle explosion
            for (let p = 0; p < 18; p++) {
              this.particles.push(new Particle(e.x, e.y, '#ff007f'));
            }

            // Chance to drop powerup
            if (Math.random() < 0.16) {
              const types = ['health', 'rapid', 'spread'];
              const chosen = types[Math.floor(Math.random() * types.length)];
              this.powerups.push(new Powerup(e.x, e.y, chosen));
            }

            this.enemies.splice(ei, 1);
            break;
          }
        }
      }
    }

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.update();

      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < p.radius + this.player.radius) {
        this.sound.playPowerup();
        if (p.type === 'health') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, '+35 HP', '#00ff88', 20));
        } else if (p.type === 'rapid') {
          this.player.rapidDuration = 380;
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, 'RAPID FIRE!', '#ffd700', 20));
        } else if (p.type === 'spread') {
          this.player.spreadDuration = 380;
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, 'SPREAD SHOT!', '#ff007f', 20));
        }
        this.updateHUD();
        this.powerups.splice(i, 1);
      } else if (p.life <= 0) {
        this.powerups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update();
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  draw() {
    this.ctx.save();

    // Camera shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
    }

    // Clear background
    this.ctx.fillStyle = '#080a14';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Neon Grid
    this.drawGrid();

    // Draw Powerups
    for (const p of this.powerups) p.draw(this.ctx);

    // Draw Bullets
    for (const b of this.bullets) b.draw(this.ctx);

    // Draw Enemies
    for (const e of this.enemies) e.draw(this.ctx);

    // Draw Particles
    for (const p of this.particles) p.draw(this.ctx);

    // Draw Player
    if (this.active) {
      this.drawPlayer();
    }

    // Draw Floating Texts
    for (const ft of this.floatingTexts) ft.draw(this.ctx);

    this.ctx.restore();
  }

  drawGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    this.ctx.lineWidth = 1;
    const gridSize = 45;

    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    // Weapon Turret Barrel
    this.ctx.save();
    this.ctx.rotate(this.player.angle);
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(this.player.radius - 4, -4, 16, 8);
    this.ctx.restore();

    // Circular Hero Face
    if (this.heroFaceCanvas) {
      this.ctx.drawImage(
        this.heroFaceCanvas,
        -this.player.radius,
        -this.player.radius,
        this.player.radius * 2,
        this.player.radius * 2
      );
    }

    // Powerup Auras
    if (this.player.spreadDuration > 0 || this.player.rapidDuration > 0) {
      this.ctx.strokeStyle = this.player.rapidDuration > 0 ? '#ffd700' : '#ff007f';
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = this.ctx.strokeStyle;
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  updateHUD() {
    document.getElementById('score-val').textContent = this.score;
    document.getElementById('wave-val').textContent = this.wave;
    const hpRatio = Math.max(0, Math.min(1, this.player.hp / this.player.maxHp));
    document.getElementById('hp-bar').style.width = `${Math.round(hpRatio * 100)}%`;
    document.getElementById('hp-text').textContent = `${Math.max(0, Math.round(this.player.hp))} / 100`;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('faceshooter_highscore', this.highScore.toString());
      document.getElementById('high-score-val').textContent = this.highScore;
    }
  }

  gameOver() {
    this.active = false;
    this.sound.playGameOver();

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch-controls').classList.add('hidden');
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-wave').textContent = this.wave;
    document.getElementById('best-score').textContent = this.highScore;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Start Game Engine when loaded
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.loop();
});
