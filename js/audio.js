class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.audioContextReady = false;
        this.init();
        this.setupAudioResume();
    }

    setupAudioResume() {
        
        const resumeAudio = () => {
            if (!this.audioContextReady) {
                Howler.ctx.resume().then(() => {
                    this.audioContextReady = true;
                    console.log('Audio context resumed');
                });
            }
        };

        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
    }

    init() {
       
        this.sounds = {
            jump: new Howl({ src: ['assets/audio/jump.wav'], volume: 0.3 }),
            death: new Howl({ src: ['assets/audio/death.wav'], volume: 0.4 }),
            complete: new Howl({ src: ['assets/audio/complete.wav'], volume: 0.5 }),
            trap: new Howl({ src: ['assets/audio/trap.wav'], volume: 0.3 }),
            uiClick: new Howl({ src: ['assets/audio/ui-click.wav'], volume: 0.2 })
        };

     
        this.music = new Howl({
            src: ['assets/audio/bg-music.mp3'],
            volume: 0.1,
            loop: true
        });
    }

    play(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            this.sounds[soundName].play();
        }
    }

    playMusic() {
        if (this.musicEnabled && this.music) {
            this.music.play();
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.stop();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    setSoundVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume(volume);
        });
    }

    setMusicVolume(volume) {
        if (this.music) {
            this.music.volume(volume);
        }
    }
}

var audioManager = null;
(function () {
    try {
        const desc = Object.getOwnPropertyDescriptor(window, 'audioManager');
        if (!desc) {
            Object.defineProperty(window, 'audioManager', {
                get() { return audioManager; },
                set(v) { audioManager = v; },
                configurable: true
            });
        } else if (desc.get || desc.set) {
         
            try { audioManager = window.audioManager; } catch (e) { /* ignore */ }
        } else {
          
            try { audioManager = window.audioManager; } catch (e) { /* ignore */ }
        }
    } catch (e) {
        
        try { audioManager = window.audioManager; } catch (e2) { /* ignore */ }
    }
})();