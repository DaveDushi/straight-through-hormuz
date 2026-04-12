export class GameOverScreen {
    constructor(onRestart, onPort) {
        this.el = document.getElementById('gameover-screen');
        this.distEl = document.getElementById('go-distance');
        this.scoreEl = document.getElementById('go-score');
        this.tollsPaidEl = document.getElementById('go-tolls-paid');
        this.tollsRefusedEl = document.getElementById('go-tolls-refused');
        this.nearMissEl = document.getElementById('go-nearmiss');
        this.quoteEl = document.getElementById('go-quote');

        document.getElementById('btn-restart').addEventListener('click', () => onRestart());
        const portBtn = document.getElementById('btn-go-port');
        if (portBtn) portBtn.addEventListener('click', () => onPort());
    }

    show(data) {
        this.distEl.textContent = (data.distance / 1000).toFixed(2) + ' km';
        this.scoreEl.textContent = data.score.toLocaleString();
        this.tollsPaidEl.textContent = data.tollsPaid;
        this.tollsRefusedEl.textContent = data.tollsRefused;
        this.nearMissEl.textContent = data.nearMissCount;

        const quotes = [
            '"We almost had it… Tremendous effort though." — Trump',
            '"The ceasefire collapsed. We will rebuild." — Bibi',
            '"All stations — vessel lost. Mark the coordinates." — Command',
            '"Nobody said it would be easy. But we\'ll be back. Bigger and better." — Trump',
            '"This is a setback, not a defeat. Israel endures." — Bibi',
        ];
        this.quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

        this.el.style.display = 'flex';
    }

    hide() { this.el.style.display = 'none'; }
}
