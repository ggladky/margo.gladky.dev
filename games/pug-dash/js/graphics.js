// Pug Dash - Cartoon Graphics & Drawing Engine

// Polyfill for CanvasRenderingContext2D.prototype.roundRect if not natively supported
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        if (!radii) radii = 0;
        if (typeof radii === 'number') radii = [radii, radii, radii, radii];
        const [tl, tr, br, bl] = radii.length === 1 ? [radii[0], radii[0], radii[0], radii[0]] : radii;
        this.beginPath();
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
        return this;
    };
}

class GraphicsEngine {
    constructor() {
        this.frame = 0;
        this.beatPulse = 0;
    }

    triggerBeat() {
        this.beatPulse = 1.0;
    }

    update() {
        this.frame++;
        if (this.beatPulse > 0) {
            this.beatPulse = Math.max(0, this.beatPulse - 0.08);
        }
    }

    // ==================== DOG RENDERING ====================

    drawDog(ctx, dog, skinId = 'classic', mode = 'cube', isCrashed = false) {
        ctx.save();
        ctx.translate(dog.x + dog.width / 2, dog.y + dog.height / 2);

        // Rotation from physics (Geometry Dash flip)
        ctx.rotate(dog.rotation);

        // Rocket Mode rendering
        if (mode === 'rocket') {
            this.drawRocketDog(ctx, dog, skinId, isCrashed);
            ctx.restore();
            return;
        }

        const size = dog.width; // typically 48x48
        const half = size / 2;

        // Ground run animation squish/stretch
        let runBob = 0;
        let legAngle = 0;
        if (dog.onGround && !isCrashed) {
            const runCycle = (this.frame * 0.35) % (Math.PI * 2);
            runBob = Math.sin(runCycle) * 2;
            legAngle = Math.sin(runCycle) * 0.45;
        }

        // Draw Super Cape behind dog if super skin
        if (skinId === 'super' && !isCrashed) {
            this.drawSuperCape(ctx, -half, -half, dog.onGround ? legAngle : 0.6);
        }

        // --- PAWS (Back / Ground) ---
        if (!isCrashed) {
            this.drawPaws(ctx, -half, half, legAngle, skinId);
        }

        // --- DOG BODY (Squircle Shape - GD Cube homage) ---
        const skinColors = this.getSkinColors(skinId);
        
        ctx.save();
        ctx.translate(0, runBob);

        // Golden skin shine effect
        if (skinId === 'golden') {
            const grad = ctx.createLinearGradient(-half, -half, half, half);
            grad.addColorStop(0, '#FFE259');
            grad.addColorStop(0.5, '#FFA751');
            grad.addColorStop(1, '#FFD700');
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = skinColors.body;
        }

        // Rounded box body (GD cube style dog)
        ctx.beginPath();
        const r = 12;
        ctx.roundRect(-half + 2, -half + 2, size - 4, size - 4, [r, r, r - 4, r - 4]);
        ctx.fill();

        // Dark outline
        ctx.strokeStyle = skinColors.outline;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Corgi white chest patch / belly
        if (skinId === 'corgi') {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(half * 0.2, half * 0.4, half * 0.45, half * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- TAIL ---
        this.drawTail(ctx, -half, skinId, legAngle);

        // --- SNOUT / FACE ---
        this.drawSnout(ctx, half, skinColors, skinId, isCrashed);

        // --- EYES ---
        this.drawEyes(ctx, half, isCrashed);

        // --- EARS ---
        this.drawEars(ctx, half, skinColors, skinId, legAngle);

        // --- COLLAR / ACCESSORIES ---
        this.drawAccessories(ctx, half, skinId);

        ctx.restore(); // restore runBob translate

        // Crashed dizzy stars
        if (isCrashed) {
            this.drawDizzyStars(ctx, 0, -half - 12);
        }

        ctx.restore();
    }

    getSkinColors(skinId) {
        switch (skinId) {
            case 'corgi':
                return { body: '#F6993F', dark: '#DE751F', outline: '#4A2A0C', ears: '#E06B15', mask: '#FFFFFF' };
            case 'frenchie':
                return { body: '#8A95A5', dark: '#5E6977', outline: '#232A35', ears: '#768192', mask: '#3B4450' };
            case 'black':
                return { body: '#2C2D35', dark: '#1E1F24', outline: '#0F1012', ears: '#1F2025', mask: '#141416' };
            case 'golden':
                return { body: '#FFD700', dark: '#E6AC00', outline: '#8A6800', ears: '#FFA500', mask: '#CC9000' };
            case 'cool':
            case 'detective':
            case 'astro':
            case 'super':
            case 'viking':
            case 'classic':
            default:
                // Classic Fawn Pug
                return { body: '#E8C59A', dark: '#D4AA78', outline: '#4A3423', ears: '#4A3423', mask: '#3A2719' };
        }
    }

    drawPaws(ctx, left, bottom, legAngle, skinId) {
        ctx.fillStyle = skinId === 'corgi' ? '#FFFFFF' : (skinId === 'black' ? '#1F2025' : '#D4AA78');
        ctx.strokeStyle = '#4A3423';
        ctx.lineWidth = 2.5;

        // Front paw
        ctx.save();
        ctx.translate(10, bottom - 4);
        ctx.rotate(legAngle);
        ctx.beginPath();
        ctx.ellipse(0, 4, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Back paw
        ctx.save();
        ctx.translate(-10, bottom - 4);
        ctx.rotate(-legAngle);
        ctx.beginPath();
        ctx.ellipse(0, 4, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawTail(ctx, left, skinId, legAngle) {
        ctx.save();
        ctx.translate(left + 2, 4);

        if (skinId === 'corgi') {
            // Little cute white heart-fluff corgi butt
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-2, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Classic pug curled cinnamon bun tail!
            ctx.strokeStyle = '#4A3423';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const wag = Math.sin(this.frame * 0.4) * 0.2;
            ctx.arc(-5 + wag, -2, 7, 0.4, Math.PI * 1.6);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawSnout(ctx, half, colors, skinId, isCrashed) {
        ctx.save();
        ctx.translate(half * 0.45, half * 0.25);

        // Dark pug mask/muzzle
        ctx.fillStyle = colors.mask;
        ctx.beginPath();
        ctx.ellipse(0, 0, half * 0.45, half * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.outline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Little pug forehead wrinkles
        if (skinId !== 'corgi') {
            ctx.strokeStyle = colors.dark;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -half * 0.35, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, -half * 0.48, 4, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }

        // Cute shiny black nose
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(3, -2, 4.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose shine highlight
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(4, -3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Tongue sticking out! (Classic goofy pug trait)
        if (!isCrashed) {
            ctx.fillStyle = '#FF6B8B';
            ctx.beginPath();
            const tongueBounce = Math.sin(this.frame * 0.3) * 1.5;
            ctx.ellipse(5, 7 + tongueBounce, 3.5, 5, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#B33951';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Crashed tongue limp
            ctx.fillStyle = '#8B8BAE';
            ctx.beginPath();
            ctx.ellipse(6, 9, 3, 5, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawEyes(ctx, half, isCrashed) {
        const eyeX = half * 0.15;
        const eyeY = -half * 0.15;

        if (isCrashed) {
            // Dizzy spiral / X eyes
            ctx.strokeStyle = '#4A3423';
            ctx.lineWidth = 2.5;
            // Left eye X
            ctx.beginPath();
            ctx.moveTo(eyeX - 10, eyeY - 4);
            ctx.lineTo(eyeX - 2, eyeY + 4);
            ctx.moveTo(eyeX - 2, eyeY - 4);
            ctx.lineTo(eyeX - 10, eyeY + 4);
            ctx.stroke();

            // Right eye X
            ctx.beginPath();
            ctx.moveTo(eyeX + 4, eyeY - 4);
            ctx.lineTo(eyeX + 12, eyeY + 4);
            ctx.moveTo(eyeX + 12, eyeY - 4);
            ctx.lineTo(eyeX + 4, eyeY + 4);
            ctx.stroke();
            return;
        }

        // Big, round, soulful cartoon pug eyes!
        const drawEye = (x, y) => {
            // White
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3A2719';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dark pupil looking forward/up
            ctx.fillStyle = '#1E1815';
            ctx.beginPath();
            ctx.arc(x + 2, y, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Big anime shine
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x + 3.2, y - 1.8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 1.2, y + 1.8, 1, 0, Math.PI * 2);
            ctx.fill();
        };

        drawEye(eyeX - 6, eyeY);
        drawEye(eyeX + 8, eyeY);
    }

    drawEars(ctx, half, colors, skinId, legAngle) {
        ctx.save();

        if (skinId === 'corgi' || skinId === 'frenchie') {
            // Pointy bat/corgi ears
            ctx.fillStyle = colors.ears;
            ctx.strokeStyle = colors.outline;
            ctx.lineWidth = 2.5;

            // Front ear
            ctx.beginPath();
            ctx.moveTo(half * 0.2, -half + 2);
            ctx.lineTo(half * 0.5, -half - 14);
            ctx.lineTo(half * 0.75, -half + 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pink inner ear
            ctx.fillStyle = '#FFAEC9';
            ctx.beginPath();
            ctx.moveTo(half * 0.3, -half);
            ctx.lineTo(half * 0.5, -half - 10);
            ctx.lineTo(half * 0.65, -half + 2);
            ctx.closePath();
            ctx.fill();

            // Back ear
            ctx.fillStyle = colors.ears;
            ctx.beginPath();
            ctx.moveTo(-half * 0.2, -half + 2);
            ctx.lineTo(-half * 0.45, -half - 12);
            ctx.lineTo(-half * 0.65, -half + 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Classic floppy triangular pug ears
            const earBounce = Math.sin(this.frame * 0.4) * 0.15;
            ctx.fillStyle = colors.ears;
            ctx.strokeStyle = colors.outline;
            ctx.lineWidth = 2.5;

            // Front ear
            ctx.save();
            ctx.translate(half * 0.2, -half + 4);
            ctx.rotate(earBounce);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(8, -2, 12, 12);
            ctx.quadraticCurveTo(4, 14, 0, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Back ear
            ctx.save();
            ctx.translate(-half * 0.3, -half + 4);
            ctx.rotate(-earBounce);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-8, -2, -10, 10);
            ctx.quadraticCurveTo(-4, 12, 0, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    drawAccessories(ctx, half, skinId) {
        switch (skinId) {
            case 'cool':
                // "Deal with it" pixel sunglasses + backward red cap
                // Cap
                ctx.fillStyle = '#E53E3E';
                ctx.beginPath();
                ctx.arc(-2, -half + 2, half * 0.75, Math.PI, 0);
                ctx.fill();
                // Cap visor facing back
                ctx.fillStyle = '#C53030';
                ctx.beginPath();
                ctx.ellipse(-half * 0.7, -half + 6, 8, 3, -0.2, 0, Math.PI * 2);
                ctx.fill();

                // Sunglasses
                ctx.fillStyle = '#1A202C';
                ctx.fillRect(half * 0.1, -half * 0.3, 10, 8);
                ctx.fillRect(-half * 0.35, -half * 0.3, 10, 8);
                ctx.fillRect(-half * 0.1, -half * 0.25, 6, 3);
                // Sunglasses shine
                ctx.fillStyle = '#4FD1C5';
                ctx.fillRect(half * 0.15, -half * 0.25, 4, 2);
                ctx.fillRect(-half * 0.3, -half * 0.25, 4, 2);

                // Chunky gold chain
                ctx.strokeStyle = '#F6E05E';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(0, half * 0.6, 8, 0, Math.PI);
                ctx.stroke();
                break;

            case 'detective':
                // Sherlock Holmes deerstalker houndstooth hat
                ctx.fillStyle = '#8B6538';
                ctx.beginPath();
                ctx.arc(0, -half + 2, half * 0.7, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#6B4E2B';
                // Front and back earflaps
                ctx.fillRect(-half * 0.8, -half + 1, half * 1.6, 4);
                // Red bow on top
                ctx.fillStyle = '#E53E3E';
                ctx.beginPath();
                ctx.arc(0, -half - 8, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'astro':
                // Space Helmet bubble
                ctx.save();
                ctx.strokeStyle = '#CBD5E0';
                ctx.lineWidth = 3;
                ctx.fillStyle = 'rgba(235, 248, 255, 0.35)';
                ctx.beginPath();
                ctx.arc(4, -2, half * 0.95, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Visor reflection
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(-2, -half * 0.4, half * 0.3, half * 0.15, -0.6, 0, Math.PI * 2);
                ctx.fill();
                // Antenna
                ctx.strokeStyle = '#A0AEC0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(4, -half * 0.95 - 2);
                ctx.lineTo(4, -half * 0.95 - 10);
                ctx.stroke();
                ctx.fillStyle = '#E53E3E';
                ctx.beginPath();
                ctx.arc(4, -half * 0.95 - 11, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                break;

            case 'viking':
                // Viking horned helmet
                ctx.fillStyle = '#718096';
                ctx.beginPath();
                ctx.arc(0, -half + 2, half * 0.7, Math.PI, 0);
                ctx.fill();
                // Horns
                ctx.fillStyle = '#F7FAFC';
                ctx.strokeStyle = '#4A5568';
                ctx.lineWidth = 1.5;
                // Left horn
                ctx.beginPath();
                ctx.moveTo(-half * 0.5, -half + 2);
                ctx.quadraticCurveTo(-half - 6, -half - 8, -half * 0.6, -half - 14);
                ctx.quadraticCurveTo(-half * 0.4, -half - 6, -half * 0.3, -half + 2);
                ctx.fill();
                ctx.stroke();
                // Right horn
                ctx.beginPath();
                ctx.moveTo(half * 0.5, -half + 2);
                ctx.quadraticCurveTo(half + 6, -half - 8, half * 0.6, -half - 14);
                ctx.quadraticCurveTo(half * 0.4, -half - 6, half * 0.3, -half + 2);
                ctx.fill();
                ctx.stroke();
                break;

            case 'golden':
                // Golden royal crown
                ctx.fillStyle = '#FFE600';
                ctx.strokeStyle = '#D97706';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-12, -half + 4);
                ctx.lineTo(-14, -half - 8);
                ctx.lineTo(-6, -half - 2);
                ctx.lineTo(0, -half - 12);
                ctx.lineTo(6, -half - 2);
                ctx.lineTo(14, -half - 8);
                ctx.lineTo(12, -half + 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Rubies on crown
                ['#EF4444', '#3B82F6', '#10B981'].forEach((color, i) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(-8 + i * 8, -half, 2, 0, Math.PI * 2);
                    ctx.fill();
                });
                break;

            case 'super':
                // Hero black mask
                ctx.fillStyle = '#18181B';
                ctx.beginPath();
                ctx.ellipse(half * 0.15, -half * 0.15, half * 0.55, half * 0.22, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Red collar with gold dog bone tag
                ctx.fillStyle = '#EF4444';
                ctx.fillRect(-half * 0.6, half * 0.45, half * 1.2, 5);
                // Golden bone tag
                ctx.fillStyle = '#F59E0B';
                ctx.beginPath();
                ctx.arc(0, half * 0.65, 3.5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    drawSuperCape(ctx, left, top, angle) {
        ctx.save();
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = 2;

        const wave = Math.sin(this.frame * 0.35) * 4;
        ctx.beginPath();
        ctx.moveTo(left + 6, top + 14);
        ctx.quadraticCurveTo(left - 20, top + 8 + wave, left - 24, top + 24 + wave);
        ctx.quadraticCurveTo(left - 12, top + 30, left + 10, top + 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawRocketDog(ctx, dog, skinId, isCrashed) {
        const half = dog.width / 2;

        // Cardboard box rocket body
        ctx.fillStyle = '#B45309';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-half - 6, -half + 4, dog.width + 12, dog.height - 4, 8);
        ctx.fill();
        ctx.stroke();

        // Cardboard tape & cute painted wings
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(-half - 6, half);
        ctx.lineTo(-half - 16, half + 8);
        ctx.lineTo(-half - 6, half - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rocket cone in front
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(half + 6, -half + 4);
        ctx.lineTo(half + 18, 0);
        ctx.lineTo(half + 6, half);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pug peeking out top
        ctx.save();
        ctx.translate(0, -6);
        const skinColors = this.getSkinColors(skinId);
        ctx.fillStyle = skinColors.body;
        ctx.beginPath();
        ctx.arc(0, -half + 6, 14, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = skinColors.outline;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        this.drawEyes(ctx, half * 0.7, isCrashed);
        this.drawEars(ctx, half * 0.7, skinColors, skinId, 0);
        ctx.restore();

        // Flame exhaust particles out the back
        if (!isCrashed) {
            const flicker = Math.random() * 8;
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.moveTo(-half - 6, -2);
            ctx.lineTo(-half - 20 - flicker, 2);
            ctx.lineTo(-half - 6, 8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.moveTo(-half - 6, 0);
            ctx.lineTo(-half - 14 - flicker * 0.5, 2);
            ctx.lineTo(-half - 6, 6);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawDizzyStars(ctx, x, y) {
        const starCount = 3;
        for (let i = 0; i < starCount; i++) {
            const angle = (this.frame * 0.12) + (i * (Math.PI * 2 / starCount));
            const sx = x + Math.cos(angle) * 18;
            const sy = y + Math.sin(angle) * 6;
            ctx.fillStyle = '#FBBF24';
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ==================== OBSTACLE RENDERING ====================

    drawObstacle(ctx, obs) {
        ctx.save();
        ctx.translate(obs.x, obs.y);

        switch (obs.type) {
            case 'poop':
                this.drawPoop(ctx, obs.width, obs.height);
                break;
            case 'double_poop':
                this.drawDoublePoop(ctx, obs.width, obs.height);
                break;
            case 'triple_poop':
                this.drawTriplePoop(ctx, obs.width, obs.height);
                break;
            case 'hydrant':
                this.drawHydrant(ctx, obs.width, obs.height);
                break;
            case 'angry_dog':
                this.drawAngryDog(ctx, obs.width, obs.height);
                break;
            case 'cat':
                this.drawCat(ctx, obs.width, obs.height);
                break;
            case 'jump_pad':
                this.drawJumpPad(ctx, obs.width, obs.height, obs.bounceAnim || 0);
                break;
            case 'jump_ring':
                this.drawJumpRing(ctx, obs.width, obs.height, obs.used);
                break;
            case 'portal_rocket':
                this.drawPortal(ctx, obs.width, obs.height, '#F59E0B', '🚀');
                break;
            case 'portal_normal':
                this.drawPortal(ctx, obs.width, obs.height, '#10B981', '🐶');
                break;
            case 'block':
                this.drawPlatformBlock(ctx, obs.width, obs.height, obs.variant || 'brick');
                break;
            case 'bone':
                this.drawCollectibleBone(ctx, obs.width, obs.height, obs.collected);
                break;
            case 'mud':
                this.drawMudPuddle(ctx, obs.width, obs.height);
                break;
        }

        ctx.restore();
    }

    // The iconic POOP obstacle (replaces GD spikes!)
    drawPoop(ctx, w, h) {
        const cx = w / 2;
        const cy = h;

        // Animated tiny fly circling the poop
        const flyAngle = this.frame * 0.15;
        const flyX = cx + Math.cos(flyAngle) * 12;
        const flyY = cy - h * 0.8 + Math.sin(flyAngle) * 6;
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(flyX, flyY, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Stink lines
        ctx.strokeStyle = 'rgba(101, 163, 13, 0.45)';
        ctx.lineWidth = 1.5;
        const wave = Math.sin(this.frame * 0.2) * 2;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - h * 0.7);
        ctx.quadraticCurveTo(cx - 10 + wave, cy - h - 4, cx - 4, cy - h - 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - h * 0.7);
        ctx.quadraticCurveTo(cx + 10 - wave, cy - h - 4, cx + 4, cy - h - 10);
        ctx.stroke();

        // Poop Swirl Layers
        ctx.fillStyle = '#6B4226'; // Rich brown
        ctx.strokeStyle = '#3D2413';
        ctx.lineWidth = 2.5;

        // Layer 1: Base blob
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8, w * 0.44, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Layer 2: Middle blob
        ctx.beginPath();
        ctx.ellipse(cx, cy - 20, w * 0.35, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Layer 3: Top swirl cone
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 26);
        ctx.quadraticCurveTo(cx - 2, cy - h + 2, cx + 4, cy - h);
        ctx.quadraticCurveTo(cx + 10, cy - h + 6, cx + 7, cy - 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gloss highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 22, 4, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDoublePoop(ctx, w, h) {
        ctx.save();
        this.drawPoop(ctx, w * 0.5, h);
        ctx.translate(w * 0.5, 0);
        this.drawPoop(ctx, w * 0.5, h);
        ctx.restore();
    }

    drawTriplePoop(ctx, w, h) {
        ctx.save();
        const pw = w / 3;
        this.drawPoop(ctx, pw, h);
        ctx.translate(pw, 0);
        this.drawPoop(ctx, pw, h);
        ctx.translate(pw, 0);
        this.drawPoop(ctx, pw, h);
        ctx.restore();
    }

    // Fire Hydrant (Taller 2-block obstacle)
    drawHydrant(ctx, w, h) {
        const cx = w / 2;
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#7F1D1D';
        ctx.lineWidth = 3;

        // Base flange
        ctx.beginPath();
        ctx.roundRect(cx - w * 0.45, h - 8, w * 0.9, 8, 3);
        ctx.fill();
        ctx.stroke();

        // Main cylinder
        ctx.beginPath();
        ctx.roundRect(cx - w * 0.32, 12, w * 0.64, h - 20, 4);
        ctx.fill();
        ctx.stroke();

        // Side nozzles (yellow caps)
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(cx - w * 0.48, h * 0.45, 8, 12);
        ctx.fillRect(cx + w * 0.48 - 8, h * 0.45, 8, 12);

        // Top dome
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(cx, 12, w * 0.32, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Top nut (yellow pentagon)
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(cx - 5, 2, 10, 6);

        // Metal highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(cx - w * 0.22, 14, 5, h - 26);
    }

    // Angry Dog (e.g. Grumpy Doberman / Angry Chihuahua)
    drawAngryDog(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;
        const rageJitter = Math.sin(this.frame * 0.8) * 1.5;

        ctx.save();
        ctx.translate(rageJitter, 0);

        // Angry dark body
        ctx.fillStyle = '#374151';
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(4, 10, w - 8, h - 14, 8);
        ctx.fill();
        ctx.stroke();

        // Spiky collar
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(8, 14, w - 16, 6);
        ctx.fillStyle = '#E5E7EB';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(12 + i * 8, 14);
            ctx.lineTo(15 + i * 8, 9);
            ctx.lineTo(18 + i * 8, 14);
            ctx.fill();
        }

        // Snarl teeth & mouth
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(cx - 10, h - 16, 20, 8);
        ctx.fillStyle = '#FFFFFF';
        // Sharp teeth
        ctx.beginPath();
        ctx.moveTo(cx - 9, h - 16);
        ctx.lineTo(cx - 6, h - 11);
        ctx.lineTo(cx - 3, h - 16);
        ctx.lineTo(cx, h - 11);
        ctx.lineTo(cx + 3, h - 16);
        ctx.lineTo(cx + 6, h - 11);
        ctx.lineTo(cx + 9, h - 16);
        ctx.fill();

        // Glowing angry red eyes with sharp brows
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.ellipse(cx - 7, cy - 2, 4, 3, 0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 7, cy - 2, 4, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Angry brow lines
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 8);
        ctx.lineTo(cx - 3, cy - 4);
        ctx.moveTo(cx + 12, cy - 8);
        ctx.lineTo(cx + 3, cy - 4);
        ctx.stroke();

        // Comic bark bubble periodically
        if ((this.frame % 60) < 30) {
            ctx.fillStyle = '#FEF08A';
            ctx.strokeStyle = '#854D0E';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(w - 6, -10, 26, 16, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#713F12';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('ГАРР!', w - 3, 2);
        }

        ctx.restore();
    }

    // Grumpy Alley Cat
    drawCat(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;

        ctx.fillStyle = '#1F2937';
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.5;

        // Arched back body
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pointy ears
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 8);
        ctx.lineTo(cx - 15, cy - 20);
        ctx.lineTo(cx - 5, cy - 12);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 12, cy - 8);
        ctx.lineTo(cx + 15, cy - 20);
        ctx.lineTo(cx + 5, cy - 12);
        ctx.fill();
        ctx.stroke();

        // Yellow cat slit eyes
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 4, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 6, cy - 4, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.fillRect(cx - 7, cy - 7, 2, 6);
        ctx.fillRect(cx + 5, cy - 7, 2, 6);

        // Hissing tail
        const tailWhip = Math.sin(this.frame * 0.3) * 6;
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy + 8);
        ctx.quadraticCurveTo(cx - 24 + tailWhip, cy - 6, cx - 18, cy - 18);
        ctx.stroke();
    }

    // Mud Puddle (Slippery trap)
    drawMudPuddle(ctx, w, h) {
        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 5, w * 0.48, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mud splash bubbles
        ctx.fillStyle = '#92400E';
        ctx.beginPath();
        ctx.arc(w * 0.35, h - 6, 3, 0, Math.PI * 2);
        ctx.arc(w * 0.65, h - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Jump Pad (Bouncy spring with squeaky paw)
    drawJumpPad(ctx, w, h, bounceAnim) {
        const cx = w / 2;
        const cy = h;
        const squish = bounceAnim * 6;

        // Base plate
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(2, cy - 6, w - 4, 6);

        // Spring coil
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 6);
        ctx.lineTo(cx + 10, cy - 10 + squish * 0.5);
        ctx.lineTo(cx - 10, cy - 14 + squish);
        ctx.stroke();

        // Yellow/Pink bouncy cushion
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(4, cy - 18 + squish, w - 8, 10, 5);
        ctx.fill();
        ctx.stroke();

        // Paw print icon on top
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 13 + squish, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Jump Ring (Glowing Flying Sausage / Bone)
    drawJumpRing(ctx, w, h, used) {
        const cx = w / 2;
        const cy = h / 2;
        const pulse = Math.sin(this.frame * 0.15) * 4;

        if (!used) {
            // Glowing outer aura
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, (w / 2) + pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Floating Sausage Treat!
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(this.frame * 0.08) * 0.2);

        // Delicious plump sausage
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-14, -6, 28, 12, 6);
        ctx.fill();
        ctx.stroke();

        // Grill marks
        ctx.strokeStyle = '#7F1D1D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -5); ctx.lineTo(-4, 5);
        ctx.moveTo(0, -5);  ctx.lineTo(2, 5);
        ctx.moveTo(6, -5);  ctx.lineTo(8, 5);
        ctx.stroke();

        ctx.restore();
    }

    // Mode Portals (Rocket / Normal)
    drawPortal(ctx, w, h, color, icon) {
        const cx = w / 2;
        const cy = h / 2;
        const pulse = Math.sin(this.frame * 0.12) * 5;

        // Swirling vortex background
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.frame * 0.05);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.55 + pulse, h * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.restore();

        // Portal Arch
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.42, h * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Portal Icon
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, cx, cy);
    }

    // Platforms (Park brick walls, wooden crates, hedge blocks)
    drawPlatformBlock(ctx, w, h, variant) {
        if (variant === 'hedge') {
            // Bush block with cute little flowers
            ctx.fillStyle = '#22C55E';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#15803D';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, w, h);

            // Leaf texture dots
            ctx.fillStyle = '#16A34A';
            ctx.beginPath();
            ctx.arc(8, 8, 4, 0, Math.PI * 2);
            ctx.arc(w - 10, h - 8, 5, 0, Math.PI * 2);
            ctx.fill();

            // Tiny flower
            ctx.fillStyle = '#F472B6';
            ctx.beginPath();
            ctx.arc(w / 2, 8, 3, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Brick sidewalk wall
        ctx.fillStyle = '#F97316';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#9A3412';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(0, 0, w, h);

        // Brick mortar pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        // Vertical lines
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h / 2);
        ctx.moveTo(w / 4, h / 2);
        ctx.lineTo(w / 4, h);
        ctx.moveTo(w * 0.75, h / 2);
        ctx.lineTo(w * 0.75, h);
        ctx.stroke();
    }

    // Secret Collectible Gold Bone (like GD Secret Coins)
    drawCollectibleBone(ctx, w, h, collected) {
        if (collected) return;
        const cx = w / 2;
        const cy = h / 2 + Math.sin(this.frame * 0.1) * 3;

        ctx.save();
        ctx.translate(cx, cy);

        // Golden glow
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Bone shape
        ctx.fillStyle = '#FBBF24';
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2;

        // Middle bar
        ctx.fillRect(-10, -3, 20, 6);

        // End knobs
        [[-10, -4], [-10, 4], [10, -4], [10, 4]].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.restore();
    }

    // ==================== PARALLAX BACKGROUNDS ====================

    drawBackground(ctx, theme, cameraX, width, height) {
        // Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (theme === 'night') {
            skyGrad.addColorStop(0, '#0F172A');
            skyGrad.addColorStop(0.7, '#1E1B4B');
            skyGrad.addColorStop(1, '#312E81');
        } else if (theme === 'city') {
            // Golden sunset boulevard
            skyGrad.addColorStop(0, '#7C2D12');
            skyGrad.addColorStop(0.4, '#EA580C');
            skyGrad.addColorStop(0.8, '#FBBF24');
            skyGrad.addColorStop(1, '#FEF08A');
        } else {
            // Bright cartoon morning park
            skyGrad.addColorStop(0, '#38BDF8');
            skyGrad.addColorStop(0.6, '#7DD3FC');
            skyGrad.addColorStop(1, '#E0F2FE');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Sun or Moon
        this.drawCelestial(ctx, theme, width, height);

        // Layer 1: Distant Clouds / Hills (Slow parallax 0.1x)
        this.drawDistantLayer(ctx, theme, cameraX * 0.1, width, height);

        // Layer 2: Midground City skyline or Park trees (0.3x)
        this.drawMidgroundLayer(ctx, theme, cameraX * 0.3, width, height);

        // Layer 3: Park Picket Fence & Street Lamps (0.6x)
        this.drawFenceLayer(ctx, theme, cameraX * 0.6, width, height);
    }

    drawCelestial(ctx, theme, width, height) {
        ctx.save();
        if (theme === 'night') {
            // Full Moon with funny bone crater silhouette!
            ctx.fillStyle = '#FEF08A';
            ctx.beginPath();
            ctx.arc(width - 90, 75, 34, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
            ctx.beginPath();
            ctx.arc(width - 90, 75, 46, 0, Math.PI * 2);
            ctx.fill();

            // Twinkling cartoon stars
            for (let i = 0; i < 20; i++) {
                const sx = (i * 73) % width;
                const sy = (i * 37) % (height * 0.45);
                const twinkle = Math.sin(this.frame * 0.08 + i) * 1.5 + 2;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(sx, sy, twinkle, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Smiling Cartoon Sun!
            const sunX = width - 90;
            const sunY = 70;
            const pulse = this.beatPulse * 6;

            ctx.fillStyle = '#FBBF24';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 32 + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Sun Rays
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
            ctx.lineWidth = 4;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                const rot = a + this.frame * 0.005;
                ctx.beginPath();
                ctx.moveTo(sunX + Math.cos(rot) * 38, sunY + Math.sin(rot) * 38);
                ctx.lineTo(sunX + Math.cos(rot) * 48, sunY + Math.sin(rot) * 48);
                ctx.stroke();
            }

            // Sun Cool Sunglasses
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(sunX - 16, sunY - 4, 14, 8);
            ctx.fillRect(sunX + 2, sunY - 4, 14, 8);
            ctx.fillRect(sunX - 2, sunY - 2, 4, 3);
            // Smile
            ctx.strokeStyle = '#B45309';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(sunX, sunY + 8, 8, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawDistantLayer(ctx, theme, offset, width, height) {
        // Fluffy cartoon clouds
        ctx.fillStyle = (theme === 'night') ? 'rgba(75, 85, 99, 0.35)' : 'rgba(255, 255, 255, 0.75)';
        const cloudSpacing = 260;
        const startX = -((offset) % cloudSpacing) - 100;

        for (let x = startX; x < width + 200; x += cloudSpacing) {
            this.drawCloud(ctx, x, 60);
            this.drawCloud(ctx, x + 130, 110, 0.75);
        }

        // Rolling green or purple distant hills
        ctx.fillStyle = (theme === 'night') ? '#1E1B4B' : (theme === 'city' ? '#78350F' : '#86EFAC');
        ctx.beginPath();
        ctx.moveTo(0, height);
        const hillSpacing = 300;
        const hillOffset = offset % hillSpacing;
        for (let x = -hillSpacing; x < width + hillSpacing * 2; x += 60) {
            const hx = x - hillOffset;
            const hy = height - 130 + Math.sin(hx * 0.01) * 35;
            ctx.lineTo(hx, hy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
    }

    drawCloud(ctx, x, y, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.arc(16, -6, 22, 0, Math.PI * 2);
        ctx.arc(36, 0, 16, 0, Math.PI * 2);
        ctx.arc(18, 8, 14, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawMidgroundLayer(ctx, theme, offset, width, height) {
        if (theme === 'city') {
            // City skyline buildings
            ctx.fillStyle = '#451A03';
            const bldSpacing = 80;
            const startX = -((offset) % bldSpacing) - 80;
            for (let x = startX; x < width + 100; x += bldSpacing) {
                const bldH = 80 + ((Math.abs(Math.sin(x)) * 70) | 0);
                ctx.fillRect(x, height - 100 - bldH, bldSpacing - 8, bldH);
                // Lit windows
                ctx.fillStyle = '#FEF08A';
                for (let wx = x + 10; wx < x + bldSpacing - 18; wx += 16) {
                    for (let wy = height - 100 - bldH + 15; wy < height - 110; wy += 22) {
                        if (((wx + wy) % 3) !== 0) {
                            ctx.fillRect(wx, wy, 8, 10);
                        }
                    }
                }
                ctx.fillStyle = '#451A03';
            }
        } else {
            // Cartoon park trees with round crowns
            const treeSpacing = 160;
            const startX = -((offset) % treeSpacing) - 100;

            for (let x = startX; x < width + 160; x += treeSpacing) {
                // Trunk
                ctx.fillStyle = '#78350F';
                ctx.fillRect(x + 16, height - 150, 14, 70);

                // Leafy canopy
                ctx.fillStyle = (theme === 'night') ? '#064E3B' : '#22C55E';
                ctx.beginPath();
                ctx.arc(x + 23, height - 155, 32, 0, Math.PI * 2);
                ctx.arc(x + 5, height - 145, 22, 0, Math.PI * 2);
                ctx.arc(x + 40, height - 145, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawFenceLayer(ctx, theme, offset, width, height) {
        // White wooden picket fence
        const postW = 12;
        const postH = 46;
        const postSpacing = 28;
        const fenceY = height - 105;
        const startX = -((offset) % postSpacing) - 40;

        ctx.fillStyle = (theme === 'night') ? '#4B5563' : '#F8FAFC';
        ctx.strokeStyle = (theme === 'night') ? '#1F2937' : '#CBD5E1';
        ctx.lineWidth = 1.5;

        // Horizontal fence rails
        ctx.fillRect(0, fenceY + 12, width, 5);
        ctx.fillRect(0, fenceY + 28, width, 5);

        for (let x = startX; x < width + 40; x += postSpacing) {
            // Picket post with pointy triangular top
            ctx.beginPath();
            ctx.moveTo(x, fenceY + postH);
            ctx.lineTo(x, fenceY + 8);
            ctx.lineTo(x + postW / 2, fenceY);
            ctx.lineTo(x + postW, fenceY + 8);
            ctx.lineTo(x + postW, fenceY + postH);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    // Ground: Sidewalk tiles, grass lawn, flowers
    drawGround(ctx, groundY, cameraX, width, height) {
        // Top lush grass strip
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(0, groundY, width, 8);
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(0, groundY + 8, width, 6);

        // Sidewalk pavement
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(0, groundY + 14, width, height - (groundY + 14));

        // Pavement tile lines (moving with camera)
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.5;
        const tileSize = 64;
        const startX = -((cameraX) % tileSize);

        for (let x = startX; x < width + tileSize; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, groundY + 14);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal curb line
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 14);
        ctx.lineTo(width, groundY + 14);
        ctx.stroke();

        // Little dandelion flowers / weeds on grass edge
        const flowerSpacing = 90;
        const flowerStart = -((cameraX * 0.8) % flowerSpacing);
        for (let fx = flowerStart; fx < width + flowerSpacing; fx += flowerSpacing) {
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(fx + 10, groundY + 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Global graphics singleton
window.graphicsEngine = new GraphicsEngine();
