import { CONFIG } from '../config.js';

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
    }

    show() {
        this.el.classList.add('visible');
        this._renderUpgrades();
    }

    hide() {
        this.el.classList.remove('visible');
    }

    _renderUpgrades() {
        const save = this.saveManager.data;
        this.creditsEl.textContent = '¥' + save.currency.toLocaleString();
        this.farthestEl.textContent = (save.farthestDistance / 1000).toFixed(1) + ' km';

        this.upgradeContainer.innerHTML = '';
        for (const [key, cfg] of Object.entries(CONFIG.UPGRADES)) {
            const level = save.upgrades[key] || 0;
            const maxed = level >= cfg.maxLevel;
            const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMult, level));
            const canAfford = save.currency >= cost && !maxed;

            const div = document.createElement('div');
            div.className = 'upgrade-item' + (maxed ? ' maxed' : '');

            div.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${cfg.name}</div>
                    <div class="upgrade-desc">${cfg.description}</div>
                    <div class="upgrade-level">Lv ${level} / ${cfg.maxLevel}</div>
                </div>
                <button class="upgrade-btn${maxed ? ' maxed-label' : ''}" ${canAfford ? '' : 'disabled'}>
                    ${maxed ? 'MAXED' : '¥' + cost}
                </button>
            `;

            if (canAfford) {
                div.querySelector('.upgrade-btn').addEventListener('click', () => {
                    save.currency -= cost;
                    save.upgrades[key] = level + 1;
                    this.saveManager.save();
                    this._renderUpgrades();
                });
            }

            this.upgradeContainer.appendChild(div);
        }
    }
}
