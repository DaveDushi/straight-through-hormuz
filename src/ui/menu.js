import { hasUpdate, applyUpdate } from './pwa.js';

export class MenuScreen {
  constructor(onPlay, onPort, onSettings) {
    this.el = document.getElementById('menu-screen');
    this.playBtn = document.getElementById('btn-play');
    this.portBtn = document.getElementById('btn-port');
    this.settingsBtn = document.getElementById('btn-settings');
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
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => onSettings());
    }
  }

  show() {
    this.el.classList.add('visible');
    if (this.updateBanner && hasUpdate()) this.updateBanner.hidden = false;
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
