export class GameOverScreen {
    constructor(onRestart, onPort) {
        this.el = document.getElementById('gameover-screen');
        this.distEl = document.getElementById('go-distance');
        this.scoreEl = document.getElementById('go-score');
        this.tollsPaidEl = document.getElementById('go-tolls-paid');
        this.tollsRefusedEl = document.getElementById('go-tolls-refused');
        this.nearMissEl = document.getElementById('go-nearmiss');
        this.earnedEl = document.getElementById('go-earned');
        this.quoteEl = document.getElementById('go-quote');
        this.announcer = document.getElementById('sr-announce');

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
        if (this.earnedEl) {
            this.earnedEl.textContent = '+¥' + (data.earned || 0).toLocaleString();
        }

        if (data.reason === 'blockade') {
            this.el.querySelector('.screen-title').textContent = 'Oil Confiscated!';
            this.el.querySelector('.screen-subtitle').textContent = 'USA Naval Blockade';
            this.quoteEl.textContent = '"Your oil now belongs to America. The art of the deal." \u2014 Donald Trump';
        } else {
            this.el.querySelector('.screen-title').textContent = 'Lost at Sea';
            this.el.querySelector('.screen-subtitle').textContent = 'MV Eternal Horizon \u2014 Final Report';
            const quotes = [
                '"We almost had it\u2026 Tremendous effort though." \u2014 Trump',
                '"The ceasefire collapsed. We will rebuild." \u2014 Bibi',
                '"All stations \u2014 vessel lost. Mark the coordinates." \u2014 Command',
                '"Nobody said it would be easy. But we\'ll be back. Bigger and better." \u2014 Trump',
                '"This is a setback, not a defeat. Israel endures." \u2014 Bibi',
            ];
            this.quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        }

        this.el.classList.add('visible');

        // Screen reader announcement
        if (this.announcer) {
            this.announcer.textContent = `Game over. Score: ${data.score}. Distance: ${(data.distance / 1000).toFixed(1)} kilometers.`;
        }
    }

    hide() {
        this.el.classList.remove('visible');
    }
}
