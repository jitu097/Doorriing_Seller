/**
 * Utility to play a notification sound when a new order arrives.
 * Uses a lightweight, professional sound from a reliable CDN.
 */
class SoundEffects {
    constructor() {
        this.newOrderSound = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized || typeof window === 'undefined') return;
        
        // Use a clean, professional notification sound
        // source: standard notification "ping"
        this.newOrderSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        this.newOrderSound.volume = 0.5;
        this.initialized = true;
    }

    playNewOrder() {
        try {
            if (!this.initialized) this.init();
            if (this.newOrderSound) {
                this.newOrderSound.currentTime = 0;
                this.newOrderSound.play().catch(err => {
                    // Browser might block auto-play if no user interaction yet
                    console.log('Audio playback blocked or failed', err);
                });
            }
        } catch (error) {
            console.error('Sound playback error', error);
        }
    }
}

export const soundEffects = new SoundEffects();
export default soundEffects;
