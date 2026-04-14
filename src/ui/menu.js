import { AudioManager } from '../audio/audio-manager.js';
import { hasUpdate, applyUpdate } from './pwa.js';

export class MenuScreen {
  constructor(onPlay, onPort) {
    this.el = document.getElementById('menu-screen');
    this.playBtn = document.getElementById('btn-play');
    this.portBtn = document.getElementById('btn-port');
    this.soundBtn = document.getElementById('btn-sound-toggle');
    this.updateBanner = document.getElementById('update-banner');
    this.updateBtn = document.getElementById('btn-update');

    if (this.updateBtn) {
      this.updateBtn.addEventListener('click', () => applyUpdate());
    }

    const hints = document.querySelectorAll('#controls-hint .hint-line');
    if (hints.length && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      hints[0].textContent = 'Drag left / right to steer';
      hints[1].textContent = 'Tap BOOST for emergency boost';
      hints[2].textContent = 'Tap slots to use power-ups';
    }

    this.playBtn.addEventListener('click', () => onPlay());
    if (this.portBtn) {
      this.portBtn.addEventListener('click', () => onPort());
    }

    if (this.soundBtn) {
      this._updateSoundButton(!AudioManager.isMuted());
      this.soundBtn.addEventListener('click', () => {
        const nowMuted = !AudioManager.isMuted();
        AudioManager.setMuted(nowMuted);
        this._updateSoundButton(!nowMuted);
      });
    }
  }

  _updateSoundButton(isOn) {
    if (!this.soundBtn) return;
    this.soundBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    this.soundBtn.setAttribute('aria-label', isOn ? 'Mute sound' : 'Unmute sound');
  }

  show() {
    this.el.classList.add('visible');
    if (this.soundBtn) this._updateSoundButton(!AudioManager.isMuted());
    if (this.updateBanner && hasUpdate()) this.updateBanner.hidden = false;
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
