export class TollDialog {
    constructor(onChoice) {
        this.el = document.getElementById('toll-dialog');
        this.percentEl = document.getElementById('toll-percent');
        this.onChoice = onChoice;

        document.getElementById('btn-toll-pay').addEventListener('click', () => {
            this.hide();
            this.onChoice(true);
        });
        document.getElementById('btn-toll-refuse').addEventListener('click', () => {
            this.hide();
            this.onChoice(false);
        });
    }

    show(percent) {
        this.percentEl.textContent = percent + '%';
        this.el.style.display = 'flex';
    }

    hide() { this.el.style.display = 'none'; }
}
