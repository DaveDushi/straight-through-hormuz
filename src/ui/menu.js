export class MenuScreen {
    constructor(onPlay, onPort) {
        this.el = document.getElementById('menu-screen');
        this.playBtn = document.getElementById('btn-play');
        this.portBtn = document.getElementById('btn-port');

        // Auto-detect touch vs keyboard for control hints
        const hint = document.getElementById('controls-hint');
        if (hint && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            hint.innerHTML =
                'Drag left / right to steer<br>' +
                'Tap BOOST for emergency boost<br>' +
                'Tap slots to use power-ups';
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
