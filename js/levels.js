// Level management system
class LevelManager {
    constructor() {
        this.levels = this.generateLevels();
        this.currentLevelIndex = 0;
    }

    generateLevels() {
        const levels = [];

        // Tutorial Levels (1-10)
        for (let i = 1; i <= 10; i++) {
            levels.push(this.generateTutorialLevel(i));
        }

        // Intermediate Levels (11-50)
        for (let i = 11; i <= 50; i++) {
            levels.push(this.generateIntermediateLevel(i));
        }

        // Advanced Levels (51-150)
        for (let i = 51; i <= 150; i++) {
            levels.push(this.generateAdvancedLevel(i));
        }

        // Expert Levels (151-200+)
        for (let i = 151; i <= 200; i++) {
            levels.push(this.generateExpertLevel(i));
        }

        return levels;
    }

    generateTutorialLevel(levelNum) {
        const baseY = 500;
        const platforms = [
            { x: 0, y: baseY, width: 900, height: 50 }
        ];

        // Add progressive (but varied) difficulty
        if (levelNum >= 2) {
            platforms.push({ x: 150 + Math.floor(Utils.random(0, 60)), y: 380 + Math.floor(Utils.random(-20, 20)), width: 100 + Math.floor(Utils.random(-20, 40)), height: 20 });
        }
        if (levelNum >= 3) {
            platforms.push({ x: 350 + Math.floor(Utils.random(0, 140)), y: 300 + Math.floor(Utils.random(-30, 30)), width: 90 + Math.floor(Utils.random(0, 40)), height: 20 });
        }
        if (levelNum >= 4) {
            platforms.push({ x: 600 + Math.floor(Utils.random(-50, 50)), y: 380 + Math.floor(Utils.random(-10, 40)), width: 90 + Math.floor(Utils.random(0, 30)), height: 20 });
        }

        const traps = [];
        if (levelNum >= 5) {
            traps.push({ type: 'spike', x: 380 + Math.floor(Utils.random(-50, 50)), y: baseY - 20, width: 20, height: 20 });
        }
        if (levelNum >= 7) {
            traps.push({ type: 'fakePlatform', x: 250 + Math.floor(Utils.random(0, 120)), y: 380 + Math.floor(Utils.random(-30, 30)), width: 90, height: 20 });
        }
        if (levelNum >= 9) {
            traps.push({ type: 'collapsingPlatform', x: 520 + Math.floor(Utils.random(-80, 80)), y: 300 + Math.floor(Utils.random(-20, 40)), width: 100, height: 20 });
        }

        return {
            id: levelNum,
            name: `Tutorial ${levelNum}`,
            type: CONSTANTS.LEVEL_TYPES.TUTORIAL,
            platforms: platforms,
            traps: traps,
            door: { x: 780 + Math.floor(Utils.random(-100, 40)), y: 360 + Math.floor(Utils.random(-20, 20)), width: 40, height: 40 },
            reverseControls: false,
            timeLimit: 120 // 2 minutes
        };
    }

