import { CONFIG } from '../config.js';

export class RadioUI {
    constructor() {
        this.el = document.getElementById('radio-bar');
        this.textEl = document.getElementById('radio-text');
        this.speakerEl = document.getElementById('radio-speaker');
        this.timer = 0;
        this.lastMessageIndex = -1;
        this.queue = [];
    }

    update(delta, distance, audio) {
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

        // Set speaker-specific left border accent
        this.el.className = 'speaker-' + speaker + '-active';
        this.el.id = 'radio-bar';

        if (audio) audio.playSFX('radio');
    }

    showCustom(speaker, text, audio) {
        this.showMessage({ speaker, text }, audio);
    }

    reset() {
        this.lastMessageIndex = -1;
        this.timer = 0;
        this.el.style.display = 'none';
        this.el.className = '';
        this.el.id = 'radio-bar';
    }
}
