class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = this.loadUserData();
        this.storageAvailable = this.checkStorageAvailable();
        this.init();
    }

    checkStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not available, using in-memory storage');
            return false;
        }
    }

    loadUserData() {
        try {
            const defaultData = {
                users: {},
                gameSettings: {
                    soundEnabled: true,
                    musicEnabled: true,
                    controls: "keyboard",
                    difficulty: "normal"
                },
                leaderboards: {
                    levelCompletions: {},
                    fastestTimes: {},
                    lowestDeaths: {}
                }
            };
            const storedData = Storage.get('zamx_user_data', defaultData);
            return storedData;
        } catch (error) {
            console.error('Error loading user data:', error);
            return defaultData;
        }
    }

    saveUserData() {
        try {
            if (this.storageAvailable) {
                Storage.set('zamx_user_data', this.userData);
            }
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    init() {
        const loggedInUser = Storage.get('zamx_current_user');
        if (loggedInUser && this.userData.users[loggedInUser]) {
            this.currentUser = loggedInUser;
            this.updateUI();
        }

        this.loadGameSettings();
    }

    register(username, password) {
        if (this.userData.users[username]) {
            return { success: false, message: 'Username already exists' };
        }

        if (username.length < 3) {
            return { success: false, message: 'Username must be at least 3 characters' };
        }

        if (password.length < 4) {
            return { success: false, message: 'Password must be at least 4 characters' };
        }

        this.userData.users[username] = {
            password: this.hashPassword(password),
            progress: {
                currentLevel: 1,
                completedLevels: [],
                levelStats: {}, 
                stats: {
                    totalDeaths: 0,
                    totalTime: 0,
                    levelsCompleted: 0,
                    perfectCompletions: 0, 
                    fastestCompletion: null
                },
                achievements: [],
                playHistory: []
            },
            profile: {
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                totalPlayTime: 0,
                favoriteLevel: null
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                controls: "keyboard",
                particleEffects: true
            }
        };

        if (this.saveUserData()) {
            return { success: true, message: 'Registration successful' };
        } else {
            return { success: false, message: 'Failed to save user data' };
        }
    }

    login(username, password) {
        const user = this.userData.users[username];
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Invalid password' };
        }

        this.currentUser = username;
        user.profile.lastLogin = new Date().toISOString();

        if (this.storageAvailable) {
            Storage.set('zamx_current_user', username);
        }
        this.saveUserData();
        this.updateUI();

        // Load user settings
        this.loadUserSettings();

        return { success: true, message: 'Login successful' };
    }

    logout() {
        if (this.currentUser) {
            // Save play time before logout
            this.updatePlayTime();
        }

        this.currentUser = null;
        if (this.storageAvailable) {
            Storage.remove('zamx_current_user');
        }
        this.updateUI();

        // Reset to default settings
        this.loadGameSettings();
    }

    hashPassword(password) {
        // Simple hash for demo purposes - in production use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    saveProgress(levelId, deaths, time, perfect = false) {
        if (!this.currentUser) return false;

        const user = this.userData.users[this.currentUser];
        if (!user) return false;

        const levelKey = `level_${levelId}`;
        const now = new Date().toISOString();

        // Update level stats
        if (!user.progress.levelStats[levelKey]) {
            user.progress.levelStats[levelKey] = {
                bestTime: time,
                lowestDeaths: deaths,
                completions: 0,
                totalDeaths: 0,
                totalTime: 0,
                firstCompletion: now,
                lastCompletion: now
            };
        }

        const levelStat = user.progress.levelStats[levelKey];
        levelStat.completions++;
        levelStat.totalDeaths += deaths;
        levelStat.totalTime += time;
        levelStat.lastCompletion = now;

        // Update best records
        if (time < levelStat.bestTime) {
            levelStat.bestTime = time;
        }
        if (deaths < levelStat.lowestDeaths) {
            levelStat.lowestDeaths = deaths;
        }

        // Update global progress
        if (!user.progress.completedLevels.includes(levelId)) {
            user.progress.completedLevels.push(levelId);
            user.progress.stats.levelsCompleted++;
        }

        // Update global stats
        user.progress.stats.totalDeaths += deaths;
        user.progress.stats.totalTime += time;

        if (perfect) {
            user.progress.stats.perfectCompletions++;
        }

        // Update current level
        if (levelId >= user.progress.currentLevel) {
            user.progress.currentLevel = levelId + 1;
        }

        // Add to play history
        user.progress.playHistory.unshift({
            level: levelId,
            deaths: deaths,
            time: time,
            perfect: perfect,
            timestamp: now
        });

        // Keep only last 50 plays in history
        if (user.progress.playHistory.length > 50) {
            user.progress.playHistory = user.progress.playHistory.slice(0, 50);
        }

        // Check achievements
        this.checkAchievements(user);

        // Update leaderboards
        this.updateLeaderboards(levelId, this.currentUser, time, deaths);

        return this.saveUserData();
    }

    checkAchievements(user) {
        const stats = user.progress.stats;
        const achievements = [];
        const newAchievements = [];

        // Level-based achievements
        if (stats.levelsCompleted >= 10 && !user.progress.achievements.includes('novice')) {
            achievements.push('novice');
            newAchievements.push('Novice Player - Complete 10 levels');
        }
        if (stats.levelsCompleted >= 50 && !user.progress.achievements.includes('veteran')) {
            achievements.push('veteran');
            newAchievements.push('Veteran Player - Complete 50 levels');
        }
        if (stats.levelsCompleted >= 100 && !user.progress.achievements.includes('expert')) {
            achievements.push('expert');
            newAchievements.push('Expert Player - Complete 100 levels');
        }
        if (stats.levelsCompleted >= 200 && !user.progress.achievements.includes('master')) {
            achievements.push('master');
            newAchievements.push('Master Player - Complete all 200 levels');
        }

        // Death-based achievements
        if (stats.totalDeaths >= 100 && !user.progress.achievements.includes('persistent')) {
            achievements.push('persistent');
            newAchievements.push('Persistent - Die 100 times');
        }
        if (stats.totalDeaths >= 500 && !user.progress.achievements.includes('determined')) {
            achievements.push('determined');
            newAchievements.push('Determined - Die 500 times');
        }

        // Skill-based achievements
        if (stats.perfectCompletions >= 10 && !user.progress.achievements.includes('perfectionist')) {
            achievements.push('perfectionist');
            newAchievements.push('Perfectionist - Complete 10 levels without dying');
        }

        // Add new achievements
        user.progress.achievements = [...new Set([...user.progress.achievements, ...achievements])];

        // Show achievement notifications
        if (newAchievements.length > 0) {
            this.showAchievementNotification(newAchievements);
        }
    }

    showAchievementNotification(achievements) {
        achievements.forEach(achievement => {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-icon">🏆</div>
                <div class="achievement-text">
                    <strong>Achievement Unlocked!</strong><br>
                    ${achievement}
                </div>
            `;

            document.body.appendChild(notification);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        });
    }

    updatePlayTime() {
        if (!this.currentUser) return;

        const user = this.userData.users[this.currentUser];
        if (user && window.zamxGame) {
            const sessionTime = Math.floor((Date.now() - window.zamxGame.gameStartTime) / 1000);
            user.profile.totalPlayTime += sessionTime;
            this.saveUserData();
        }
    }

    getUserStats() {
        if (!this.currentUser) return null;
        return this.userData.users[this.currentUser].progress.stats;
    }

    getLevelStats(levelId) {
        if (!this.currentUser) return null;
        const levelKey = `level_${levelId}`;
        return this.userData.users[this.currentUser].progress.levelStats[levelKey];
    }

    getLeaderboard(levelId = null) {
        if (levelId) {
            const levelKey = `level_${levelId}`;
            return {
                fastest: this.userData.leaderboards.fastestTimes[levelKey],
                lowestDeaths: this.userData.leaderboards.lowestDeaths[levelKey],
                completions: this.userData.leaderboards.levelCompletions[levelKey]
            };
        } else {
            return this.userData.leaderboards;
        }
    }

    updateUserSettings(settings) {
        if (!this.currentUser) return false;

        const user = this.userData.users[this.currentUser];
        user.settings = { ...user.settings, ...settings };

        // Apply settings immediately
        this.applyUserSettings(user.settings);

        return this.saveUserData();
    }

    loadUserSettings() {
        if (!this.currentUser) {
            this.loadGameSettings();
            return;
        }

        const user = this.userData.users[this.currentUser];
        this.applyUserSettings(user.settings);
    }

    applyUserSettings(settings) {
        if (window.audioManager) {
            if (settings.soundEnabled !== undefined) {
                window.audioManager.soundEnabled = settings.soundEnabled;
            }
            if (settings.musicEnabled !== undefined) {
                window.audioManager.musicEnabled = settings.musicEnabled;
                if (settings.musicEnabled) {
                    window.audioManager.playMusic();
                } else {
                    window.audioManager.stopMusic();
                }
            }
        }
    }

    loadGameSettings() {
        const settings = this.userData.gameSettings;
        this.applyUserSettings(settings);
    }

    updateGameSettings(settings) {
        this.userData.gameSettings = { ...this.userData.gameSettings, ...settings };
        this.applyUserSettings(settings);
        return this.saveUserData();
    }

    updateLeaderboards(levelId, username, time, deaths) {
        const levelKey = `level_${levelId}`;

        // Fastest time leaderboard
        if (!this.userData.leaderboards.fastestTimes[levelKey] ||
            time < this.userData.leaderboards.fastestTimes[levelKey].time) {
            this.userData.leaderboards.fastestTimes[levelKey] = {
                username: username,
                time: time,
                timestamp: new Date().toISOString()
            };
        }

        // Lowest deaths leaderboard
        if (!this.userData.leaderboards.lowestDeaths[levelKey] ||
            deaths < this.userData.leaderboards.lowestDeaths[levelKey].deaths) {
            this.userData.leaderboards.lowestDeaths[levelKey] = {
                username: username,
                deaths: deaths,
                timestamp: new Date().toISOString()
            };
        }

        // Level completions count
        if (!this.userData.leaderboards.levelCompletions[levelKey]) {
            this.userData.leaderboards.levelCompletions[levelKey] = {};
        }
        this.userData.leaderboards.levelCompletions[levelKey][username] =
            (this.userData.leaderboards.levelCompletions[levelKey][username] || 0) + 1;
    }

    getProgress() {
        return this.currentUser ? this.userData.users[this.currentUser].progress : null;
    }

    updateUI() {
        const authBtn = document.getElementById('authBtn');
        const userInfo = document.getElementById('userInfo');
        const userDisplayName = document.getElementById('userDisplayName');

        if (this.currentUser) {
            if (authBtn) authBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userDisplayName) userDisplayName.textContent = this.currentUser;
        } else {
            if (authBtn) authBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Admin methods for debugging
    exportUserData() {
        return JSON.stringify(this.userData, null, 2);
    }

    importUserData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.userData = importedData;
            this.saveUserData();
            return true;
        } catch (error) {
            console.error('Error importing user data:', error);
            return false;
        }
    }
}

// Global auth instance - will be initialized after DOM loads
let authManager = null;

// Initialize authManager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!authManager) {
        authManager = new AuthManager();
    }
});