    generateIntermediateLevel(levelNum) {
        const baseY = 500;
        const platforms = [
            { x: 0, y: baseY, width: 900, height: 50 }
        ];

        // More complex platform layouts with random offsets for variety
        const platformCount = 4 + Math.floor((levelNum - 11) / 10);
        for (let i = 0; i < platformCount; i++) {
            platforms.push({
                x: Math.floor(Utils.random(60, 800)),
                y: Math.floor(Utils.random(300, 440)),
                width: 60 + Math.floor(Utils.random(20, 140 - (levelNum % 4) * 10)),
                height: 20
            });
        }

        const traps = [];
        // Spikes
        const spikeCount = 2 + Math.floor((levelNum - 11) / 15);
        for (let i = 0; i < spikeCount; i++) {
            traps.push({
                type: 'spike',
                x: Math.floor(Utils.random(120, 820)),
                y: baseY - 20,
                width: 20,
                height: 20
            });
        }

        // Fake platforms
        if (levelNum >= 15) {
            traps.push({
                type: 'fakePlatform',
                x: Math.floor(Utils.random(200, 700)),
                y: Math.floor(Utils.random(320, 380)),
                width: 80 + Math.floor(Utils.random(0, 60)),
                height: 20
            });
        }

        // Collapsing platforms
        if (levelNum >= 20) {
            traps.push({
                type: 'collapsingPlatform',
                x: Math.floor(Utils.random(300, 700)),
                y: Math.floor(Utils.random(260, 340)),
                width: 80 + Math.floor(Utils.random(0, 60)),
                height: 20
            });
        }

        // Moving platforms
        if (levelNum >= 30) {
            traps.push({
                type: 'movingPlatform',
                x: Math.floor(Utils.random(200, 600)),
                y: Math.floor(Utils.random(220, 320)),
                width: 80 + Math.floor(Utils.random(0, 80)),
                height: 20,
                startX: Math.floor(Utils.random(100, 300)),
                endX: Math.floor(Utils.random(500, 800)),
                speed: 2 + (levelNum % 3)
            });
        }

        return {
            id: levelNum,
            name: `Challenge ${levelNum}`,
            type: CONSTANTS.LEVEL_TYPES.INTERMEDIATE,
            platforms: platforms,
            traps: traps,
            door: { x: 800, y: 370, width: 40, height: 40 },
            reverseControls: levelNum >= 40,
            timeLimit: 90 + Math.floor((levelNum - 11) / 5) * 10
        };
    }

    generateAdvancedLevel(levelNum) {
        const baseY = 500;
        const platforms = [
            { x: 0, y: baseY, width: 900, height: 50 }
        ];

        // Complex platform patterns
        const pattern = levelNum % 4;
        switch (pattern) {
            case 0: // Spiral
                for (let i = 0; i < 8; i++) {
                    platforms.push({
                        x: 100 + Math.cos(i * 0.8) * 300,
                        y: 400 - Math.sin(i * 0.8) * 150,
                        width: 60,
                        height: 20
                    });
                }
                break;
            case 1: // Zigzag
                for (let i = 0; i < 10; i++) {
                    platforms.push({
                        x: 100 + i * 80,
                        y: 400 - (i % 2) * 100,
                        width: 70,
                        height: 20
                    });
                }
                break;
            case 2: // Islands
                for (let i = 0; i < 6; i++) {
                    platforms.push({
                        x: 150 + (i % 3) * 250,
                        y: 450 - Math.floor(i / 3) * 150,
                        width: 80,
                        height: 20
                    });
                }
                break;
            case 3: // Stairs
                for (let i = 0; i < 7; i++) {
                    platforms.push({
                        x: 100 + i * 110,
                        y: 450 - i * 40,
                        width: 90,
                        height: 20
                    });
                }
                break;
        }

        const traps = [];
        // Multiple trap types
        const trapTypes = ['spike', 'fakePlatform', 'collapsingPlatform', 'movingPlatform'];
        const trapCount = 4 + Math.floor((levelNum - 51) / 20);

        for (let i = 0; i < trapCount; i++) {
            const trapType = trapTypes[i % trapTypes.length];
            const config = {
                x: 200 + (i * 150) % 700,
                y: 450 - (i * 30) % 200,
                width: 80 + (levelNum % 4) * 10,
                height: 20
            };

            if (trapType === 'movingPlatform') {
                config.startX = config.x - 100;
                config.endX = config.x + 100;
                config.speed = 2 + (levelNum % 4);
            }

            traps.push({ type: trapType, ...config });
        }

        // Invisible walls
        if (levelNum >= 70) {
            traps.push({
                type: 'invisibleWall',
                x: 600,
                y: 300,
                width: 20,
                height: 200
            });
        }

        // Reverse controls areas
        if (levelNum >= 80) {
            traps.push({
                type: 'reverseControls',
                x: 400,
                y: 200,
                width: 200,
                height: 100
            });
        }

        return {
            id: levelNum,
            name: `Advanced ${levelNum}`,
            type: CONSTANTS.LEVEL_TYPES.ADVANCED,
            platforms: platforms,
            traps: traps,
            door: { x: 800, y: 370, width: 40, height: 40 },
            reverseControls: levelNum >= 90,
            timeLimit: 75 + Math.floor((levelNum - 51) / 10) * 5
        };
    }

