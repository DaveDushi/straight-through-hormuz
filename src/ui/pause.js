export class PauseScreen {
    constructor(onResume, onExitHome) {
        this.el = document.getElementById('pause-screen');
        document.getElementById('btn-resume').addEventListener('click', () => onResume());
        document.getElementById('btn-exit-home').addEventListener('click', () => onExitHome());
    }

    show() {
        this.el.classList.add('visible');
    }

    hide() {
        this.el.classList.remove('visible');
    }
}
