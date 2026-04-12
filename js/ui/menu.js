export class MenuScreen {
    constructor(onPlay, onPort) {
        this.el = document.getElementById('menu-screen');
        this.playBtn = document.getElementById('btn-play');
        this.portBtn = document.getElementById('btn-port');

        this.playBtn.addEventListener('click', () => onPlay());
        if (this.portBtn) {
            this.portBtn.addEventListener('click', () => onPort());
        }
    }

    show() { this.el.style.display = 'flex'; }
    hide() { this.el.style.display = 'none'; }
}
