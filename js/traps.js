// Trap management system
class TrapManager {
    constructor() {
        this.traps = [];
    }

    createTrap(type, config) {
        const baseTrap = {
            type: type,
            x: config.x,
            y: config.y,
            width: config.width || 20,
            height: config.height || 20,
            active: true,
            ...config
        };

        switch (type) {
            case 'spike':
                return { ...baseTrap, damage: 100 };

            case 'fakePlatform':
                return {
                    ...baseTrap,
                    color: '#f39c12',
                    onContact: function () {
                        this.active = false;
                        if (audioManager) {
                            audioManager.play('trap');
                        }
                    }
                };

            case 'collapsingPlatform':
                return {
                    ...baseTrap,
                    color: '#9b59b6',
                    timer: 0,
                    collapseTime: 70,
                    shakeTime: 30,
                    onContact: function () {
                        this.timer++;
                        if (this.timer > this.collapseTime) {
                            this.active = false;
                            if (audioManager) {
                                audioManager.play('trap');
                            }
                        }
                    }
                };

            case 'movingPlatform':
                return {
                    ...baseTrap,
                    color: '#1abc9c',
                    startX: config.startX || config.x,
                    endX: config.endX || config.x + 100,
                    speed: config.speed || 2,
                    direction: 1,
                    update: function () {
                        this.x += this.speed * this.direction;
                        if (this.x <= this.startX || this.x >= this.endX) {
                            this.direction *= -1;
                        }
                    }
                };

            case 'invisibleWall':
                return {
                    ...baseTrap,
                    color: 'rgba(149, 165, 166, 0.15)',
                    visible: false
                };

            case 'reverseControls':
                return {
                    ...baseTrap,
                    color: 'rgba(231, 76, 60, 0.3)',
                    active: true,
                    area: true
                };

            default:
                return baseTrap;
        }
    }

    updateTraps() {
        this.traps.forEach(trap => {
            if (trap.update) trap.update();
        });
    }

    checkCollisions(player) {
        this.traps.forEach(trap => {
            if (!trap.active) return;

            if (Utils.collides(player, trap)) {
                this.handleTrapCollision(trap, player);
            }
        });
    }

    handleTrapCollision(trap, player) {
        switch (trap.type) {
            case 'spike':
                player.die();
                break;

            case 'fakePlatform':
                if (trap.onContact) trap.onContact();
                player.die();
                break;

            case 'collapsingPlatform':
                if (Math.abs((player.y + player.height) - trap.y) < 5) {
                    if (trap.onContact) trap.onContact();
                }
                break;

            case 'reverseControls':
                player.controlsReversed = true;
                break;
        }
    }

    drawTraps(ctx) {
        this.traps.forEach(trap => {
            if (!trap.active && trap.type !== 'invisibleWall') return;

            ctx.fillStyle = trap.color || '#ffffff';

            switch (trap.type) {
                case 'spike':
                    // Draw spike triangle
                    ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
                    ctx.beginPath();
                    ctx.moveTo(trap.x, trap.y + trap.height);
                    ctx.lineTo(trap.x + trap.width / 2, trap.y);
                    ctx.lineTo(trap.x + trap.width, trap.y + trap.height);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'collapsingPlatform':
                    if (trap.active) {
                        const shake = trap.timer > trap.shakeTime ? Math.sin(trap.timer) * 2 : 0;
                        ctx.fillStyle = trap.timer > trap.shakeTime ? '#c0392b' : trap.color;
                        ctx.fillRect(trap.x + shake, trap.y, trap.width, trap.height);
                    }
                    break;

                default:
                    ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
            }
        });
    }

    reset() {
        this.traps.forEach(trap => {
            if (trap.type === 'collapsingPlatform') {
                trap.active = true;
                trap.timer = 0;
            }
        });
    }
}