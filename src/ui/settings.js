import { AudioManager } from '../audio/audio-manager.js';

export class SettingsScreen {
    constructor(settings, audio, onClose) {
        this.el = document.getElementById('settings-screen');
        this.settings = settings;
        this._audio = audio;
        this._onClose = onClose;

        this._soundOn = document.getElementById('opt-sound-on');
        this._soundOff = document.getElementById('opt-sound-off');
        this._powerupCenter = document.getElementById('opt-powerup-center');
        this._powerupLeft = document.getElementById('opt-powerup-left');
        this._powerupRight = document.getElementById('opt-powerup-right');
        this._boostLeft = document.getElementById('opt-boost-left');
        this._boostBoth = document.getElementById('opt-boost-both');
        this._boostRight = document.getElementById('opt-boost-right');

        this._soundOn.addEventListener('click', () => {
            this.settings.sound = true;
            AudioManager.setMuted(false);
            this._audio.applyMuteState();
            this._syncUI();
        });
        this._soundOff.addEventListener('click', () => {
            this.settings.sound = false;
            AudioManager.setMuted(true);
            this._audio.applyMuteState();
            this._syncUI();
        });

        this._powerupCenter.addEventListener('click', () => {
            this.settings.powerupPosition = 'center';
            this._syncUI();
        });
        this._powerupLeft.addEventListener('click', () => {
            this.settings.powerupPosition = 'left';
            this._syncUI();
        });
        this._powerupRight.addEventListener('click', () => {
            this.settings.powerupPosition = 'right';
            this._syncUI();
        });

        this._boostLeft.addEventListener('click', () => {
            this.settings.boostButtons = 'left';
            this._syncUI();
        });
        this._boostBoth.addEventListener('click', () => {
            this.settings.boostButtons = 'both';
            this._syncUI();
        });
        this._boostRight.addEventListener('click', () => {
            this.settings.boostButtons = 'right';
            this._syncUI();
        });

        document.getElementById('btn-settings-close').addEventListener('click', () => this._onClose());
    }

    _syncUI() {
        this._setActive(this._soundOn, this.settings.sound);
        this._setActive(this._soundOff, !this.settings.sound);

        this._setActive(this._powerupCenter, this.settings.powerupPosition === 'center');
        this._setActive(this._powerupLeft, this.settings.powerupPosition === 'left');
        this._setActive(this._powerupRight, this.settings.powerupPosition === 'right');

        this._setActive(this._boostLeft, this.settings.boostButtons === 'left');
        this._setActive(this._boostBoth, this.settings.boostButtons === 'both');
        this._setActive(this._boostRight, this.settings.boostButtons === 'right');
    }

    _setActive(el, active) {
        el.classList.toggle('active', active);
    }

    show() {
        this._syncUI();
        this.el.classList.add('visible');
    }

    hide() {
        this.el.classList.remove('visible');
    }
}
