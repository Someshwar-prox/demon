// Utility functions
class Utils {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static collides(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static createParticle(x, y, color, count = 15, ctx) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 1,
                color: color,
                size: Math.random() * 3 + 2
            });
        }
        return particles;
    }

    static updateParticles(particles) {
        return particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    static drawParticles(particles, ctx) {
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }
}

// Local storage management
class Storage {
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
}

// Game constants
const CONSTANTS = {
    GRAVITY: 0.6,
    PLAYER_SPEED: 5.5,
    JUMP_POWER: 13,
    TERMINAL_VELOCITY: 20,
    LEVEL_TYPES: {
        TUTORIAL: 'tutorial',
        INTERMEDIATE: 'intermediate',
        ADVANCED: 'advanced',
        EXPERT: 'expert'
    }
};