export class TollDialog {
    constructor(onChoice) {
        this.el = document.getElementById('toll-dialog');
        this.costEl = document.getElementById('toll-cost');
        this.countdownEl = this.el.querySelector('.toll-countdown');
        this.payBtn = document.getElementById('btn-toll-pay');
        this.onChoice = onChoice;
        this._autoRefuseTimer = null;

        this.payBtn.addEventListener('click', () => {
            this._clearTimer();
            this.hide();
            this.onChoice(true);
        });
        document.getElementById('btn-toll-refuse').addEventListener('click', () => {
            this._clearTimer();
            this.hide();
            this.onChoice(false);
        });
    }

    show(cost, balance) {
        this.costEl.textContent = '¥' + cost.toLocaleString();

        if (balance < cost) {
            this.payBtn.disabled = true;
            this.payBtn.textContent = 'Insufficient ¥';
        } else {
            this.payBtn.disabled = false;
            this.payBtn.textContent = 'Pay Toll';
        }

        this.el.classList.add('visible');

        // Restart countdown animation
        if (this.countdownEl) {
            this.countdownEl.style.animation = 'none';
            void this.countdownEl.offsetHeight;
            this.countdownEl.style.animation = '';
        }

        // Auto-refuse after 8 seconds
        this._clearTimer();
        this._autoRefuseTimer = setTimeout(() => {
            this.hide();
            this.onChoice(false);
        }, 8000);
    }

    hide() {
        this._clearTimer();
        this.el.classList.remove('visible');
    }

    _clearTimer() {
        if (this._autoRefuseTimer) {
            clearTimeout(this._autoRefuseTimer);
            this._autoRefuseTimer = null;
        }
    }
}
