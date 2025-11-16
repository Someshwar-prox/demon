// Main game class
const VIRTUAL_WIDTH = 900;
const VIRTUAL_HEIGHT = 550;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameActive = false;
        this.particles = [];

        // Initialize managers
        this.audioManager = new AudioManager();
        // Use global authManager instead of creating a new one
        this.authManager = null; // Will be set after authManager is initialized
        this.levelManager = new LevelManager();
        this.trapManager = new TrapManager();
        this.player = new Player();
        this.uiManager = new UIManager(this);

        // Game state
        this.currentLevel = null;
        this.levelStartTime = 0;
        this.gameStartTime = 0;
        this.platforms = [];
        this.door = null;

        // Make global for other classes
        window.game = this;
        try { window.audioManager = this.audioManager; } catch (e) { /* ignore if not writable */ }
        // Also update lexical global if present so files referencing `audioManager` variable work
        try { if (typeof audioManager !== 'undefined') audioManager = this.audioManager; } catch (e) { /* ignore */ }

        // Load settings (scale mode etc.) before initializing canvas
        this.settings = this.loadSettings();

        this.init();
    }

    init() {
        // Setup responsive canvas using a fixed virtual resolution
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => this.resizeCanvas());

        // Start background music
        this.audioManager.playMusic();

        // Check URL parameters for level
        const urlParams = new URLSearchParams(window.location.search);
        const levelParam = urlParams.get('level');
        if (levelParam) {
            const levelIndex = parseInt(levelParam) - 1;
            if (levelIndex >= 0 && levelIndex < this.levelManager.getLevelCount()) {
                this.startLevel(levelIndex);
            }
        }

        // Ensure UI scale icon reflects loaded settings
        if (this.uiManager && typeof this.uiManager.updateScaleIcon === 'function') {
            this.uiManager.updateScaleIcon(this.getScaleMode());
        }
    }

    resizeCanvas() {
        const container = document.querySelector('.game-container') || document.body;
        const dpr = window.devicePixelRatio || 1;

        // Two modes: 'fit' (scale to container using DPR) and 'pixel' (integer pixel scale)
        const mode = (this.settings && this.settings.scaleMode) ? this.settings.scaleMode : 'fit';

        if (mode === 'pixel') {
            // Integer scale based on available container size
            const maxW = container.clientWidth;
            const maxH = container.clientHeight;
            const scale = Math.floor(Math.min(maxW / VIRTUAL_WIDTH, maxH / VIRTUAL_HEIGHT)) || 1;

            // If scale is less than 1, fallback to fit mode
            if (scale < 1) {
                this.applyFitMode(dpr);
                return;
            }

            const cssW = VIRTUAL_WIDTH * scale;
            const cssH = VIRTUAL_HEIGHT * scale;

            // Set CSS size so the canvas displays at integer scale
            this.canvas.style.width = cssW + 'px';
            this.canvas.style.height = cssH + 'px';

            // Internal buffer matches CSS pixels for crisp pixel-perfect rendering
            this.canvas.width = VIRTUAL_WIDTH * scale;
            this.canvas.height = VIRTUAL_HEIGHT * scale;

            // Map virtual coordinates to scaled pixels
            this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
            return;
        }

        // Default: fit mode
        this.applyFitMode(dpr);
    }

    applyFitMode(dpr) {
        // Keep internal drawing resolution fixed (virtual), but scale display via CSS
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        this.canvas.width = Math.floor(VIRTUAL_WIDTH * dpr);
        this.canvas.height = Math.floor(VIRTUAL_HEIGHT * dpr);

        // Use transform so drawing coordinates use virtual pixels
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    loadSettings() {
        try {
            const s = Storage.get('zamx_game_settings', null);
            if (s && s.scaleMode) return s;
        } catch (e) {
            // ignore
        }
        return { scaleMode: 'fit' };
    }

    saveSettings() {
        try {
            Storage.set('zamx_game_settings', this.settings);
        } catch (e) {
            // ignore
        }
    }

    toggleScaleMode() {
        this.settings = this.settings || { scaleMode: 'fit' };
        this.settings.scaleMode = (this.settings.scaleMode === 'pixel') ? 'fit' : 'pixel';
        this.saveSettings();
        // Recalculate canvas sizing immediately
        this.resizeCanvas();
        return this.settings.scaleMode;
    }

    getScaleMode() {
        return this.settings && this.settings.scaleMode ? this.settings.scaleMode : 'fit';
    }

    getAuthManager() {
        // Return global authManager if available
        return authManager || this.authManager;
    }

    start() {
        this.startLevel(0);
    }

    startLevel(levelIndex) {
        const level = this.levelManager.loadLevel(levelIndex);
        this.currentLevel = level;

        // Reset game state
        this.platforms = level.platforms;
        this.door = level.door;
        this.player.reset();
        this.player.controlsReversed = level.reverseControls;

        // Setup traps
        this.trapManager.traps = level.traps.map(trapConfig =>
            this.trapManager.createTrap(trapConfig.type, trapConfig)
        );

        // Reset timers
        this.levelStartTime = Date.now();
        this.gameStartTime = this.gameStartTime || Date.now();

        // Update UI
        this.uiManager.updateLevelDisplay();

        // Hide all screens to show the game canvas
        const screens = ['startScreen', 'levelSelectScreen', 'levelComplete', 'gameOver'];
        screens.forEach(screenId => {
            const el = document.getElementById(screenId);
            if (el) el.classList.add('hidden');
        });

        // Start game loop
        this.gameActive = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameActive) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        // Update game state
        this.update();

        // Draw everything
        this.draw();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Update player
        this.player.update();

        // Check collisions
        this.player.checkCollisions(this.platforms);
        this.trapManager.checkCollisions(this.player);
        this.trapManager.updateTraps();

        // Update particles
        this.particles = Utils.updateParticles(this.particles);

        // Check door collision
        if (Utils.collides(this.player, this.door)) {
            this.levelComplete();
        }

        // Check time limit
        if (this.currentLevel.timeLimit) {
            const elapsedTime = Math.floor((Date.now() - this.levelStartTime) / 1000);
            if (elapsedTime >= this.currentLevel.timeLimit) {
                this.player.die();
            }
        }

        // Update UI
        this.uiManager.updateTimer(Math.floor((Date.now() - this.levelStartTime) / 1000));
        this.uiManager.updateGameStats();
    }

    draw() {
        // Draw platforms
        this.ctx.fillStyle = '#2c3e50';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Draw traps
        this.trapManager.drawTraps(this.ctx);

        // Draw door
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.fillRect(this.door.x, this.door.y, this.door.width, this.door.height);
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(this.door.x + 5, this.door.y + 5, this.door.width - 10, this.door.height - 10);
        this.ctx.shadowBlur = 0;

        // Draw particles
        Utils.drawParticles(this.particles, this.ctx);

        // Draw player
        this.player.draw(this.ctx);
    }

    onPlayerDeath() {
        this.trapManager.reset();

        // Reset fake platforms
        const level = this.levelManager.getCurrentLevel();
        level.traps.forEach((trapConfig, index) => {
            if (trapConfig.type === 'fakePlatform') {
                this.trapManager.traps[index].active = true;
            }
        });
    }

    levelComplete() {
        this.gameActive = false;

        const levelTime = Math.floor((Date.now() - this.levelStartTime) / 1000);
        const levelDeaths = this.player.deaths;
        const perfectCompletion = levelDeaths === 0;

        // Play completion sound
        this.audioManager.play('complete');

        // Create celebration particles
        this.particles.push(...Utils.createParticle(
            this.door.x + this.door.width / 2,
            this.door.y + this.door.height / 2,
            '#2ecc71',
            40
        ));

        // Save progress if logged in
        const authMgr = this.getAuthManager();
        if (authMgr && authMgr.isLoggedIn()) {
            authMgr.saveProgress(
                this.levelManager.currentLevelIndex + 1,
                levelDeaths,
                levelTime,
                perfectCompletion
            );
        }

        // Show completion screen
        this.uiManager.showLevelComplete(levelTime, levelDeaths);
    }

    nextLevel() {
        const nextLevelIndex = this.levelManager.currentLevelIndex + 1;

        if (nextLevelIndex >= this.levelManager.getLevelCount()) {
            this.gameComplete();
        } else {
            this.startLevel(nextLevelIndex);
        }
    }

    gameComplete() {
        const totalTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const totalDeaths = this.player.deaths;

        this.uiManager.showGameOver(totalTime, totalDeaths);
    }

    restart() {
        this.gameStartTime = 0;
        this.startLevel(0);
    }

    restartLevel() {
        this.startLevel(this.levelManager.currentLevelIndex);
    }

    pause() {
        this.gameActive = false;
    }

    resume() {
        if (this.currentLevel) {
            this.gameActive = true;
            this.gameLoop();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.zamxGame = new Game();
});

// Handle window focus/blur for pause/resume
window.addEventListener('blur', () => {
    if (window.zamxGame) {
        window.zamxGame.pause();
    }
});

window.addEventListener('focus', () => {
    if (window.zamxGame) {
        window.zamxGame.resume();
    }
});