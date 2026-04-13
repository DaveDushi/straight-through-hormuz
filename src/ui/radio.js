import { CONFIG } from '../config.js';

export class RadioUI {
    constructor() {
        this.el = document.getElementById('radio-bar');
        this.textEl = document.getElementById('radio-text');
        this.speakerEl = document.getElementById('radio-speaker');
        this.timer = 0;
        this.lastMessageIndex = -1;
        this.queue = [];
        this.voiceDelayTimer = 0;
        this.pendingVoice = null;
        this.pendingAudio = null;
    }

    update(delta, distance, audio) {
        if (this.voiceDelayTimer > 0) {
            this.voiceDelayTimer -= delta;
            if (this.voiceDelayTimer <= 0) {
                const duration = this.pendingAudio.playVoice(this.pendingVoice);
                if (duration > 0) {
                    const needed = duration + 0.5;
                    if (needed > this.timer) this.timer = needed;
                }
                this.pendingVoice = null;
                this.pendingAudio = null;
            }
        }

        if (this.timer > 0) {
            this.timer -= delta;
            if (this.timer <= 0) {
                this.el.style.display = 'none';
                this.el.className = 'radio-bar';
            }
        }

        for (let i = 0; i < CONFIG.RADIO_MESSAGES.length; i++) {
            if (i > this.lastMessageIndex && distance >= CONFIG.RADIO_MESSAGES[i].distance) {
                this.showMessage(CONFIG.RADIO_MESSAGES[i], audio);
                this.lastMessageIndex = i;
                break;
            }
        }
    }

    showMessage(msg, audio) {
        const speaker = msg.speaker.toLowerCase();
        this.speakerEl.textContent = msg.speaker;
        this.textEl.textContent = msg.text;
        this.el.style.display = 'flex';
        this.timer = 4;

        this.speakerEl.className = 'radio-speaker speaker-' + speaker;
        this.el.className = 'speaker-' + speaker + '-active';
        this.el.id = 'radio-bar';

        if (audio) audio.playSFX('radio');

        if (msg.voice && audio && audio.voiceLoaded) {
            this.pendingVoice = msg.voice;
            this.pendingAudio = audio;
            this.voiceDelayTimer = CONFIG.VOICE_RADIO_DELAY;
        } else {
            this.pendingVoice = null;
            this.pendingAudio = null;
        }
    }

    showCustom(speaker, text, audio) {
        this.showMessage({ speaker, text }, audio);
    }

    reset() {
        this.lastMessageIndex = -1;
        this.timer = 0;
        this.voiceDelayTimer = 0;
        this.pendingVoice = null;
        this.pendingAudio = null;
        this.el.style.display = 'none';
        this.el.className = '';
        this.el.id = 'radio-bar';
    }
}
