// Pug Dash - Core Game Loop & Physics Engine

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Target virtual resolution (16:9 ratio)
        this.width = 960;
        this.height = 540;
        this.groundY = 430; // Ground surface level

        // Game states: MENU, PLAYING, PRACTICE, CRASHED, VICTORY, PAUSED
        this.state = 'MENU';
        this.currentLevelIndex = 0;
        this.isEndless = false;
        this.practiceMode = false;
        this.checkpoints = [];

        // Player dog state
        this.dog = {
            x: 120,
            y: this.groundY - 48,
            width: 46,
            height: 46,
            vx: 5.5,
            vy: 0,
            rotation: 0,
            targetRotation: 0,
            onGround: true,
            mode: 'cube', // 'cube' or 'rocket'
            dead: false
        };

        // Physics constants (tuned for authentic Geometry Dash feel!)
        this.gravity = 0.92;
        this.jumpForce = -14.2;
        this.springForce = -17.8;
        this.ringJumpForce = -13.6;

        // Customization
        this.selectedSkin = localStorage.getItem('pug_skin') || 'classic';
        this.selectedTrail = localStorage.getItem('pug_trail') || 'rainbow';

        // Stats & Persistence
        this.attempts = 1;
        this.totalBones = parseInt(localStorage.getItem('pug_bones') || '0', 10);
        this.levelStats = JSON.parse(localStorage.getItem('pug_level_stats') || '{}');
        this.endlessHighScore = parseInt(localStorage.getItem('pug_endless_hs') || '0', 10);

        // Input tracking
        this.isJumpPressed = false;
        this.jumpBuffer = false;
        this.jumpBufferTimer = 0;

        // Camera & World
        this.cameraX = 0;
        this.levelObjects = [];
        this.endlessGen = new EndlessGenerator();
        this.particles = [];
        this.confetti = [];

        // Progress
        this.progress = 0;
        this.bonesCollectedInRun = new Set();

        // Timing
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.timestep = 1000 / 60; // 60 FPS fixed step

        this.initDOM();
        this.initInput();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Connect audio beat sync to graphics engine
        window.soundEngine.onBeat(() => {
            window.graphicsEngine.triggerBeat();
        });

        // Start render loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initDOM() {
        // UI elements
        this.hud = document.getElementById('hud');
        this.progressBar = document.getElementById('progressBarFill');
        this.progressText = document.getElementById('progressText');
        this.attemptText = document.getElementById('attemptText');
        this.bonesHudText = document.getElementById('bonesHudText');

        this.menuScreen = document.getElementById('menuScreen');
        this.levelSelectModal = document.getElementById('levelSelectModal');
        this.wardrobeModal = document.getElementById('wardrobeModal');
        this.victoryModal = document.getElementById('victoryModal');
        this.pauseModal = document.getElementById('pauseModal');

        this.practiceControls = document.getElementById('practiceControls');

        this.updateBonesDisplay();
        this.renderWardrobeGrid();
    }

    resize() {
        const container = document.getElementById('gameContainer');
        const aspect = this.width / this.height;
        let w = container.clientWidth;
        let h = container.clientHeight;

        if (w / h > aspect) {
            w = h * aspect;
        } else {
            h = w / aspect;
        }

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
    }

    // ==================== INPUT ====================

    initInput() {
        const onDown = (e) => {
            if (e.target.closest('button') || e.target.closest('.modal-content')) return;
            if (e.code === 'KeyP') {
                this.togglePause();
                return;
            }
            if (e.code === 'KeyZ' && this.practiceMode) {
                this.setCheckpoint();
                return;
            }
            if (e.code === 'KeyX' && this.practiceMode) {
                this.removeCheckpoint();
                return;
            }

            if (e.type === 'keydown' && !['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                return;
            }

            e.preventDefault();
            this.handleJumpPress();
        };

        const onUp = (e) => {
            if (e.target.closest('button')) return;
            if (e.type === 'keyup' && !['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                return;
            }
            this.handleJumpRelease();
        };

        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        this.canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);
        this.canvas.addEventListener('touchstart', (e) => { onDown(e); }, { passive: false });
        window.addEventListener('touchend', (e) => { onUp(e); }, { passive: false });
    }

    handleJumpPress() {
        window.soundEngine.ensureContext();
        this.isJumpPressed = true;
        this.jumpBuffer = true;
        this.jumpBufferTimer = 8; // buffer for 8 frames

        if (this.state === 'MENU') {
            this.startLevel(this.currentLevelIndex);
            return;
        }

        if (this.state === 'CRASHED') {
            this.restartLevel();
            return;
        }

        if (this.state === 'PLAYING' || this.state === 'PRACTICE') {
            // Check Jump Ring trigger
            if (this.tryActivateJumpRing()) {
                return;
            }

            // Normal Cube Jump
            if (this.dog.mode === 'cube' && this.dog.onGround) {
                this.executeJump();
            }
        }
    }

    handleJumpRelease() {
        this.isJumpPressed = false;
        this.jumpBuffer = false;
    }

    executeJump() {
        this.dog.vy = this.jumpForce;
        this.dog.onGround = false;
        window.soundEngine.playJump();
        this.jumpBuffer = false;

        // Jump dust particles
        this.spawnDust(this.dog.x + this.dog.width / 2, this.groundY, 6);
    }

    tryActivateJumpRing() {
        // Find if dog is inside any unused jump ring
        const dogCenterX = this.dog.x + this.dog.width / 2;
        const dogCenterY = this.dog.y + this.dog.height / 2;

        for (const obj of this.levelObjects) {
            if (obj.type === 'jump_ring' && !obj.used) {
                const ringCenterX = obj.x + obj.width / 2;
                const ringCenterY = (this.groundY - obj.y) - obj.height / 2;
                const dist = Math.hypot(dogCenterX - ringCenterX, dogCenterY - ringCenterY);

                if (dist < 48) {
                    obj.used = true;
                    this.dog.vy = this.ringJumpForce;
                    this.dog.onGround = false;
                    window.soundEngine.playRing();

                    // Sparkle burst around ring
                    this.spawnTreatSparkles(ringCenterX, ringCenterY, 14);
                    return true;
                }
            }
        }
        return false;
    }

    // ==================== LEVEL LIFECYCLE ====================

    startLevel(index, endless = false) {
        this.isEndless = endless;
        this.currentLevelIndex = index;
        this.state = this.practiceMode ? 'PRACTICE' : 'PLAYING';
        this.checkpoints = [];

        const lvlKey = endless ? 'endless' : LEVELS[index].id;
        const savedStats = this.levelStats[lvlKey] || { attempts: 0 };
        this.attempts = savedStats.attempts + 1;
        this.levelStats[lvlKey] = { ...savedStats, attempts: this.attempts };
        this.saveLevelStats();

        this.resetPlayer();
        this.loadLevelData();

        // Music
        const track = endless ? 'city' : LEVELS[index].musicTrack;
        window.soundEngine.startMusic(track);

        // Update HUD
        this.hud.style.display = 'block';
        this.menuScreen.style.display = 'none';
        this.victoryModal.style.display = 'none';
        this.pauseModal.style.display = 'none';
        this.practiceControls.style.display = this.practiceMode ? 'flex' : 'none';
        this.attemptText.textContent = `Попытка ${this.attempts}`;
    }

    resetPlayer() {
        const speed = this.isEndless ? 5.8 : LEVELS[this.currentLevelIndex].baseSpeed;
        this.dog.x = 120;
        this.dog.y = this.groundY - 46;
        this.dog.vx = speed;
        this.dog.vy = 0;
        this.dog.rotation = 0;
        this.dog.targetRotation = 0;
        this.dog.onGround = true;
        this.dog.mode = 'cube';
        this.dog.dead = false;

        this.cameraX = 0;
        this.progress = 0;
        this.bonesCollectedInRun.clear();
        this.particles = [];
    }

    loadLevelData() {
        if (this.isEndless) {
            this.endlessGen.reset();
            this.levelObjects = this.endlessGen.generateChunk(1800);
        } else {
            // Deep clone level objects so runtime state (used rings, collected bones) resets cleanly
            this.levelObjects = JSON.parse(JSON.stringify(LEVELS[this.currentLevelIndex].objects));
        }
    }

    restartLevel() {
        if (this.practiceMode && this.checkpoints.length > 0) {
            this.restoreCheckpoint();
            return;
        }

        const lvlKey = this.isEndless ? 'endless' : LEVELS[this.currentLevelIndex].id;
        this.attempts++;
        if (!this.levelStats[lvlKey]) this.levelStats[lvlKey] = { attempts: 0 };
        this.levelStats[lvlKey].attempts = this.attempts;
        this.saveLevelStats();

        this.attemptText.textContent = `Попытка ${this.attempts}`;
        this.resetPlayer();
        this.loadLevelData();

        const track = this.isEndless ? 'city' : LEVELS[this.currentLevelIndex].musicTrack;
        window.soundEngine.startMusic(track);
        this.state = this.practiceMode ? 'PRACTICE' : 'PLAYING';
    }

    crash() {
        if (this.dog.dead) return;
        this.dog.dead = true;
        this.state = 'CRASHED';

        window.soundEngine.stopMusic();
        window.soundEngine.playCrash();

        // Splat particles & stars
        this.spawnCrashExplosion(this.dog.x + this.dog.width / 2, this.dog.y + this.dog.height / 2);

        // Auto restart after 0.75s if player doesn't tap immediately
        setTimeout(() => {
            if (this.state === 'CRASHED') {
                this.restartLevel();
            }
        }, 750);
    }

    win() {
        this.state = 'VICTORY';
        window.soundEngine.stopMusic();
        window.soundEngine.playWin();

        const lvl = LEVELS[this.currentLevelIndex];
        const lvlKey = lvl.id;
        const currentStats = this.levelStats[lvlKey] || { completed: false, bestPercent: 0, bones: 0 };
        currentStats.completed = true;
        currentStats.bestPercent = 100;
        currentStats.bones = Math.max(currentStats.bones, this.bonesCollectedInRun.size);
        this.levelStats[lvlKey] = currentStats;
        this.saveLevelStats();

        // Add collected bones to wallet
        this.totalBones += this.bonesCollectedInRun.size;
        localStorage.setItem('pug_bones', this.totalBones.toString());
        this.updateBonesDisplay();

        // Confetti party
        this.spawnWinConfetti();

        // Show Victory Modal
        document.getElementById('vicLevelName').textContent = lvl.name;
        document.getElementById('vicAttempts').textContent = this.attempts.toString();
        document.getElementById('vicBones').textContent = `${this.bonesCollectedInRun.size} / ${lvl.secretBonesTotal}`;
        this.victoryModal.style.display = 'flex';
    }

    // ==================== PRACTICE MODE CHECKPOINTS ====================

    setCheckpoint() {
        if (!this.practiceMode || this.state !== 'PRACTICE') return;
        this.checkpoints.push({
            x: this.dog.x,
            y: this.dog.y,
            vy: this.dog.vy,
            rotation: this.dog.rotation,
            mode: this.dog.mode,
            cameraX: this.cameraX
        });
        window.soundEngine.playCheckpoint();
    }

    removeCheckpoint() {
        if (!this.practiceMode || this.checkpoints.length === 0) return;
        this.checkpoints.pop();
        window.soundEngine.playBark(0.2);
    }

    restoreCheckpoint() {
        const cp = this.checkpoints[this.checkpoints.length - 1];
        this.dog.x = cp.x;
        this.dog.y = cp.y;
        this.dog.vy = 0;
        this.dog.rotation = 0;
        this.dog.mode = cp.mode;
        this.dog.dead = false;
        this.cameraX = cp.cameraX;

        // Reset rings downstream
        for (const obj of this.levelObjects) {
            if (obj.x > this.dog.x) {
                obj.used = false;
            }
        }

        const track = this.isEndless ? 'city' : LEVELS[this.currentLevelIndex].musicTrack;
        window.soundEngine.startMusic(track);
        this.state = 'PRACTICE';
    }

    // ==================== PHYSICS & UPDATE ====================

    updatePhysics() {
        if (this.state !== 'PLAYING' && this.state !== 'PRACTICE') return;

        // Advance Dog Horizontal Position
        this.dog.x += this.dog.vx;
        this.cameraX = this.dog.x - 140; // Camera stays ahead

        // Progress Calculation
        if (this.isEndless) {
            const meters = Math.floor(this.dog.x / 20);
            this.progressText.textContent = `${meters}м`;
            if (meters > this.endlessHighScore) {
                this.endlessHighScore = meters;
                localStorage.setItem('pug_endless_hs', meters.toString());
            }
            // Spawn continuous endless objects
            if (this.dog.x + 960 > this.endlessGen.nextX - 600) {
                const newObjs = this.endlessGen.generateChunk(this.dog.x + 1400);
                this.levelObjects.push(...newObjs);
            }
            // Increase speed gradually in endless
            this.dog.vx = Math.min(9.5, 5.8 + meters * 0.003);
        } else {
            const lvl = LEVELS[this.currentLevelIndex];
            this.progress = Math.min(100, Math.floor((this.dog.x / lvl.endX) * 100));
            this.progressBar.style.width = `${this.progress}%`;
            this.progressText.textContent = `${this.progress}%`;

            // Victory condition check
            if (this.dog.x >= lvl.endX) {
                this.win();
                return;
            }
        }

        // Jump buffer countdown
        if (this.jumpBuffer) {
            this.jumpBufferTimer--;
            if (this.jumpBufferTimer <= 0) {
                this.jumpBuffer = false;
            }
        }

        // Mid-air Jump Ring check when holding/pressing jump
        if (this.dog.mode === 'cube' && (this.jumpBuffer || this.isJumpPressed)) {
            this.tryActivateJumpRing();
        }

        // ==================== MODE: ROCKET ====================
        if (this.dog.mode === 'rocket') {
            if (this.isJumpPressed) {
                this.dog.vy -= 0.65; // Lift up
            } else {
                this.dog.vy += 0.55; // Fall down
            }
            // Clamp rocket vertical velocity
            this.dog.vy = Math.max(-7.5, Math.min(7.5, this.dog.vy));
            this.dog.y += this.dog.vy;

            // Rocket angle follows vertical velocity
            this.dog.rotation = this.dog.vy * 0.05;

            // Rocket ceiling / ground crash
            if (this.dog.y < 20 || this.dog.y + this.dog.height > this.groundY) {
                this.crash();
                return;
            }

            // Rocket trail exhaust
            if (Math.random() < 0.6) {
                this.spawnRocketExhaust(this.dog.x, this.dog.y + this.dog.height / 2);
            }
        }
        // ==================== MODE: CUBE (Classic Pug Run) ====================
        else {
            // Gravity
            this.dog.vy += this.gravity;
            this.dog.y += this.dog.vy;

            // Ground collision
            if (this.dog.y + this.dog.height >= this.groundY) {
                this.dog.y = this.groundY - this.dog.height;
                this.dog.vy = 0;
                this.dog.onGround = true;

                // Snap rotation cleanly to flat 0
                this.dog.rotation = 0;

                // Auto-jump if buffered
                if (this.jumpBuffer || this.isJumpPressed) {
                    this.executeJump();
                }
            } else {
                this.dog.onGround = false;

                // In mid-air: rotate dog (GD iconic flip)
                this.dog.rotation += 0.14;
            }

            // Running trail / dust
            if (this.dog.onGround && Math.random() < 0.25) {
                this.spawnDust(this.dog.x + 8, this.groundY, 1);
            }
        }

        // Spawn Custom Skin Trail
        if (Math.random() < 0.4) {
            this.spawnCustomTrail(this.dog.x + 4, this.dog.y + this.dog.height / 2);
        }

        // Obstacle Collisions
        this.checkObstacleCollisions();
    }

    checkObstacleCollisions() {
        const dogBox = {
            // Forgiving hitbox (4px smaller on all sides)
            left: this.dog.x + 6,
            right: this.dog.x + this.dog.width - 6,
            top: this.dog.y + 6,
            bottom: this.dog.y + this.dog.height - 4
        };

        for (const obj of this.levelObjects) {
            // Screen culling
            if (obj.x + obj.width < this.dog.x - 100 || obj.x > this.dog.x + 100) continue;

            const objY = this.groundY - obj.y - obj.height;
            const objBox = {
                left: obj.x,
                right: obj.x + obj.width,
                top: objY,
                bottom: objY + obj.height
            };

            // Platform block collision (can land on top, crash into sides/bottom)
            if (obj.type === 'block') {
                if (this.checkAABB(dogBox, objBox)) {
                    // Check if dog landed on top
                    const prevDogBottom = (this.dog.y - this.dog.vy) + this.dog.height;
                    if (prevDogBottom <= objBox.top + 10 && this.dog.vy >= 0) {
                        this.dog.y = objBox.top - this.dog.height;
                        this.dog.vy = 0;
                        this.dog.onGround = true;
                        this.dog.rotation = 0;

                        if (this.jumpBuffer || this.isJumpPressed) {
                            this.executeJump();
                        }
                    } else {
                        // Crashed into side or bottom of block
                        this.crash();
                        return;
                    }
                }
                continue;
            }

            // Jump Pad (Bouncy spring)
            if (obj.type === 'jump_pad') {
                if (this.checkAABB(dogBox, objBox)) {
                    this.dog.vy = this.springForce;
                    this.dog.onGround = false;
                    obj.bounceAnim = 1.0;
                    window.soundEngine.playSpring();
                    this.spawnTreatSparkles(obj.x + obj.width / 2, objBox.top, 8);
                }
                if (obj.bounceAnim > 0) {
                    obj.bounceAnim = Math.max(0, obj.bounceAnim - 0.15);
                }
                continue;
            }

            // Rocket Portal
            if (obj.type === 'portal_rocket') {
                if (this.checkAABB(dogBox, objBox) && this.dog.mode !== 'rocket') {
                    this.dog.mode = 'rocket';
                    window.soundEngine.playBark(0.35);
                    this.spawnTreatSparkles(obj.x + obj.width / 2, objBox.top + obj.height / 2, 16);
                }
                continue;
            }

            // Normal Portal
            if (obj.type === 'portal_normal') {
                if (this.checkAABB(dogBox, objBox) && this.dog.mode !== 'cube') {
                    this.dog.mode = 'cube';
                    window.soundEngine.playBark(0.35);
                    this.spawnTreatSparkles(obj.x + obj.width / 2, objBox.top + obj.height / 2, 16);
                }
                continue;
            }

            // Collectible Secret Bone
            if (obj.type === 'bone' && !obj.collected) {
                if (this.checkAABB(dogBox, objBox)) {
                    obj.collected = true;
                    this.bonesCollectedInRun.add(obj.id);
                    window.soundEngine.playRing();
                    this.spawnTreatSparkles(obj.x + obj.width / 2, objBox.top + obj.height / 2, 12);
                }
                continue;
            }

            // Jump Ring is handled in input/tap
            if (obj.type === 'jump_ring') continue;

            // Hazardous Obstacles: Poop, Hydrant, Angry Dog, Cat, Mud
            if (['poop', 'double_poop', 'triple_poop', 'hydrant', 'angry_dog', 'cat', 'mud'].includes(obj.type)) {
                // Fair spike hitbox (slight inset)
                const hazardBox = {
                    left: objBox.left + 5,
                    right: objBox.right - 5,
                    top: objBox.top + 6,
                    bottom: objBox.bottom
                };

                if (this.checkAABB(dogBox, hazardBox)) {
                    this.crash();
                    return;
                }
            }
        }
    }

    checkAABB(r1, r2) {
        return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
    }

    // ==================== PARTICLES & VISUALS ====================

    spawnDust(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: -this.dog.vx * 0.4 + (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2.5,
                size: 3 + Math.random() * 4,
                color: 'rgba(203, 213, 225, 0.8)',
                alpha: 1.0,
                life: 18
            });
        }
    }

    spawnTreatSparkles(x, y, count = 10) {
        const colors = ['#FBBF24', '#F59E0B', '#EF4444', '#10B981', '#60A5FA'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 3 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                life: 25
            });
        }
    }

    spawnRocketExhaust(x, y) {
        this.particles.push({
            x,
            y,
            vx: -4 - Math.random() * 3,
            vy: (Math.random() - 0.5) * 2,
            size: 4 + Math.random() * 5,
            color: Math.random() < 0.6 ? '#F59E0B' : '#EF4444',
            alpha: 1.0,
            life: 14
        });
    }

    spawnCustomTrail(x, y) {
        let color = '#F472B6';
        if (this.selectedTrail === 'rainbow') {
            const rainbow = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
            color = rainbow[Math.floor(Math.random() * rainbow.length)];
        } else if (this.selectedTrail === 'bone') {
            color = '#FDE68A';
        } else if (this.selectedTrail === 'grass') {
            color = '#4ADE80';
        } else if (this.selectedTrail === 'bubbles') {
            color = 'rgba(147, 197, 253, 0.7)';
        }

        this.particles.push({
            x,
            y,
            vx: -1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: 4 + Math.random() * 3,
            color: color,
            alpha: 0.8,
            life: 20
        });
    }

    spawnCrashExplosion(x, y) {
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 6;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 4 + Math.random() * 5,
                color: ['#F59E0B', '#EF4444', '#E8C59A', '#1F2937'][Math.floor(Math.random() * 4)],
                alpha: 1.0,
                life: 35
            });
        }
    }

    spawnWinConfetti() {
        this.confetti = [];
        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
        for (let i = 0; i < 90; i++) {
            this.confetti.push({
                x: Math.random() * this.width,
                y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 3,
                vy: 2 + Math.random() * 4,
                w: 8 + Math.random() * 6,
                h: 5 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI,
                rotSpd: (Math.random() - 0.5) * 0.15
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = Math.max(0, p.life / 25);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Win confetti
        for (const c of this.confetti) {
            c.x += c.vx;
            c.y += c.vy;
            c.rotation += c.rotSpd;
            if (c.y > this.height) {
                c.y = -10;
                c.x = Math.random() * this.width;
            }
        }
    }

    // ==================== RENDERING ====================

    render() {
        const theme = this.isEndless ? 'city' : (LEVELS[this.currentLevelIndex] ? LEVELS[this.currentLevelIndex].theme : 'park');

        // Background
        window.graphicsEngine.drawBackground(this.ctx, theme, this.cameraX, this.width, this.height);

        // Ground
        window.graphicsEngine.drawGround(this.ctx, this.groundY, this.cameraX, this.width, this.height);

        // World Objects
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        for (const obj of this.levelObjects) {
            // Draw obstacle relative to ground
            const drawObj = {
                ...obj,
                y: this.groundY - obj.y - obj.height
            };
            window.graphicsEngine.drawObstacle(this.ctx, drawObj);
        }

        // Draw Practice Checkpoints
        if (this.practiceMode) {
            for (const cp of this.checkpoints) {
                this.ctx.fillStyle = '#22C55E';
                this.ctx.beginPath();
                this.ctx.arc(cp.x + 23, cp.y + 23, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }

        // Particles
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Dog Player
        window.graphicsEngine.drawDog(
            this.ctx,
            this.dog,
            this.selectedSkin,
            this.dog.mode,
            this.dog.dead
        );

        this.ctx.restore();

        // Confetti (Screen Space)
        for (const c of this.confetti) {
            this.ctx.save();
            this.ctx.translate(c.x, c.y);
            this.ctx.rotate(c.rotation);
            this.ctx.fillStyle = c.color;
            this.ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            this.ctx.restore();
        }
    }

    // ==================== MAIN LOOP ====================

    loop(time) {
        const delta = time - this.lastTime;
        this.lastTime = time;
        this.accumulator += Math.min(delta, 100);

        while (this.accumulator >= this.timestep) {
            this.updatePhysics();
            this.updateParticles();
            window.graphicsEngine.update();
            this.accumulator -= this.timestep;
        }

        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    // ==================== UI & WARDROBE ====================

    updateBonesDisplay() {
        if (this.bonesHudText) {
            this.bonesHudText.textContent = `🦴 ${this.totalBones}`;
        }
    }

    saveLevelStats() {
        localStorage.setItem('pug_level_stats', JSON.stringify(this.levelStats));
    }

    renderWardrobeGrid() {
        const skins = [
            { id: 'classic', name: 'Жорик (Классика)', desc: 'Озорной бежевый мопс с красным ошейником.', cost: 0 },
            { id: 'cool', name: 'Крутой Мопс', desc: 'Чёрные очки, кепка задом наперёд и золотая цепь.', cost: 3 },
            { id: 'detective', name: 'Шерлок Мопс', desc: 'Клетчатая шляпа сыщика. Ищет потерянные кости!', cost: 5 },
            { id: 'corgi', name: 'Корги Пушок', desc: 'Рыжий корги с белой грудкой и мягкой пушистой попой.', cost: 5 },
            { id: 'frenchie', name: 'Француз Буля', desc: 'Ушастый серый французский бульдог.', cost: 6 },
            { id: 'astro', name: 'Космо-Мопс', desc: 'Скафандр с аквариумом и мигающей антенной.', cost: 8 },
            { id: 'super', name: 'Супер-Мопс', desc: 'Красный летающий плащ и маска супергероя!', cost: 10 },
            { id: 'black', name: 'Уголёк', desc: 'Угольно-чёрный мопс с синей банданой.', cost: 7 },
            { id: 'viking', name: 'Мопс-Викинг', desc: 'Шлем с рогами для самых бесстрашных прыжков!', cost: 9 },
            { id: 'golden', name: 'Золотой Чемпион', desc: 'Сияющий золотой мопс в королевской короне!', cost: 15 }
        ];

        const container = document.getElementById('skinCardsContainer');
        if (!container) return;
        container.innerHTML = '';

        skins.forEach(skin => {
            const card = document.createElement('div');
            card.className = `skin-card ${this.selectedSkin === skin.id ? 'active' : ''}`;
            
            // Mini preview canvas
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 72;
            previewCanvas.height = 72;
            const pctx = previewCanvas.getContext('2d');
            
            // Render static dog preview
            window.graphicsEngine.drawDog(pctx, { x: 12, y: 12, width: 48, height: 48, rotation: 0, onGround: true }, skin.id, 'cube', false);

            card.innerHTML = `
                <div class="skin-name">${skin.name}</div>
                <div class="skin-desc">${skin.desc}</div>
                <div class="skin-price">${skin.cost === 0 ? 'Бесплатно' : '🦴 ' + skin.cost}</div>
            `;
            card.prepend(previewCanvas);

            card.addEventListener('click', () => {
                this.selectedSkin = skin.id;
                localStorage.setItem('pug_skin', skin.id);
                this.renderWardrobeGrid();
                window.soundEngine.playBark(0.3);
            });

            container.appendChild(card);
        });
    }

    togglePause() {
        if (this.state === 'PLAYING' || this.state === 'PRACTICE') {
            this.state = 'PAUSED';
            window.soundEngine.stopMusic();
            this.pauseModal.style.display = 'flex';
        } else if (this.state === 'PAUSED') {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.pauseModal.style.display = 'none';
        this.state = this.practiceMode ? 'PRACTICE' : 'PLAYING';
        const track = this.isEndless ? 'city' : LEVELS[this.currentLevelIndex].musicTrack;
        window.soundEngine.startMusic(track);
    }
}

// Global game instance
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
