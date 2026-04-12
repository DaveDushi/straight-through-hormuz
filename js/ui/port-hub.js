import { CONFIG } from '../config.js';

export class PortHub {
    constructor(onDeploy, saveManager) {
        this.el = document.getElementById('port-hub-screen');
        this.saveManager = saveManager;
        this.onDeploy = onDeploy;

        document.getElementById('btn-deploy').addEventListener('click', () => {
            this.hide();
            onDeploy();
        });

        this.upgradeContainer = document.getElementById('upgrades-list');
        this.creditsEl = document.getElementById('credits-value');
        this.highScoreEl = document.getElementById('highscore-value');
    }

    show() {
        this.el.style.display = 'flex';
        this._renderUpgrades();
    }

    hide() { this.el.style.display = 'none'; }

    _renderUpgrades() {
        const save = this.saveManager.data;
        this.creditsEl.textContent = save.currency.toLocaleString();
        this.highScoreEl.textContent = save.highScore.toLocaleString();

        this.upgradeContainer.innerHTML = '';
        for (const [key, cfg] of Object.entries(CONFIG.UPGRADES)) {
            const level = save.upgrades[key] || 0;
            const maxed = level >= cfg.maxLevel;
            const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMult, level));

            const div = document.createElement('div');
            div.className = 'upgrade-item';

            const canAfford = save.currency >= cost && !maxed;

            div.innerHTML = `
                <div class="upgrade-name">${cfg.name}</div>
                <div class="upgrade-level">Lv ${level}/${cfg.maxLevel}</div>
                <button class="upgrade-btn" ${canAfford ? '' : 'disabled'}>
                    ${maxed ? 'MAXED' : cost + ' IC'}
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
