export class MenuScreen {
  constructor(onPlay, onPort) {
    this.el = document.getElementById('menu-screen');
    this.playBtn = document.getElementById('btn-play');
    this.portBtn = document.getElementById('btn-port');

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
  }

  show() {
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
