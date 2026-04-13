import { CONFIG } from '../config.js';
import { DockShipView } from './dock-ship-view.js';

const UPGRADE_ICONS = {
  rudder: '\u2699',
  hull: '\u{1F6E1}',
  radar: '\u{1F4E1}',
  tollDiscount: '\u{1F4B0}',
  ironBeam: '\u{1F52B}',
  fuelTank: '\u26FD',
  reinforcedBow: '\u2693',
  cargoInsurance: '\u{1F4E6}',
};

const TILE_NAMES = {
  rudder: 'Rudder',
  hull: 'Hull',
  radar: 'Radar',
  tollDiscount: 'Tolls',
  ironBeam: 'Beam',
  fuelTank: 'Fuel',
  reinforcedBow: 'Bow',
  cargoInsurance: 'Cargo',
};

function getStatText(key, level) {
  const cfg = CONFIG.UPGRADES[key];
  switch (key) {
    case 'rudder': {
      const pct = Math.round(level * cfg.effect * 100);
      return `Steering: ${pct > 0 ? '+' : ''}${pct}%`;
    }
    case 'hull': {
      const total = CONFIG.HULL_MAX + level * cfg.effect;
      return `Hull: ${total} HP`;
    }
    case 'radar': {
      const range = CONFIG.IRON_BEAM_RANGE + level * cfg.effect;
      return `Beam range: ${range}m`;
    }
    case 'tollDiscount': {
      const pct = Math.round(level * cfg.effect * 100);
      return `Tolls: ${pct > 0 ? '-' : ''}${pct}%`;
    }
    case 'ironBeam': {
      const rate = Math.round((CONFIG.IRON_BEAM_BASE_HIT_RATE + level * CONFIG.IRON_BEAM_UPGRADE_BONUS) * 100);
      return `Intercept: ${rate}%`;
    }
    case 'fuelTank': {
      const fuel = CONFIG.TANKER_FUEL_MAX + level * cfg.effect;
      const regen = CONFIG.TANKER_FUEL_REGEN_CAP + level * 3;
      return `Fuel: ${fuel} / Regen: ${regen}`;
    }
    case 'reinforcedBow': {
      const pct = Math.round(level * cfg.effect * 100);
      return `Wall dmg: ${pct > 0 ? '-' : ''}${pct}%`;
    }
    case 'cargoInsurance': {
      const pct = Math.round(level * cfg.effect * 100);
      return `Earnings: ${pct > 0 ? '+' : ''}${pct}%`;
    }
    default:
      return '';
  }
}

export class PortHub {
  constructor(onDeploy, saveManager, onHome) {
    this.el = document.getElementById('port-hub-screen');
    this.saveManager = saveManager;
    this.onDeploy = onDeploy;
    this._built = false;
    this._tileRefs = {};
    this._selectedKey = null;

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

    this.upgradeContainer.addEventListener('click', (e) => {
      const tile = e.target.closest('.upgrade-tile');
      if (!tile) return;
      const key = tile.dataset.upgrade;
      if (key) this._selectUpgrade(key);
    });
  }

  show() {
    this.el.classList.add('visible');
    if (!this._built) {
      this._buildTiles();
      this._built = true;
    }
    this._updateAll();
    this.shipView.start();
  }

  hide() {
    this.el.classList.remove('visible');
    this.shipView.stop();
  }

  _buildTiles() {
    this.upgradeContainer.innerHTML = '';

    for (const [key, cfg] of Object.entries(CONFIG.UPGRADES)) {
      const tile = document.createElement('div');
      tile.className = 'upgrade-tile';
      tile.dataset.upgrade = key;

      const icon = UPGRADE_ICONS[key] || '\u2022';
      let pipsHtml = '';
      for (let i = 0; i < cfg.maxLevel; i++) {
        pipsHtml += '<span class="pip"></span>';
      }

      tile.innerHTML = `
        <div class="tile-icon">${icon}</div>
        <div class="tile-name">${TILE_NAMES[key] || cfg.name}</div>
        <div class="tile-pips">${pipsHtml}</div>
      `;

      this._tileRefs[key] = {
        tile,
        pips: Array.from(tile.querySelectorAll('.pip')),
      };
      this.upgradeContainer.appendChild(tile);
    }

    this._detailEl = document.createElement('div');
    this._detailEl.id = 'upgrade-detail';
    this._detailEl.innerHTML = `
      <div class="detail-top">
        <div class="detail-icon"></div>
        <div class="detail-info">
          <div class="detail-header">
            <span class="detail-name"></span>
            <span class="detail-level"></span>
          </div>
          <div class="detail-pips"></div>
          <div class="detail-desc"></div>
        </div>
      </div>
      <div class="detail-bottom">
        <div class="detail-stat"></div>
        <button class="upgrade-btn detail-buy"></button>
      </div>
    `;
    this.upgradeContainer.after(this._detailEl);

    this._detailRefs = {
      icon: this._detailEl.querySelector('.detail-icon'),
      name: this._detailEl.querySelector('.detail-name'),
      level: this._detailEl.querySelector('.detail-level'),
      desc: this._detailEl.querySelector('.detail-desc'),
      stat: this._detailEl.querySelector('.detail-stat'),
      btn: this._detailEl.querySelector('.detail-buy'),
      pipsEl: this._detailEl.querySelector('.detail-pips'),
    };

    this._detailRefs.btn.addEventListener('click', () => {
      if (this._selectedKey) this._handlePurchase(this._selectedKey);
    });

    this._selectUpgrade(Object.keys(CONFIG.UPGRADES)[0]);
  }

