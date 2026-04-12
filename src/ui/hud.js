import { CONFIG } from '../config.js';

export class HUD {
    constructor(onSlotClick) {
        this.el = document.getElementById('hud');
        this.hullBar = document.getElementById('hull-fill');
        this.hullText = document.getElementById('hull-text');
        this.hullContainer = document.querySelector('.hull-bar-container');
        this.scoreEl = document.getElementById('score-value');
        this.distanceEl = document.getElementById('distance-value');
        this.yuanEl = document.getElementById('yuan-value');
        this.multiplierEl = document.getElementById('multiplier');
        this.phaseEl = document.getElementById('phase-name');
        this.boostBar = document.getElementById('boost-fill');
        this.damageOverlay = document.getElementById('damage-overlay');
        this.steerLeft = document.querySelector('.steer-indicator--left');
        this.steerRight = document.querySelector('.steer-indicator--right');
        this.slots = [
            document.getElementById('slot-0'),
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
        ];
        this.ceasefireOverlay = document.getElementById('ceasefire-overlay');

        // Dirty-flag cache to avoid DOM writes every frame
        this._prev = {
            hullPct: -1,
            hullClass: '',
            score: -1,
            distance: '',
            yuan: -1,
            multiplier: -1,
            phaseName: '',
            boostPct: -1,
            inv: ['', '', ''],
            ceasefire: false,
        };

        this._phaseTimer = 0;

        this.slots.forEach((slot, i) => {
            if (slot) {
                slot.addEventListener('click', () => onSlotClick(i));
            }
        });
    }

    show() {
        this.el.classList.add('visible');
        this.el.style.display = 'block';
    }

    hide() {
        this.el.classList.remove('visible');
        this.el.style.display = 'none';
    }

    flashDamage() {
        if (!this.damageOverlay) return;
        this.damageOverlay.classList.remove('active');
        void this.damageOverlay.offsetHeight; // force reflow
        this.damageOverlay.classList.add('active');
        setTimeout(() => this.damageOverlay.classList.remove('active'), 400);

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    }

    updateSteerIndicators(steer) {
        if (this.steerLeft) {
            this.steerLeft.style.opacity = steer < -0.1 ? Math.min(Math.abs(steer), 1) * 0.6 : 0;
        }
        if (this.steerRight) {
            this.steerRight.style.opacity = steer > 0.1 ? Math.min(steer, 1) * 0.6 : 0;
        }
    }

