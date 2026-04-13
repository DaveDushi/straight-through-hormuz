import { CONFIG } from '../config.js';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        this.voiceGain = null;
        this.voiceBuffers = {};
        this.currentVoiceSource = null;
        this.voiceLoaded = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3;
            this.voiceGain = this.ctx.createGain();
            this.voiceGain.connect(this.masterGain);
            this.voiceGain.gain.value = CONFIG.VOICE_VOLUME;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }

    async preloadVoice() {
        if (!this.initialized) return;
        const files = CONFIG.RADIO_MESSAGES.map(m => m.voice).filter(Boolean);
        const results = await Promise.allSettled(
            files.map(f => this._loadClip(f))
        );
        const loaded = results.filter(r => r.status === 'fulfilled' && r.value).length;
        this.voiceLoaded = loaded > 0;
    }

    async _loadClip(filename) {
        if (this.voiceBuffers[filename]) return this.voiceBuffers[filename];
        const res = await fetch('/' + filename);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const decoded = await this.ctx.decodeAudioData(buf);
        this.voiceBuffers[filename] = decoded;
        return decoded;
    }

    playVoice(filename) {
        if (!this.initialized || !filename) return 0;
        const buffer = this.voiceBuffers[filename];
        if (!buffer) return 0;
        this.stopVoice();
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain);
        source.start();
        this.currentVoiceSource = source;
        source.onended = () => {
            if (this.currentVoiceSource === source) this.currentVoiceSource = null;
        };
        return buffer.duration;
    }

    stopVoice() {
        if (this.currentVoiceSource) {
            try { this.currentVoiceSource.stop(); } catch (e) {}
            this.currentVoiceSource = null;
        }
    }

    playSFX(type) {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        switch (type) {
            case 'explosion':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.4);
                break;

            case 'pickup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.15);
                break;

            case 'damage':
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.25);
                break;

            case 'horn':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
                osc.start();
                osc.stop(this.ctx.currentTime + 1.0);
                break;

            case 'radio':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, this.ctx.currentTime);
                osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.1);
                break;

            case 'ceasefire':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.8);
                break;

            case 'laser':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
                break;

            case 'scrape':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
                break;

            case 'boost':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.35);
                break;
        }
    }

    playEngine() {}

    stopEngine() {}

    setVolume(v) {
        if (this.masterGain) this.masterGain.gain.value = v;
    }
}
