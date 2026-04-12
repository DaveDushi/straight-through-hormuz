export class VictoryScreen {
    constructor(onRestart, onPort) {
        this.el = document.getElementById('victory-screen');
        this.distEl = document.getElementById('vic-distance');
        this.scoreEl = document.getElementById('vic-score');
        this.tollsPaidEl = document.getElementById('vic-tolls-paid');
        this.tollsRefusedEl = document.getElementById('vic-tolls-refused');
        this.nearMissEl = document.getElementById('vic-nearmiss');
        this.earnedEl = document.getElementById('vic-earned');
        this.quoteEl = document.getElementById('vic-quote');
        this.announcer = document.getElementById('sr-announce');

        document.getElementById('btn-vic-restart').addEventListener('click', () => onRestart());
        const portBtn = document.getElementById('btn-vic-port');
        if (portBtn) portBtn.addEventListener('click', () => onPort());
    }

    show(data) {
        this.distEl.textContent = (data.distance / 1000).toFixed(2) + ' km';
        this.scoreEl.textContent = data.score.toLocaleString();
        this.tollsPaidEl.textContent = data.tollsPaid;
        this.tollsRefusedEl.textContent = data.tollsRefused;
        this.nearMissEl.textContent = data.nearMissCount;
        if (this.earnedEl) {
            this.earnedEl.textContent = '+¥' + (data.earned || 0).toLocaleString();
        }

        const quotes = [
            '"We made it through. The greatest passage in history, believe me." — Trump',
            '"The Strait is open. Israel\'s resolve made this possible." — Bibi',
            '"All stations — MV Eternal Horizon has cleared the strait. Well done." — Command',
            '"Nobody said it could be done. We did it anyway. Tremendous." — Trump',
            '"Through fire and water, we endure. Congratulations, Captain." — Bibi',
        ];
        this.quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

        this.el.classList.add('visible');

        if (this.announcer) {
            this.announcer.textContent = `Victory! You made it through the strait. Score: ${data.score}. Distance: ${(data.distance / 1000).toFixed(1)} kilometers.`;
        }
    }

    hide() {
        this.el.classList.remove('visible');
    }
}