    update(data) {
        // Hull
        const hullPct = Math.round((data.hull / data.maxHull) * 100);
        if (hullPct !== this._prev.hullPct) {
            this._prev.hullPct = hullPct;
            this.hullBar.style.width = hullPct + '%';
            this.hullText.textContent = Math.ceil(data.hull) + '%';

            const hullClass = hullPct > 50 ? 'hull-high' : hullPct > 25 ? 'hull-mid' : 'hull-low';
            if (hullClass !== this._prev.hullClass) {
                this._prev.hullClass = hullClass;
                this.hullBar.className = hullClass;
                // Critical hull pulsing border
                if (hullPct <= 25) {
                    this.hullContainer.classList.add('hull-critical');
                } else {
                    this.hullContainer.classList.remove('hull-critical');
                }
            }

            // Update ARIA
            if (this.hullContainer) {
                this.hullContainer.setAttribute('aria-valuenow', hullPct);
            }
        }

        // Score
        const score = data.score;
        if (score !== this._prev.score) {
            this._prev.score = score;
            this.scoreEl.textContent = score.toLocaleString();
        }

        // Distance
        const distText = (data.distance / 1000).toFixed(1) + ' / 167 km';
        if (distText !== this._prev.distance) {
            this._prev.distance = distText;
            this.distanceEl.textContent = distText;
        }

        // Yuan
        if (data.yuan !== undefined && data.yuan !== this._prev.yuan) {
            this._prev.yuan = data.yuan;
            this.yuanEl.textContent = '¥' + data.yuan.toLocaleString();
        }

        // Multiplier
        if (data.multiplier !== this._prev.multiplier) {
            this._prev.multiplier = data.multiplier;
            if (data.multiplier > 1) {
                this.multiplierEl.textContent = 'x' + data.multiplier.toFixed(1);
                this.multiplierEl.classList.add('visible');
                this.multiplierEl.style.display = 'block';
            } else {
                this.multiplierEl.classList.remove('visible');
                this.multiplierEl.style.display = 'none';
            }
        }

        // Phase name (toast behavior)
        if (data.phaseName !== this._prev.phaseName) {
            this._prev.phaseName = data.phaseName;
            this.phaseEl.textContent = '\u2014\u2014 ' + data.phaseName.toUpperCase() + ' \u2014\u2014';
            this.phaseEl.className = 'visible';

            // Phase-specific color class
            const pn = data.phaseName.toLowerCase();
            if (pn.includes('calm')) this.phaseEl.classList.add('phase-calm');
            else if (pn.includes('awakening')) this.phaseEl.classList.add('phase-awakening');
            else if (pn.includes('escalation')) this.phaseEl.classList.add('phase-escalation');
            else if (pn.includes('war') || pn.includes('gauntlet') || pn.includes('passage')) this.phaseEl.classList.add('phase-war');

            // Toast: fade out after 3 seconds
            clearTimeout(this._phaseTimer);
            this._phaseTimer = setTimeout(() => {
                this.phaseEl.classList.remove('visible');
            }, 3000);
        }

        // Boost
        if (this.boostBar) {
            const boostPct = data.boostCooldown > 0
                ? Math.round((1 - data.boostCooldown / CONFIG.TANKER_BOOST_COOLDOWN) * 100)
                : 100;
            if (boostPct !== this._prev.boostPct) {
                this._prev.boostPct = boostPct;
                this.boostBar.style.width = boostPct + '%';
                if (boostPct >= 100) {
                    this.boostBar.classList.add('boost-ready');
                } else {
                    this.boostBar.classList.remove('boost-ready');
                }
            }
        }

        // Inventory slots (only update when changed)
        for (let i = 0; i < 3; i++) {
            const slot = this.slots[i];
            if (!slot) continue;
            const invType = data.inventory[i] || '';
            if (invType !== this._prev.inv[i]) {
                this._prev.inv[i] = invType;
                if (invType) {
                    const label = this._powerupLabel(invType);
                    slot.textContent = label;
                    slot.className = 'slot filled slot-' + invType;
                    slot.setAttribute('aria-label', 'Power-up slot ' + (i + 1) + ': ' + label);
                } else {
                    slot.innerHTML = '<span class="slot-key">' + (i + 1) + '</span>-';
                    slot.className = 'slot empty';
                    slot.setAttribute('aria-label', 'Power-up slot ' + (i + 1) + ': empty');
                }
            }
        }

        // Ceasefire
        if (data.ceasefireActive !== this._prev.ceasefire) {
            this._prev.ceasefire = data.ceasefireActive;
            if (this.ceasefireOverlay) {
                this.ceasefireOverlay.style.display = data.ceasefireActive ? 'block' : 'none';
            }
        }
    }

    showPickupNotification(type) {
        const descriptions = {
            flare: 'FLARE \u2014 Scatters drones for 8s',
            oilSlick: 'OIL SLICK \u2014 Slows & drifts enemies for 10s',
            ceasefire: 'CEASEFIRE \u2014 Freezes all enemies for 13s',
        };
        const el = document.getElementById('pickup-notification');
        if (!el) return;
        el.textContent = descriptions[type] || 'POWER-UP COLLECTED';
        el.classList.remove('active');
        void el.offsetHeight;
        el.classList.add('active');
        clearTimeout(this._pickupTimer);
        this._pickupTimer = setTimeout(() => el.classList.remove('active'), 2500);
    }

    _powerupLabel(type) {
        switch (type) {
            case 'flare': return 'FLARE';
            case 'oilSlick': return 'SLICK';
            case 'ceasefire': return 'PEACE';
            default: return '?';
        }
    }
}
