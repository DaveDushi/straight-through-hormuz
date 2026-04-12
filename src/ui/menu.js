export class MenuScreen {
    constructor(onPlay, onPort) {
        this.el = document.getElementById('menu-screen');
        this.playBtn = document.getElementById('btn-play');
        this.portBtn = document.getElementById('btn-port');

        this.tiltBtn = document.getElementById('btn-tilt');

        // Auto-detect touch vs keyboard for control hints
        const hint = document.getElementById('controls-hint');
        if (hint && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            hint.innerHTML =
                'Tilt phone left / right to steer<br>' +
                'Double-tap for emergency boost<br>' +
                'Tap slots to use power-ups';
        }

        // Show tilt button only on touch devices
        if (this.tiltBtn) {
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                this.tiltBtn.style.display = 'block';
            }
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
