// ==========================================
// КОШАЧИЙ ЛОТОК ПИНГ-ПОНГ - GAME ENGINE
// ==========================================

class CatAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Мяуканье котика при отскоке
  playMeow(pitchMultiplier = 1) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 520 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.22);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Звук появления какашки (веселый "чпок")
  playPoopSplat(isWow = false) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isWow ? 380 : 260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Фанфары при "ВАУ! ИДЕАЛЬНО!"
  playWowFanfare() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  // Звук уборки лопатки / исчезновения каках
  playScoopClean() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [880, 1174, 1567].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  // Отскок от стены
  playWallBounce() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Грустное мяу при Game Over
  playGameOver() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.6);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}

// --- Плавающий текст (Floating Text) ---
class FloatingText {
  constructor(x, y, text, color = '#ffd700', size = 20) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 45;
    this.maxLife = 45;
    this.vy = -1.6;
  }

  update() {
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = `900 ${this.size}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// --- Частицы (Искры, звездочки) ---
class Particle {
  constructor(x, y, color, isStar = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isStar = isStar;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4.5 + 1.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = isStar ? Math.random() * 7 + 4 : Math.random() * 4 + 2;
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
    ctx.shadowBlur = 8;

    if (this.isStar) {
      ctx.font = `${Math.round(this.size)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('✨', this.x, this.y);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// --- Какашка в лотке ---
class TrayPoop {
  constructor(relX, type = 'normal') {
    this.relX = relX; // относительная позиция на лотке (-0.5 .. 0.5)
    this.type = type; // 'mini', 'normal', 'wow'
    this.scale = 0;
    this.targetScale = type === 'wow' ? 1.4 : (type === 'mini' ? 0.7 : 1.0);
    this.sparkleTimer = 0;
  }

  update() {
    if (this.scale < this.targetScale) {
      this.scale += (this.targetScale - this.scale) * 0.25;
    }
    this.sparkleTimer++;
  }

  draw(ctx, trayX, trayY, trayWidth) {
    ctx.save();
    const x = trayX + this.relX * (trayWidth - 30);
    const y = trayY - 6;

    ctx.translate(x, y);
    ctx.scale(this.scale, this.scale);

    if (this.type === 'wow') {
      // Золотая сияющая какашка с короной
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 16;
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💩', 0, 0);

      // Маленькая корона сверху
      ctx.font = '16px sans-serif';
      ctx.fillText('👑', 0, -18);

      // Периодические искры
      if (Math.sin(this.sparkleTimer * 0.2) > 0.6) {
        ctx.font = '14px sans-serif';
        ctx.fillText('✨', 16, -10);
      }
    } else if (this.type === 'mini') {
      // Маленькая скромная какашка
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💩', 0, 2);
    } else {
      // Обычная какашка
      ctx.shadowColor = '#8a5a36';
      ctx.shadowBlur = 6;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💩', 0, 0);
    }

    ctx.restore();
  }
}

// --- Главная игра Кото-Понг ---
class CatPongGame {
  constructor() {
    this.canvas = document.getElementById('pongCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new CatAudio();

    // Размеры
    this.width = 600;
    this.height = 800;

    // Состояние игры
    this.active = false;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('catpong_highscore') || '0', 10);
    this.wowCount = 0;
    this.speedMultiplier = 1.0;
    this.screenShake = 0;

    // Лоток (Платформа)
    this.tray = {
      x: 300,
      y: 720,
      width: 140,
      height: 32,
      targetX: 300,
      poops: [], // Текущие какашки в лотке
      cleaningAnimation: 0 // Таймер эффекта уборки лопаткой
    };

    // Котик (Мячик)
    this.cat = {
      x: 300,
      y: 200,
      vx: 3.5,
      vy: 4.8,
      radius: 26,
      squashX: 1,
      squashY: 1,
      rotation: 0,
      tailWag: 0
    };

    // Эффекты
    this.particles = [];
    this.floatingTexts = [];

    this.initCanvas();
    this.initEvents();
    this.updateHUD();
  }

  initCanvas() {
    const resize = () => {
      const container = document.getElementById('game-zone');
      const dpr = window.devicePixelRatio || 1;
      this.width = container.clientWidth;
      this.height = container.clientHeight;

      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.resetTransform();
      this.ctx.scale(dpr, dpr);

      // Лоток располагаем внизу с запасом на мобильный safe area
      this.tray.y = this.height - Math.max(65, this.height * 0.1);
      this.tray.width = Math.min(160, Math.max(120, this.width * 0.3));
    };

    window.addEventListener('resize', resize);
    resize();
  }

  initEvents() {
    const zone = document.getElementById('game-zone');

    // Движение мыши
    zone.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      this.tray.targetX = mouseX;
    });

    // Сенсорное управление на телефоне (touch)
    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      this.tray.targetX = touchX;
    }, { passive: false });

    zone.addEventListener('touchstart', (e) => {
      this.audio.init();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      this.tray.targetX = touchX;
    }, { passive: true });

    // Клавиатура (A/D, стрелки)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.tray.targetX -= 40;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.tray.targetX += 40;
    });

    // Кнопка старта
    document.getElementById('play-btn').addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    // Кнопка рестарта
    document.getElementById('play-again-btn').addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    document.getElementById('restart-sidebar-btn').addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    // Звук
    const toggleSound = () => {
      this.audio.muted = !this.audio.muted;
      const text = this.audio.muted ? '🔇 Звук: ВЫКЛ' : '🔊 Звук: ВКЛ';
      document.getElementById('sound-btn').textContent = text;
      document.getElementById('m-sound-btn').textContent = this.audio.muted ? '🔇' : '🔊';
    };

    document.getElementById('sound-btn').addEventListener('click', toggleSound);
    document.getElementById('m-sound-btn').addEventListener('click', toggleSound);
  }

  startGame() {
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');

    this.score = 0;
    this.wowCount = 0;
    this.speedMultiplier = 1.0;
    this.active = true;

    // Сброс котика
    this.cat.x = this.width / 2;
    this.cat.y = 150;
    const baseSpeed = 4.8;
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.cat.vx = dir * (2.8 + Math.random() * 1.5);
    this.cat.vy = baseSpeed;
    this.cat.squashX = 1;
    this.cat.squashY = 1;

    // Сброс лотка и какашек
    this.tray.x = this.width / 2;
    this.tray.targetX = this.width / 2;
    this.tray.poops = [];
    this.tray.cleaningAnimation = 0;

    this.particles = [];
    this.floatingTexts = [];

    this.updateHUD();
    this.audio.playMeow(1.2);
  }

  updateHUD() {
    document.getElementById('score-display').textContent = this.score;
    document.getElementById('m-score').textContent = this.score;

    document.getElementById('best-score-display').textContent = this.bestScore;
    document.getElementById('m-best').textContent = this.bestScore;

    document.getElementById('wow-count-display').textContent = this.wowCount;
    document.getElementById('speed-display').textContent = `${this.speedMultiplier.toFixed(1)}x`;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('catpong_highscore', this.bestScore.toString());
      document.getElementById('best-score-display').textContent = this.bestScore;
      document.getElementById('m-best').textContent = this.bestScore;
    }
  }

  update() {
    if (!this.active) return;

    if (this.screenShake > 0) this.screenShake *= 0.88;

    // Плавное движение лотка к курсору
    this.tray.x += (this.tray.targetX - this.tray.x) * 0.35;
    const halfW = this.tray.width / 2;
    this.tray.x = Math.max(halfW, Math.min(this.width - halfW, this.tray.x));

    // Обновление какашек в лотке
    this.tray.poops.forEach((p) => p.update());

    if (this.tray.cleaningAnimation > 0) {
      this.tray.cleaningAnimation--;
    }

    // Движение котика
    this.cat.x += this.cat.vx;
    this.cat.y += this.cat.vy;
    this.cat.tailWag += 0.2;

    // Плавное восстановление формы котика после сжатия
    this.cat.squashX += (1 - this.cat.squashX) * 0.18;
    this.cat.squashY += (1 - this.cat.squashY) * 0.18;

    // Отскок от левой и правой стен
    if (this.cat.x - this.cat.radius <= 0) {
      this.cat.x = this.cat.radius;
      this.cat.vx = Math.abs(this.cat.vx);
      this.cat.squashX = 0.7;
      this.cat.squashY = 1.3;
      this.audio.playWallBounce();
      this.addWallSparks(this.cat.x, this.cat.y);
    } else if (this.cat.x + this.cat.radius >= this.width) {
      this.cat.x = this.width - this.cat.radius;
      this.cat.vx = -Math.abs(this.cat.vx);
      this.cat.squashX = 0.7;
      this.cat.squashY = 1.3;
      this.audio.playWallBounce();
      this.addWallSparks(this.cat.x, this.cat.y);
    }

    // Отскок от верхнего потолка
    if (this.cat.y - this.cat.radius <= 0) {
      this.cat.y = this.cat.radius;
      this.cat.vy = Math.abs(this.cat.vy);
      this.cat.squashX = 1.3;
      this.cat.squashY = 0.7;
      this.audio.playWallBounce();
      this.addWallSparks(this.cat.x, this.cat.y);
    }

    // Столкновение с лотком (Платформой)
    const trayTop = this.tray.y - this.tray.height / 2;
    const trayLeft = this.tray.x - this.tray.width / 2;
    const trayRight = this.tray.x + this.tray.width / 2;

    if (
      this.cat.vy > 0 &&
      this.cat.y + this.cat.radius >= trayTop &&
      this.cat.y - this.cat.radius <= trayTop + 16 &&
      this.cat.x >= trayLeft - 10 &&
      this.cat.x <= trayRight + 10
    ) {
      this.handleTrayBounce(trayLeft, trayRight, trayTop);
    }

    // Промах! Котик упал мимо лотка (Game Over)
    if (this.cat.y - this.cat.radius > this.height) {
      this.gameOver();
      return;
    }

    // Обновление частиц и текстов
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update();
      if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  handleTrayBounce(trayLeft, trayRight, trayTop) {
    // 1. Очистка старых какашек со второго прилёта!
    // "когда второй раз прилетает, уже какашки исчезают"
    if (this.tray.poops.length > 0) {
      this.tray.cleaningAnimation = 18;
      this.audio.playScoopClean();
      this.floatingTexts.push(new FloatingText(this.tray.x, this.tray.y - 35, '🧹 УБРАНО!', '#00f5d4', 16));

      // Искры уборки лопатки
      for (let i = 0; i < 12; i++) {
        this.particles.push(new Particle(this.tray.x + (Math.random() - 0.5) * this.tray.width, this.tray.y, '#00f5d4', true));
      }
      this.tray.poops = [];
    }

    // 2. Оценка качества отбивания
    // Насколько близко к центру лотка попал котик
    const offsetFromCenter = (this.cat.x - this.tray.x) / (this.tray.width / 2);
    const absOffset = Math.abs(offsetFromCenter);

    let hitQuality = 'normal'; // 'mini', 'normal', 'wow'
    let pointsToAdd = 1;

    if (absOffset <= 0.22) {
      // Идеально по центру! ВАУ!
      hitQuality = 'wow';
      pointsToAdd = 3;
      this.wowCount++;
      this.screenShake = 8;
      this.audio.playWowFanfare();
      this.audio.playMeow(1.5);
      this.floatingTexts.push(new FloatingText(this.cat.x, this.cat.y - 25, '✨ ВАУ! ИДЕАЛЬНО! +3 ✨', '#ffd700', 22));

      // Золотой взрыв звезд
      for (let i = 0; i < 20; i++) {
        this.particles.push(new Particle(this.cat.x, this.cat.y, '#ffd700', true));
      }
    } else if (absOffset >= 0.72) {
      // На самом краю, не очень чисто
      hitQuality = 'mini';
      pointsToAdd = 1;
      this.audio.playPoopSplat(false);
      this.audio.playMeow(0.85);
      this.floatingTexts.push(new FloatingText(this.cat.x, this.cat.y - 20, 'Маленькая какашка +1', '#a87955', 16));
    } else {
      // Хороший нормальный отскок
      hitQuality = 'normal';
      pointsToAdd = 1;
      this.audio.playPoopSplat(false);
      this.audio.playMeow(1.0);
      this.floatingTexts.push(new FloatingText(this.cat.x, this.cat.y - 20, 'Мяу! +1 💩', '#00f5d4', 18));
    }

    // 3. Оставляем новую какашку в лотке
    const relX = Math.max(-0.42, Math.min(0.42, offsetFromCenter * 0.45));
    this.tray.poops.push(new TrayPoop(relX, hitQuality));

    // 4. Начисляем очки и ускоряем
    this.score += pointsToAdd;
    this.speedMultiplier = Math.min(2.2, 1.0 + this.score * 0.04);
    this.updateHUD();

    // 5. Физика отскока
    this.cat.y = trayTop - this.cat.radius;
    const maxBounceAngle = Math.PI * 0.38; // ~68 градусов
    const bounceAngle = offsetFromCenter * maxBounceAngle;
    const currentSpeed = (5.5 + Math.min(this.score * 0.18, 5.0));

    this.cat.vx = Math.sin(bounceAngle) * currentSpeed;
    this.cat.vy = -Math.cos(bounceAngle) * currentSpeed;

    // Сплющивание котика
    this.cat.squashX = 1.4;
    this.cat.squashY = 0.6;
  }

  addWallSparks(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push(new Particle(x, y, '#ffb703', false));
    }
  }

  gameOver() {
    this.active = false;
    this.audio.playGameOver();

    document.getElementById('final-bounces').textContent = this.score;
    document.getElementById('final-wows').textContent = this.wowCount;
    document.getElementById('final-best').textContent = this.bestScore;
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }

  // --- Отрисовка игры ---
  draw() {
    this.ctx.save();

    // Тряска экрана
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
    }

    // Фон (Уютная комната / темный паттерн с лапками)
    this.ctx.fillStyle = '#0f111d';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.drawRoomDecorations();

    // Частицы
    for (const p of this.particles) p.draw(this.ctx);

    // Лоток и какашки
    this.drawLitterTray();

    // Котик (Мячик)
    if (this.active || document.getElementById('gameover-overlay').classList.contains('hidden')) {
      this.drawCuteCat();
    }

    // Всплывающие тексты
    for (const ft of this.floatingTexts) ft.draw(this.ctx);

    this.ctx.restore();
  }

  drawRoomDecorations() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';

    // Еле заметные кошачьи лапки на заднем плане
    const step = 80;
    for (let x = 30; x < this.width; x += step) {
      for (let y = 30; y < this.height; y += step) {
        this.ctx.font = '18px sans-serif';
        this.ctx.fillText('🐾', x, y);
      }
    }

    // Пол / нижняя зона
    this.ctx.strokeStyle = 'rgba(255, 183, 3, 0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.tray.y + 35);
    this.ctx.lineTo(this.width, this.tray.y + 35);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  drawLitterTray() {
    const { x, y, width, height, poops } = this.tray;
    const halfW = width / 2;
    const halfH = height / 2;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Внешний бортик лотка (Пластиковый корпус)
    this.ctx.fillStyle = '#ff7b00';
    this.ctx.shadowColor = 'rgba(255, 123, 0, 0.4)';
    this.ctx.shadowBlur = 12;
    this.roundRect(-halfW, -halfH, width, height, 12);
    this.ctx.fill();

    // Внутренний ободок
    this.ctx.fillStyle = '#e06600';
    this.roundRect(-halfW + 4, -halfH + 4, width - 8, height - 8, 8);
    this.ctx.fill();

    // Наполнитель для лотка (Песочек / гранулы)
    this.ctx.fillStyle = '#f0ece1';
    this.roundRect(-halfW + 8, -halfH + 6, width - 16, height - 12, 6);
    this.ctx.fill();

    // Точечки гранул наполнителя
    this.ctx.fillStyle = '#c9c3b4';
    for (let gx = -halfW + 16; gx < halfW - 16; gx += 14) {
      this.ctx.fillRect(gx, 0, 3, 3);
      this.ctx.fillRect(gx + 6, -3, 2, 2);
    }

    // Ручки лотка по бокам
    this.ctx.fillStyle = '#ff9933';
    this.ctx.fillRect(-halfW - 5, -4, 5, 8);
    this.ctx.fillRect(halfW, -4, 5, 8);

    // Рисуем какашки в лотке
    for (const poop of poops) {
      poop.draw(this.ctx, 0, 0, width);
    }

    // Эффект взмаха лопатки при уборке
    if (this.tray.cleaningAnimation > 0) {
      this.ctx.font = '28px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🧹', 0, -22);
    }

    this.ctx.restore();
  }

  drawCuteCat() {
    const { x, y, radius, vx, vy, squashX, squashY, tailWag } = this.cat;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(squashX, squashY);

    // Хвостик сзади
    this.ctx.save();
    const tailAngle = Math.sin(tailWag) * 0.4 - Math.atan2(vy, vx) * 0.3;
    this.ctx.rotate(tailAngle);
    this.ctx.strokeStyle = '#fca311';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(0, radius - 4);
    this.ctx.quadraticCurveTo(-15, radius + 15, -6, radius + 22);
    this.ctx.stroke();
    this.ctx.restore();

    // Тело / Голова котика (Рыжий пухлый котик)
    this.ctx.fillStyle = '#fca311';
    this.ctx.shadowColor = 'rgba(252, 163, 17, 0.4)';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Ушки
    this.ctx.fillStyle = '#e85d04';
    // Левое ухо
    this.ctx.beginPath();
    this.ctx.moveTo(-radius + 4, -radius * 0.3);
    this.ctx.lineTo(-radius * 0.6, -radius * 1.25);
    this.ctx.lineTo(-radius * 0.1, -radius * 0.7);
    this.ctx.fill();
    // Розовая серединка левого уха
    this.ctx.fillStyle = '#ffb3c1';
    this.ctx.beginPath();
    this.ctx.moveTo(-radius + 7, -radius * 0.35);
    this.ctx.lineTo(-radius * 0.6, -radius * 1.05);
    this.ctx.lineTo(-radius * 0.2, -radius * 0.65);
    this.ctx.fill();

    // Правое ухо
    this.ctx.fillStyle = '#e85d04';
    this.ctx.beginPath();
    this.ctx.moveTo(radius - 4, -radius * 0.3);
    this.ctx.lineTo(radius * 0.6, -radius * 1.25);
    this.ctx.lineTo(radius * 0.1, -radius * 0.7);
    this.ctx.fill();
    // Розовая серединка правого уха
    this.ctx.fillStyle = '#ffb3c1';
    this.ctx.beginPath();
    this.ctx.moveTo(radius - 7, -radius * 0.35);
    this.ctx.lineTo(radius * 0.6, -radius * 1.05);
    this.ctx.lineTo(radius * 0.2, -radius * 0.65);
    this.ctx.fill();

    // Глазки, следящие за направлением полёта
    const eyeLookX = Math.max(-3, Math.min(3, vx * 0.6));
    const eyeLookY = Math.max(-3, Math.min(3, vy * 0.6));

    // Белки глаз
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(-8, -4, 6, 0, Math.PI * 2);
    this.ctx.arc(8, -4, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Зрачки (Аниме-стиль)
    this.ctx.fillStyle = '#14213d';
    this.ctx.beginPath();
    this.ctx.arc(-8 + eyeLookX, -4 + eyeLookY, 3.5, 0, Math.PI * 2);
    this.ctx.arc(8 + eyeLookX, -4 + eyeLookY, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Блики в глазках
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(-9 + eyeLookX, -6 + eyeLookY, 1.2, 0, Math.PI * 2);
    this.ctx.arc(7 + eyeLookX, -6 + eyeLookY, 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Розовый носик
    this.ctx.fillStyle = '#ff4d6d';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 2);
    this.ctx.lineTo(-3, -1);
    this.ctx.lineTo(3, -1);
    this.ctx.fill();

    // Ротик :3
    this.ctx.strokeStyle = '#6a040f';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(-3, 4, 3, 0.2, Math.PI * 0.85);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(3, 4, 3, 0.15, Math.PI * 0.8);
    this.ctx.stroke();

    // Усики
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.2;
    // Левые усики
    this.ctx.beginPath();
    this.ctx.moveTo(-10, 2);
    this.ctx.lineTo(-20, 0);
    this.ctx.moveTo(-10, 5);
    this.ctx.lineTo(-19, 6);
    this.ctx.stroke();
    // Правые усики
    this.ctx.beginPath();
    this.ctx.moveTo(10, 2);
    this.ctx.lineTo(20, 0);
    this.ctx.moveTo(10, 5);
    this.ctx.lineTo(19, 6);
    this.ctx.stroke();

    // Румянец на щечках
    this.ctx.fillStyle = 'rgba(255, 117, 143, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(-14, 5, 4, 0, Math.PI * 2);
    this.ctx.arc(14, 5, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

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

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Запуск игры
window.addEventListener('DOMContentLoaded', () => {
  const game = new CatPongGame();
  game.loop();
});
