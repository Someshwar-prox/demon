// UI management system
class UIManager {
    constructor(game) {
        this.game = game;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateLevelDisplay();
        // Ensure scale icon matches current setting
        this.updateScaleIcon();
    }

    setupEventListeners() {
        // Game control buttons
        const startBtn = document.getElementById('startBtn');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        const restartBtn = document.getElementById('restartBtn');
        const restartLevelBtn = document.getElementById('restartLevelBtn');

        if (startBtn) startBtn.addEventListener('click', () => this.game.start());
        if (nextLevelBtn) nextLevelBtn.addEventListener('click', () => this.game.nextLevel());
        if (restartBtn) restartBtn.addEventListener('click', () => this.game.restart());
        if (restartLevelBtn) restartLevelBtn.addEventListener('click', () => this.game.restartLevel());

        // Level selection
        const levelSelectBtn = document.getElementById('levelSelectBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        if (levelSelectBtn) levelSelectBtn.addEventListener('click', () => this.showLevelSelect());
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => this.showMainMenu());

        // Audio controls
        const soundToggle = document.getElementById('soundToggle');
        const musicToggle = document.getElementById('musicToggle');
        if (soundToggle) soundToggle.addEventListener('click', () => this.toggleSound());
        if (musicToggle) musicToggle.addEventListener('click', () => this.toggleMusic());
        // Scale mode toggle
        const scaleBtn = document.getElementById('scaleToggle');
        if (scaleBtn) {
            scaleBtn.addEventListener('click', () => {
                const newMode = this.game.toggleScaleMode();
                this.updateScaleIcon(newMode);
            });
        }

        // Auth controls
        const authBtn = document.getElementById('authBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (authBtn) authBtn.addEventListener('click', () => this.showAuthModal());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        if (loginBtn) loginBtn.addEventListener('click', (e) => this.handleAuth(e, 'login'));
        if (registerBtn) registerBtn.addEventListener('click', (e) => this.handleAuth(e, 'register'));

        // Trap info tooltips
        this.setupTrapTooltips();
    }

    setupTrapTooltips() {
        const trapItems = document.querySelectorAll('.trap-item');
        trapItems.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const trapType = item.dataset.trap;
                this.showTrapTooltip(e, trapType);
            });
            item.addEventListener('mouseleave', () => {
                this.hideTrapTooltip();
            });
        });
    }

    showTrapTooltip(event, trapType) {
        const tooltips = {
            spike: 'Instant death on contact',
            fake: 'Disappears when touched',
            collapse: 'Falls after standing on it',
            moving: 'Moves back and forth',
            invisible: 'Hidden walls that block movement'
        };

        // Create tooltip
        let tooltip = document.getElementById('trap-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'trap-tooltip';
            tooltip.className = 'trap-tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = tooltips[trapType] || 'Unknown trap';
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY + 10 + 'px';
        tooltip.style.display = 'block';
    }

    hideTrapTooltip() {
        const tooltip = document.getElementById('trap-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    updateLevelDisplay() {
        const idx = (typeof this.game.levelManager.currentLevelIndex === 'number') ? this.game.levelManager.currentLevelIndex : 0;
        document.getElementById('currentLevel').textContent = idx + 1;
        document.getElementById('totalLevels').textContent = this.game.levelManager.getLevelCount();
    }

    updateDeathCounter(deaths) {
        document.getElementById('deathCount').textContent = deaths;
    }

    updateTimer(time) {
        document.getElementById('timer').textContent = Utils.formatTime(time);
    }

    showScreen(screenName) {
        // Hide all screens
        const screens = ['startScreen', 'levelSelectScreen', 'levelComplete', 'gameOver'];
        screens.forEach(screen => {
            const el = document.getElementById(screen);
            if (el) el.classList.add('hidden');
        });

        // Show requested screen
        const target = document.getElementById(screenName);
        if (target) target.classList.remove('hidden');
    }

    showMainMenu() {
        this.showScreen('startScreen');
    }

    showLevelSelect() {
        this.showScreen('levelSelectScreen');
        this.populateLevelGrid();
    }

    populateLevelGrid() {
        const levelGrid = document.getElementById('levelGrid');
        levelGrid.innerHTML = '';

        // Wait for authManager if not ready
        const userProgress = authManager ? authManager.getProgress() : null;
        const totalLevels = this.game.levelManager.getLevelCount();

        for (let i = 0; i < totalLevels; i++) {
            const level = this.game.levelManager.levels[i];
            const progress = this.game.levelManager.getLevelProgress(i, userProgress);

            const levelBtn = document.createElement('button');
            levelBtn.className = `level-btn ${progress}`;
            levelBtn.textContent = i + 1;
            levelBtn.disabled = progress === 'locked';

            levelBtn.addEventListener('click', () => {
                if (progress !== 'locked') {
                    this.game.startLevel(i);
                }
            });

            // Add tooltip for level info
            levelBtn.title = `${level.name} (${level.type})`;

            levelGrid.appendChild(levelBtn);
        }
    }

    showLevelComplete(time, deaths) {
        document.getElementById('levelTime').textContent = Utils.formatTime(time);
        document.getElementById('levelDeaths').textContent = deaths;
        this.showScreen('levelComplete');
    }

    showGameOver(totalTime, totalDeaths) {
        document.getElementById('totalTime').textContent = Utils.formatTime(totalTime);
        document.getElementById('totalDeaths').textContent = totalDeaths;
        this.showScreen('gameOver');
    }

    toggleSound() {
        if (!audioManager) return;
        const enabled = audioManager.toggleSound();
        const icon = document.querySelector('#soundToggle i');
        if (icon) icon.className = enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }

    toggleMusic() {
        if (!audioManager) return;
        const enabled = audioManager.toggleMusic();
        const icon = document.querySelector('#musicToggle i');
        if (icon) icon.className = enabled ? 'fas fa-music' : 'fas fa-music-slash';
    }

    updateScaleIcon(mode) {
        const m = mode || (this.game && this.game.getScaleMode ? this.game.getScaleMode() : 'fit');
        const icon = document.getElementById('scaleIcon');
        if (!icon) return;
        // fit -> show expand; pixel -> show grid icon
        if (m === 'pixel') {
            icon.className = 'fas fa-th-large';
            document.getElementById('scaleToggle').title = 'Pixel-perfect (integer scale)';
        } else {
            icon.className = 'fas fa-expand';
            document.getElementById('scaleToggle').title = 'Fit to screen';
        }
    }

    showAuthModal() {
        const modal = new bootstrap.Modal(document.getElementById('authModal'));
        modal.show();
    }

    async handleAuth(event, type) {
        event.preventDefault();

        // Ensure authManager is initialized
        if (!authManager) {
            this.showMessage('Authentication system not ready. Please refresh the page.', 'error');
            return;
        }

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        let result;
        if (type === 'login') {
            result = authManager.login(username, password);
        } else {
            result = authManager.register(username, password);
        }

        if (result.success) {
            this.showMessage(result.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            document.getElementById('authForm').reset();


            // Refresh level grid if on level select
            if (document.getElementById('levelSelectScreen').classList.contains('hidden') === false) {
                this.populateLevelGrid();
            }
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    logout() {
        if (authManager) {
            authManager.logout();
            this.showMessage('Logged out successfully', 'success');
        }
    } showMessage(message, type) {
        // Remove existing messages
        const existingMsg = document.getElementById('ui-message');
        if (existingMsg) existingMsg.remove();

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.id = 'ui-message';
        messageEl.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
        messageEl.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    updateGameStats() {
        // Update any real-time game stats in the UI
        if (this.game.player) {
            this.updateDeathCounter(this.game.player.deaths);
        }
    }
}