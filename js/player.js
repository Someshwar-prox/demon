// Player class
class Player {
    constructor() {
        this.reset();
        this.keys = {};
        this.setupControls();
    }

    reset() {
        this.x = 50;
        this.y = 400;
        // Hitbox (physics) — keep original size to preserve gameplay
        this.width = 25;
        this.height = 25;
        // Visual size (can be larger without affecting collisions)
        this.visualWidth = 28;
        this.visualHeight = 38;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = true;
        this.color = '#3498db';
        this.trail = [];
        this.controlsReversed = false;
        this.deaths = 0;
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleInput();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.handleInput();
        });

        // Mobile controls (guard for missing elements)
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const jumpBtn = document.getElementById('jumpBtn');

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
            leftBtn.addEventListener('touchend', () => this.keys['ArrowLeft'] = false);
        }

        if (rightBtn) {
            rightBtn.addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
            rightBtn.addEventListener('touchend', () => this.keys['ArrowRight'] = false);
        }

        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', () => {
                if (!this.isJumping) {
                    this.jump();
                }
            });
        }
    }

    handleInput() {
        const leftKeys = ['ArrowLeft', 'a', 'A'];
        const rightKeys = ['ArrowRight', 'd', 'D'];
        const jumpKeys = ['ArrowUp', 'w', 'W', ' '];

        // Horizontal movement
        const leftPressed = leftKeys.some(key => this.keys[key]);
        const rightPressed = rightKeys.some(key => this.keys[key]);

        if (leftPressed && !rightPressed) {
            this.velocityX = this.controlsReversed ? CONSTANTS.PLAYER_SPEED : -CONSTANTS.PLAYER_SPEED;
        } else if (rightPressed && !leftPressed) {
            this.velocityX = this.controlsReversed ? -CONSTANTS.PLAYER_SPEED : CONSTANTS.PLAYER_SPEED;
        } else {
            this.velocityX = 0;
        }

        // Jumping
        if (jumpKeys.some(key => this.keys[key]) && !this.isJumping) {
            this.jump();
        }
    }

    jump() {
        this.velocityY = -CONSTANTS.JUMP_POWER;
        this.isJumping = true;
        if (audioManager) {
            audioManager.play('jump');
        }

        // Add trail effect
        if (window.game) {
            window.game.particles.push(...Utils.createParticle(
                this.x + this.width / 2,
                this.y + this.height,
                this.color,
                5
            ));
        }
    }

    update() {
        // Apply physics
        this.velocityY += CONSTANTS.GRAVITY;
        this.velocityY = Utils.clamp(this.velocityY, -CONSTANTS.JUMP_POWER, CONSTANTS.TERMINAL_VELOCITY);

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Update trail
        this.trail.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        });
        if (this.trail.length > 8) this.trail.shift();

        // Boundary check
        if (this.y > window.game?.canvas.height || this.y < -100) {
            this.die();
        }
    }

    die() {
        this.deaths++;
        if (audioManager) {
            audioManager.play('death');
        }

        if (window.game) {
            window.game.particles.push(...Utils.createParticle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                '#e74c3c',
                25
            ));
            window.game.onPlayerDeath();
        }

        this.reset();
    }

    checkCollisions(platforms) {
        this.isJumping = true;

        platforms.forEach(platform => {
            if (Utils.collides(this, platform)) {
                // Collision from top
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                }
                // Collision from bottom
                else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // Collision from left
                else if (this.velocityX > 0 && this.x + this.width - this.velocityX <= platform.x) {
                    this.x = platform.x - this.width;
                }
                // Collision from right
                else if (this.velocityX < 0 && this.x - this.velocityX >= platform.x + platform.width) {
                    this.x = platform.x + platform.width;
                }
            }
        });
    }

    draw(ctx) {
        // Draw trail
        ctx.globalAlpha = 0.3;
        this.trail.forEach((pos, i) => {
            const alpha = i / this.trail.length;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.color;
            const size = this.width * (0.6 + alpha * 0.4);
            ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
        });
        ctx.globalAlpha = 1;

        // Draw Ironman-like player (procedural)
        // Visual is centered/anchored to hitbox so physics remain unchanged
        const w = this.visualWidth || this.width;
        const h = this.visualHeight || this.height;
        const px = this.x + (this.width - w) / 2;
        // Align visual so its bottom matches hitbox bottom (feet align)
        const py = this.y + this.height - h;

        // Draw stylized professional square (visual only — hitbox unchanged)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 6;

        // Base rounded rect with gradient
        const grad = ctx.createLinearGradient(px, py, px, py + h);
        grad.addColorStop(0, '#6fb3ff');
        grad.addColorStop(0.6, '#2b86d6');
        grad.addColorStop(1, '#1f4f8a');

        ctx.fillStyle = grad;
        roundRect(ctx, px, py, w, h, Math.max(3, w * 0.12), true, false);

        // Outer subtle stroke
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        roundRect(ctx, px + 0.75, py + 0.75, w - 1.5, h - 1.5, Math.max(3, w * 0.12), false, true);

        // Top highlight
        const highlightH = Math.max(4, h * 0.18);
        const highlightGrad = ctx.createLinearGradient(px, py, px, py + highlightH);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = highlightGrad;
        roundRect(ctx, px + 1, py + 1, w - 2, highlightH, Math.max(3, w * 0.12), true, false);

        // Small emblem (center) — professional badge
        ctx.fillStyle = '#ffffffcc';
        ctx.beginPath();
        ctx.moveTo(px + w * 0.5, py + h * 0.45);
        ctx.lineTo(px + w * 0.62, py + h * 0.6);
        ctx.lineTo(px + w * 0.38, py + h * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // helper: rounded rect
        function roundRect(ctx, x, y, w, h, r, fill, stroke) {
            if (typeof r === 'undefined') r = 5;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
        }

        // Draw reverse controls indicator
        if (this.controlsReversed) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('REVERSED CONTROLS!', ctx.canvas.width / 2, 30);
            ctx.textAlign = 'left';
        }
    }
}