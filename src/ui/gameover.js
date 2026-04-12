export class GameOverScreen {
  constructor(onRestart, onPort) {
    this.el = document.getElementById("gameover-screen");
    this.distEl = document.getElementById("go-distance");
    this.scoreEl = document.getElementById("go-score");
    this.tollsPaidEl = document.getElementById("go-tolls-paid");
    this.tollsRefusedEl = document.getElementById("go-tolls-refused");
    this.nearMissEl = document.getElementById("go-nearmiss");
    this.earnedEl = document.getElementById("go-earned");
    this.quoteEl = document.getElementById("go-quote");
    this.announcer = document.getElementById("sr-announce");
    this.shareBtn = document.getElementById("btn-go-share");
    this._distanceKm = 0;

    document
      .getElementById("btn-restart")
      .addEventListener("click", () => onRestart());
    const portBtn = document.getElementById("btn-go-port");
    if (portBtn) portBtn.addEventListener("click", () => onPort());
    if (this.shareBtn) this.shareBtn.addEventListener("click", () => this._share());
  }

  _share() {
    const km = this._distanceKm;
    const text = `Breaking News \u{1F6A8}: Oil Tanker only made it ${km} km through the Strait of Hormuz before getting destroyed by the Iranians. See how far you can make it straitouttahormuz.us`;
    this._copyText(text);
  }

  _copyText(text) {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
      return;
    }
    window.open("https://x.com/intent/tweet?text=" + encodeURIComponent(text), "_blank");
  }

  show(data) {
    this._distanceKm = (data.distance / 1000).toFixed(2);
    this.distEl.textContent = this._distanceKm + " km";
    this.scoreEl.textContent = data.score.toLocaleString();
    this.tollsPaidEl.textContent = data.tollsPaid;
    this.tollsRefusedEl.textContent = data.tollsRefused;
    this.nearMissEl.textContent = data.nearMissCount;
    if (this.earnedEl) {
      this.earnedEl.textContent = "+¥" + (data.earned || 0).toLocaleString();
    }

    if (data.reason === "blockade") {
      this.el.querySelector(".screen-title").textContent = "Oil Confiscated!";
      this.el.querySelector(".screen-subtitle").textContent =
        "USA Naval Blockade";
      this.quoteEl.textContent =
        '"Your oil now belongs to America. Effective immediately — BLOCKADED!" \u2014 Donald Trump';
    } else {
      this.el.querySelector(".screen-title").textContent = "Lost at Sea";
      this.el.querySelector(".screen-subtitle").textContent =
        "MV Eternal Horizon \u2014 Final Report";
      const quotes = [
        '"We almost had it\u2026 Tremendous effort though." \u2014 Trump',
        '"The ceasefire collapsed. We will rebuild." \u2014 Bibi',
        '"All stations \u2014 vessel lost. Mark the coordinates." \u2014 Command',
        '"Nobody said it would be easy. But we\'ll be back. Bigger and better." \u2014 Trump',
        '"This is a setback, not a defeat. Israel endures." \u2014 Bibi',
      ];
      this.quoteEl.textContent =
        quotes[Math.floor(Math.random() * quotes.length)];
    }

    this.el.classList.add("visible");

    // Screen reader announcement
    if (this.announcer) {
      this.announcer.textContent = `Game over. Score: ${data.score}. Distance: ${(data.distance / 1000).toFixed(1)} kilometers.`;
    }
  }

  hide() {
    this.el.classList.remove("visible");
  }
}
