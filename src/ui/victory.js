import { refreshPromo } from "./promo.js";
import { track } from "../analytics.js";

export class VictoryScreen {
  constructor(onRestart, onPort) {
    this.el = document.getElementById("victory-screen");
    this.distEl = document.getElementById("vic-distance");
    this.tollsPaidEl = document.getElementById("vic-tolls-paid");
    this.tollsRefusedEl = document.getElementById("vic-tolls-refused");
    this.nearMissEl = document.getElementById("vic-nearmiss");
    this.earnedEl = document.getElementById("vic-earned");
    this.quoteEl = document.getElementById("vic-quote");
    this.announcer = document.getElementById("sr-announce");
    this.shareBtn = document.getElementById("btn-vic-share");
    this.sharePreview = document.getElementById("vic-share-preview");
    this.promoSlot = document.getElementById("vic-promo-slot");
    this._distanceKm = 0;

    document
      .getElementById("btn-vic-restart")
      .addEventListener("click", () => onRestart());
    const portBtn = document.getElementById("btn-vic-port");
    if (portBtn) portBtn.addEventListener("click", () => onPort());
    if (this.shareBtn)
      this.shareBtn.addEventListener("click", () => this._share());
  }

  _getShareText() {
    return `\u{1F6A8} Breaking News \nOil Tanker made it all ${this._distanceKm} km through the Strait of Hormuz! The Iranians couldn't stop it. \nSee how far you can make it straitouttahormuz.us`;
  }

  _share() {
    const text = this._getShareText();
    track('share', { screen: 'victory', method: navigator.share ? 'native' : 'clipboard' });
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          if (this.shareBtn) {
            this.shareBtn.classList.add("share-copied");
            this.shareBtn.textContent = "Copied!";
            setTimeout(() => {
              this.shareBtn.classList.remove("share-copied");
              this.shareBtn.textContent = "Share";
            }, 2000);
          }
        })
        .catch(() => {
          window.open(
            "https://x.com/intent/tweet?text=" + encodeURIComponent(text),
            "_blank",
          );
        });
      return;
    }
    window.open(
      "https://x.com/intent/tweet?text=" + encodeURIComponent(text),
      "_blank",
    );
  }

  show(data) {
    this._distanceKm = (data.distance / 1000).toFixed(2);
    this.distEl.textContent = this._distanceKm + " km";
    this.tollsPaidEl.textContent = data.tollsPaid;
    this.tollsRefusedEl.textContent = data.tollsRefused;
    this.nearMissEl.textContent = data.nearMissCount;
    if (this.earnedEl) {
      this.earnedEl.textContent =
        "+\u00A5" + (data.earned || 0).toLocaleString();
    }

    const quotes = [
      '"We made it through. The greatest passage in history, believe me." \u2014 Trump',
      '"The Strait is open. Israel\'s resolve made this possible." \u2014 Bibi',
      '"All stations \u2014 MT Make Hormuz Great Again has cleared the strait. Well done." \u2014 Command',
      '"Nobody said it could be done. We did it anyway. Tremendous." \u2014 Trump',
      '"Through fire and water, we endure. Congratulations, Captain." \u2014 Bibi',
    ];
    this.quoteEl.textContent =
      quotes[Math.floor(Math.random() * quotes.length)];

    if (this.sharePreview) this.sharePreview.textContent = this._getShareText();

    this.el.classList.add("visible");
    refreshPromo(this.promoSlot);

    track('victory', {
      distance: Math.round(data.distance),
      distance_km: this._distanceKm,
      score: data.score,
      tolls_paid: data.tollsPaid,
      tolls_refused: data.tollsRefused,
      near_misses: data.nearMissCount,
      currency_earned: data.earned || 0,
    });

    if (this.announcer) {
      this.announcer.textContent = `Victory! You made it through the strait. Distance: ${(data.distance / 1000).toFixed(1)} kilometers.`;
    }
  }

  hide() {
    this.el.classList.remove("visible");
  }
}
