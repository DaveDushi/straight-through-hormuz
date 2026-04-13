import { isPWA, canPromptInstall, promptInstall } from "./pwa.js";

let rotationIndex = 0;

function buildPWACard() {
  const div = document.createElement("div");
  div.className = "promo-card promo-pwa";
  if (canPromptInstall()) {
    div.innerHTML = `
            <p class="promo-text">Secure channel — install for offline access</p>
            <button class="btn btn-pwa">Install App</button>
        `;
    div.querySelector(".btn-pwa").addEventListener("click", async () => {
      const accepted = await promptInstall();
      if (accepted) div.style.display = "none";
    });
  } else {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const hint = isIOS
      ? 'Tap the <strong>Share</strong> button, then <strong>"Add to Home Screen"</strong>'
      : 'Tap your browser\'s <strong>menu (&#8942;)</strong>, then <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>';
    div.innerHTML = `
            <p class="promo-text">Want to play fullscreen &amp; offline like a real app?</p>
            <p class="promo-hint">${hint}</p>
        `;
  }
  return div;
}

function buildBMCCard() {
  const div = document.createElement("div");
  div.className = "promo-card promo-support";
  div.innerHTML = `
        <p class="promo-text">Love the game? Want to see it in the app store?</p>
        <a class="btn btn-coffee" href="https://buymeacoffee.com/davedushi" target="_blank" rel="noopener">Buy Me a Coffee</a>
    `;
  return div;
}

function getCardBuilders(adNode) {
  const cards = [];
  if (!isPWA()) {
    cards.push(buildPWACard);
  }
  cards.push(buildBMCCard);
  if (adNode) {
    cards.push(() => adNode.cloneNode(true));
  }
  return cards;
}

export function refreshPromo(slotEl) {
  if (!slotEl) return;

  const adNode = slotEl.querySelector("[data-ad]");
  const divider = slotEl.querySelector(".promo-divider");
  slotEl.innerHTML = "";
  if (divider) slotEl.appendChild(divider);

  const builders = getCardBuilders(adNode);
  if (builders.length === 0) return;

  const idx = rotationIndex % builders.length;
  rotationIndex++;
  slotEl.appendChild(builders[idx]());
}