    generateExpertLevel(levelNum) {
        const baseY = 500;
        const platforms = [
            { x: 0, y: baseY, width: 900, height: 50 }
        ];

        // Expert-level platform layouts
        const expertPattern = levelNum % 6;
        switch (expertPattern) {
            case 0: // Maze-like
                for (let i = 0; i < 12; i++) {
                    platforms.push({
                        x: 50 + (i % 4) * 220,
                        y: 450 - Math.floor(i / 4) * 80,
                        width: 60,
                        height: 20
                    });
                }
                break;
            case 1: // Floating islands
                for (let i = 0; i < 15; i++) {
                    platforms.push({
                        x: 50 + Math.random() * 800,
                        y: 200 + Math.random() * 250,
                        width: 40 + Math.random() * 40,
                        height: 15
                    });
                }
                break;
            case 2: // Narrow path
                for (let i = 0; i < 20; i++) {
                    platforms.push({
                        x: 50 + i * 40,
                        y: 450 - (i % 3) * 50,
                        width: 35,
                        height: 15
                    });
                }
                break;
            case 3: // Vertical challenge
                for (let i = 0; i < 10; i++) {
                    platforms.push({
                        x: 100 + (i % 3) * 300,
                        y: 450 - i * 60,
                        width: 80,
                        height: 15
                    });
                }
                break;
            case 4: // Moving only
                // All platforms are moving in this pattern
                break;
            case 5: // Minimalist
                platforms.push(
                    { x: 100, y: 450, width: 50, height: 20 },
                    { x: 200, y: 400, width: 40, height: 20 },
                    { x: 300, y: 350, width: 40, height: 20 },
                    { x: 400, y: 300, width: 40, height: 20 }
                );
                break;
        }

        const traps = [];
        // High density traps
        const trapDensity = 8 + Math.floor((levelNum - 151) / 10);
        const expertTrapTypes = ['spike', 'fakePlatform', 'collapsingPlatform', 'movingPlatform', 'invisibleWall', 'reverseControls'];

        for (let i = 0; i < trapDensity; i++) {
            const trapType = expertTrapTypes[Math.floor(Math.random() * expertTrapTypes.length)];
            const config = {
                x: 100 + (i * 80) % 700,
                y: 300 + (i * 50) % 150,
                width: 60 + (levelNum % 5) * 10,
                height: 20
            };

            if (trapType === 'movingPlatform') {
                config.startX = config.x - 150;
                config.endX = config.x + 150;
                config.speed = 3 + (levelNum % 4);
            } else if (trapType === 'reverseControls') {
                config.width = 150;
                config.height = 80;
            }

            traps.push({ type: trapType, ...config });
        }

        // Multiple reverse control zones in expert levels
        if (levelNum >= 170) {
            for (let i = 0; i < 2; i++) {
                traps.push({
                    type: 'reverseControls',
                    x: 200 + i * 300,
                    y: 250,
                    width: 100,
                    height: 100
                });
            }
        }

        return {
            id: levelNum,
            name: `Expert ${levelNum}`,
            type: CONSTANTS.LEVEL_TYPES.EXPERT,
            platforms: platforms,
            traps: traps,
            door: {
                x: levelNum % 2 === 0 ? 800 : 50,
                y: levelNum % 3 === 0 ? 370 : 200,
                width: 40,
                height: 40
            },
            reverseControls: levelNum >= 160,
            timeLimit: 60 + Math.floor((levelNum - 151) / 5) * 3
        };
    }

    getCurrentLevel() {
        return this.levels[this.currentLevelIndex];
    }

    loadLevel(levelIndex) {
        this.currentLevelIndex = Utils.clamp(levelIndex, 0, this.levels.length - 1);
        return this.getCurrentLevel();
    }

    getLevelCount() {
        return this.levels.length;
    }

    getLevelsByType(type) {
        return this.levels.filter(level => level.type === type);
    }

    isLevelUnlocked(levelIndex, userProgress) {
        if (levelIndex === 0) return true;
        if (!userProgress) return false;
        return levelIndex <= userProgress.currentLevel;
    }

    getLevelProgress(levelIndex, userProgress) {
        if (!userProgress) return 'locked';
        if (userProgress.completedLevels.includes(levelIndex + 1)) return 'completed';
        if (this.isLevelUnlocked(levelIndex, userProgress)) return 'available';
        return 'locked';
    }
}