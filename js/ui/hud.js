import { CONFIG } from '../config.js';

export class HUD {
    constructor(onSlotClick) {
        this.el = document.getElementById('hud');
        this.hullBar = document.getElementById('hull-fill');
        this.hullText = document.getElementById('hull-text');
        this.scoreEl = document.getElementById('score-value');
        this.distanceEl = document.getElementById('distance-value');
        this.multiplierEl = document.getElementById('multiplier');
        this.phaseEl = document.getElementById('phase-name');
        this.boostBar = document.getElementById('boost-fill');
        this.slots = [
            document.getElementById('slot-0'),
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
        ];
        this.ceasefireOverlay = document.getElementById('ceasefire-overlay');

        this.slots.forEach((slot, i) => {
            if (slot) {
                slot.addEventListener('click', () => onSlotClick(i));
                slot.addEventListener('touchend', (e) => { e.preventDefault(); onSlotClick(i); });
            }
        });
    }

    show() { this.el.style.display = 'block'; }
    hide() { this.el.style.display = 'none'; }

    update(data) {
        const hullPct = (data.hull / data.maxHull) * 100;
        this.hullBar.style.width = hullPct + '%';
        this.hullBar.style.backgroundColor = hullPct > 50 ? '#44ff44' : hullPct > 25 ? '#ffaa00' : '#ff3333';
        this.hullText.textContent = Math.ceil(data.hull) + '%';

        this.scoreEl.textContent = data.score.toLocaleString();
        this.distanceEl.textContent = (data.distance / 1000).toFixed(1) + ' km';

        if (data.multiplier > 1) {
            this.multiplierEl.textContent = 'x' + data.multiplier.toFixed(1);
            this.multiplierEl.style.display = 'block';
        } else {
            this.multiplierEl.style.display = 'none';
        }

        this.phaseEl.textContent = data.phaseName;

        if (this.boostBar) {
            const boostPct = data.boostCooldown > 0
                ? (1 - data.boostCooldown / CONFIG.TANKER_BOOST_COOLDOWN) * 100
                : 100;
            this.boostBar.style.width = boostPct + '%';
        }

        for (let i = 0; i < 3; i++) {
            const slot = this.slots[i];
            if (slot) {
                const keyLabel = `<span class="slot-key">${i + 1}</span>`;
                if (data.inventory[i]) {
                    slot.innerHTML = keyLabel + this._powerupLabel(data.inventory[i]);
                    slot.className = 'slot filled slot-' + data.inventory[i];
                } else {
                    slot.innerHTML = keyLabel + '-';
                    slot.className = 'slot empty';
                }
            }
        }

        if (this.ceasefireOverlay) {
            this.ceasefireOverlay.style.display = data.ceasefireActive ? 'block' : 'none';
        }
    }

    _powerupLabel(type) {
        switch (type) {
            case 'flare': return 'FLARE';
            case 'oilSlick': return 'OIL';
            case 'ceasefire': return 'PEACE';
            default: return '?';
        }
    }
}
