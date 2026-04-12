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
        this.shareBtn = document.getElementById('btn-vic-share');
        this._distanceKm = 0;

        document.getElementById('btn-vic-restart').addEventListener('click', () => onRestart());
        const portBtn = document.getElementById('btn-vic-port');
        if (portBtn) portBtn.addEventListener('click', () => onPort());
        if (this.shareBtn) this.shareBtn.addEventListener('click', () => this._share());
    }

    _share() {
        const km = this._distanceKm;
        const text = `Breaking News \u{1F6A8}: Oil Tanker made it all ${km} km through the Strait of Hormuz! The Iranians couldn't stop it. See how far you can make it straitouttahormuz.us`;
        this._copyText(text);
    }

    _copyText(text) {
        if (navigator.share) {
            navigator.share({ text }).catch(() => {});
            return;
        }
        window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
    }

    show(data) {
        this._distanceKm = (data.distance / 1000).toFixed(2);
        this.distEl.textContent = this._distanceKm + ' km';
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