  _selectUpgrade(key) {
    if (this._selectedKey && this._tileRefs[this._selectedKey]) {
      this._tileRefs[this._selectedKey].tile.classList.remove('selected');
    }
    this._selectedKey = key;
    if (this._tileRefs[key]) {
      this._tileRefs[key].tile.classList.add('selected');
    }
    this.shipView.highlightUpgrade(key);
    this._updateDetail();
  }

  _updateAll() {
    const save = this.saveManager.data;
    this.creditsEl.textContent = save.currency.toLocaleString();
    this.farthestEl.textContent = (save.farthestDistance / 1000).toFixed(1) + ' km';
    this.shipView.applyUpgrades(save.upgrades);

    for (const [key, cfg] of Object.entries(CONFIG.UPGRADES)) {
      const refs = this._tileRefs[key];
      if (!refs) continue;

      const level = save.upgrades[key] || 0;
      const maxed = level >= cfg.maxLevel;
      const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMult, level));
      const canAfford = save.currency >= cost && !maxed;

      refs.tile.classList.remove('maxed', 'too-expensive', 'almost-maxed');
      if (maxed) refs.tile.classList.add('maxed');
      else if (!canAfford) refs.tile.classList.add('too-expensive');
      if (!maxed && level === cfg.maxLevel - 1) refs.tile.classList.add('almost-maxed');

      for (let i = 0; i < refs.pips.length; i++) {
        refs.pips[i].classList.toggle('filled', i < level);
      }
    }

    this._updateDetail();
  }

  _updateDetail() {
    const key = this._selectedKey;
    if (!key) return;

    const save = this.saveManager.data;
    const cfg = CONFIG.UPGRADES[key];
    const level = save.upgrades[key] || 0;
    const maxed = level >= cfg.maxLevel;
    const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMult, level));
    const canAfford = save.currency >= cost && !maxed;
    const icon = UPGRADE_ICONS[key] || '\u2022';

    this._detailRefs.icon.textContent = icon;
    this._detailRefs.name.textContent = cfg.name;
    this._detailRefs.level.textContent = maxed ? 'MAX' : 'Lv ' + level;
    this._detailRefs.desc.textContent = cfg.description;

    const now = getStatText(key, level);
    if (maxed) {
      this._detailRefs.stat.textContent = now;
    } else {
      const next = getStatText(key, level + 1);
      this._detailRefs.stat.innerHTML = `${now} <span class="stat-arrow">\u2192</span> <span class="stat-next">${next}</span>`;
    }

    let pipsHtml = '';
    for (let i = 0; i < cfg.maxLevel; i++) {
      const filled = i < level ? ' filled' : '';
      pipsHtml += `<span class="pip${filled}"></span>`;
    }
    this._detailRefs.pipsEl.innerHTML = pipsHtml;

    this._detailRefs.btn.disabled = !canAfford;
    this._detailRefs.btn.textContent = maxed ? 'MAXED' : '\u00A5' + cost;
    this._detailRefs.btn.className = 'upgrade-btn detail-buy' + (maxed ? ' maxed-label' : '');

    this._detailEl.classList.toggle('maxed', maxed);
    this._detailEl.classList.toggle('too-expensive', !canAfford && !maxed);
  }

  _handlePurchase(key) {
    const save = this.saveManager.data;
    const cfg = CONFIG.UPGRADES[key];
    const level = save.upgrades[key] || 0;
    const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMult, level));

    save.currency -= cost;
    save.upgrades[key] = level + 1;
    this.saveManager.save();

    const refs = this._tileRefs[key];
    if (refs && refs.pips[level]) {
      refs.pips[level].classList.add('filled', 'pip-animating');
    }

    if (refs) {
      refs.tile.classList.remove('tile-flash');
      void refs.tile.offsetWidth;
      refs.tile.classList.add('tile-flash');
    }

    this._updateAll();
    if (this._selectedKey) {
      this.shipView.highlightUpgrade(this._selectedKey);
    }
  }
}
