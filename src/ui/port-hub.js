import { CONFIG } from '../config.js';
import { DockShipView } from './dock-ship-view.js';

const UPGRADE_ICONS = {
  rudder: '\u2699',
  hull: '\u{1F6E1}',
  radar: '\u{1F4E1}',
  tollDiscount: '\u{1F4B0}',
  ironBeam: '\u{1F52B}',
};

export class PortHub {
  constructor(onDeploy, saveManager, onHome) {
    this.el = document.getElementById('port-hub-screen');
    this.saveManager = saveManager;
    this.onDeploy = onDeploy;

    document.getElementById('btn-deploy').addEventListener('click', () => {
      this.hide();
      onDeploy();
    });

    document.getElementById('btn-port-home').addEventListener('click', () => {
      this.hide();
      if (onHome) onHome();
    });

    this.upgradeContainer = document.getElementById('upgrades-list');
    this.creditsEl = document.getElementById('credits-value');
    this.farthestEl = document.getElementById('farthest-value');

    const viewport = document.getElementById('dock-ship-viewport');
    this.shipView = new DockShipView(viewport);
  }

  show() {
    this.el.classList.add('visible');
    this._renderUpgrades();
    this.shipView.start();
  }

  hide() {
    this.el.classList.remove('visible');
    this.shipView.stop();
  }

  _renderUpgrades() {
    const save = this.saveManager.data;
    this.creditsEl.textContent = save.currency.toLocaleString();
    this.farthestEl.textContent = (save.farthestDistance / 1000).toFixed(1) + ' km';

    this.shipView.applyUpgrades(save.upgrades);

    this.upgradeContainer.innerHTML = '';
    for (const [key, cfg] of Object.entries(CONFIG.UPGRADES)) {
      const level = save.upgrades[key] || 0;
      const maxed = level >= cfg.maxLevel;
      const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMult, level));
      const canAfford = save.currency >= cost && !maxed;

      const div = document.createElement('div');
      let stateClass = '';
      if (maxed) stateClass = ' maxed';
      else if (!canAfford) stateClass = ' too-expensive';
      div.className = 'upgrade-item' + stateClass;

      let pipsHtml = '';
      for (let i = 0; i < cfg.maxLevel; i++) {
        pipsHtml += `<span class="pip${i < level ? ' filled' : ''}"></span>`;
      }

      const icon = UPGRADE_ICONS[key] || '\u2022';

      div.innerHTML = `
        <div class="upgrade-icon">${icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-header">
            <div class="upgrade-name">${cfg.name}</div>
            <div class="upgrade-level">${maxed ? 'MAX' : 'Lv ' + level}</div>
          </div>
          <div class="upgrade-pips">${pipsHtml}</div>
          <div class="upgrade-desc">${cfg.description}</div>
        </div>
        <button class="upgrade-btn${maxed ? ' maxed-label' : ''}" ${canAfford ? '' : 'disabled'}>
          ${maxed ? 'MAXED' : '\u00A5' + cost}
        </button>
      `;

      if (canAfford) {
        div.querySelector('.upgrade-btn').addEventListener('click', () => {
          save.currency -= cost;
          save.upgrades[key] = level + 1;
          this.saveManager.save();

          const newPip = div.querySelectorAll('.pip')[level];
          if (newPip) {
            newPip.classList.add('filled', 'pip-animating');
          }
          div.classList.add('card-flash');

          setTimeout(() => this._renderUpgrades(), 350);
        });
      }

      this.upgradeContainer.appendChild(div);
    }
  }
}
