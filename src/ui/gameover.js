import { refreshPromo } from "./promo.js";

export class GameOverScreen {
  constructor(onRestart, onPort) {
    this.el = document.getElementById("gameover-screen");
    this.distEl = document.getElementById("go-distance");
    this.tollsPaidEl = document.getElementById("go-tolls-paid");
    this.tollsRefusedEl = document.getElementById("go-tolls-refused");
    this.nearMissEl = document.getElementById("go-nearmiss");
    this.earnedEl = document.getElementById("go-earned");
    this.quoteEl = document.getElementById("go-quote");
    this.heroEl = document.getElementById("go-hero");
    this.announcer = document.getElementById("sr-announce");
    this.shareBtn = document.getElementById("btn-go-share");
    this.sharePreview = document.getElementById("go-share-preview");
    this.promoSlot = document.getElementById("go-promo-slot");
    this._distanceKm = 0;

    document
      .getElementById("btn-restart")
      .addEventListener("click", () => onRestart());
    const portBtn = document.getElementById("btn-go-port");
    if (portBtn) portBtn.addEventListener("click", () => onPort());
    if (this.shareBtn)
      this.shareBtn.addEventListener("click", () => this._share());
  }

  _getShareText() {
    return `\u{1F6A8} Breaking News \nThe heroic oil tanker, MT Make  Hormuz Great Again, only made it ${this._distanceKm} km through the Strait of Hormuz before Iran destroyed it. \nSad! \nHow far can YOU make it, tough guy? \n\u{1F449} straitouttahormuz.us`;
  }

  _share() {
    const text = this._getShareText();
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

    const titleEl = this.el.querySelector(".screen-title");
    const subtitleEl = this.el.querySelector(".screen-subtitle");

    if (data.reason === "blockade") {
      titleEl.textContent = "Oil Confiscated!";
      subtitleEl.textContent = "USA Naval Blockade";
      titleEl.style.color = "var(--naval-300)";
      titleEl.style.textShadow = "0 2px 8px rgba(58, 143, 212, 0.3)";
      if (this.heroEl) {
        this.heroEl.classList.remove("result-hero--victory");
        this.heroEl.classList.add("result-hero--blockade");
      }
      this.quoteEl.textContent =
        '"Your oil now belongs to America. Effective immediately \u2014 BLOCKADED!" \u2014 Donald Trump';
    } else {
      titleEl.textContent = "Lost at Sea";
      subtitleEl.textContent = "MT Make Hormuz Great Again \u2014 Final Report";
      titleEl.style.color = "";
      titleEl.style.textShadow = "";
      if (this.heroEl) {
        this.heroEl.classList.remove(
          "result-hero--victory",
          "result-hero--blockade",
        );
      }
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

    if (this.sharePreview) this.sharePreview.textContent = this._getShareText();

    this.el.classList.add("visible");
    refreshPromo(this.promoSlot);

    if (this.announcer) {
      this.announcer.textContent = `Game over. Distance: ${(data.distance / 1000).toFixed(1)} kilometers.`;
    }
  }

  hide() {
    this.el.classList.remove("visible");
  }
}
