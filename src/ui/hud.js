import { CONFIG } from '../config.js';

export class HUD {
    constructor(onSlotClick) {
        this.el = document.getElementById('hud');
        this.hullBar = document.getElementById('hull-fill');
        this.hullText = document.getElementById('hull-text');
        this.hullContainer = document.querySelector('.hull-bar-container');
        this.distanceEl = document.getElementById('distance-value');
        this.yuanEl = document.getElementById('yuan-value');
        this.multiplierEl = document.getElementById('multiplier');
        this.phaseEl = document.getElementById('phase-name');
        this.boostBar = document.getElementById('boost-fill');
        this.damageOverlay = document.getElementById('damage-overlay');
        this.boostBtn = document.getElementById('btn-boost');
        this.boostBtnLeft = document.getElementById('btn-boost-left');
        this.steerLeft = document.querySelector('.steer-indicator--left');
        this.steerRight = document.querySelector('.steer-indicator--right');
        this.inventoryBar = document.querySelector('.inventory-bar');
        this.slots = [];
        this._onSlotClick = onSlotClick;
        this.ceasefireOverlay = document.getElementById('ceasefire-overlay');

        // Dirty-flag cache to avoid DOM writes every frame
        this._prev = {
            hullPct: -1,
            hullClass: '',
            distance: '',
            yuan: -1,
            multiplier: -1,
            phaseName: '',
            boostPct: -1,
            inv: [],
            ceasefire: false,
            pakFlag: false,
        };

        this._phaseTimer = 0;
        this.setSlotCount(1);
    }

    setSlotCount(count) {
        this.inventoryBar.innerHTML = '';
        this.slots = [];
        this._prev.inv = [];
        for (let i = 0; i < count; i++) {
            const btn = document.createElement('button');
            btn.className = 'slot empty';
            btn.id = 'slot-' + i;
            btn.setAttribute('aria-label', 'Power-up slot ' + (i + 1) + ': empty');
            btn.innerHTML = '<span class="slot-key">' + (i + 1) + '</span>-';
            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._onSlotClick(i);
                if (navigator.vibrate) navigator.vibrate(15);
            });
            this.inventoryBar.appendChild(btn);
            this.slots.push(btn);
            this._prev.inv.push('');
        }
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

        // Distance
        const distText = (data.distance / 1000).toFixed(1) + ' / ' + (CONFIG.WIN_DISTANCE / 1000) + ' km';
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

        // Fuel / Boost
        if (this.boostBar) {
            const fuelPct = Math.round((data.fuel / (data.maxFuel || CONFIG.TANKER_FUEL_MAX)) * 100);
            const canBoost = data.fuel >= CONFIG.TANKER_FUEL_PER_BOOST;
            if (fuelPct !== this._prev.boostPct) {
                this._prev.boostPct = fuelPct;
                this.boostBar.style.width = fuelPct + '%';
                if (canBoost) {
                    this.boostBar.classList.add('boost-ready');
                } else {
                    this.boostBar.classList.remove('boost-ready');
                }
                if (this.boostBtn) {
                    this.boostBtn.classList.toggle('on-cooldown', !canBoost);
                }
                if (this.boostBtnLeft) {
                    this.boostBtnLeft.classList.toggle('on-cooldown', !canBoost);
                }
            }
        }

        // Inventory slots (only update when changed)
        for (let i = 0; i < this.slots.length; i++) {
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
                    slot.classList.add('slot-new');
                    setTimeout(() => slot.classList.remove('slot-new'), 600);
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

        // Pak Flag
        if (data.pakFlagActive !== this._prev.pakFlag) {
            this._prev.pakFlag = data.pakFlagActive;
            const pakOverlay = document.getElementById('pakflag-overlay');
            if (pakOverlay) {
                pakOverlay.style.display = data.pakFlagActive ? 'block' : 'none';
            }
        }
    }

    showPickupNotification(type) {
        if (!this._seenPickups) this._seenPickups = new Set();
        if (this._seenPickups.has(type)) return;
        this._seenPickups.add(type);

        const activateHint = CONFIG.isMobile ? 'Tap slot' : 'Press 1-' + this.slots.length;
        const descriptions = {
            oil: `OIL \u2014 ${activateHint} to boost speed & steering (8s)`,
            ceasefire: `CEASEFIRE \u2014 ${activateHint} to stop all shooting (10s)`,
            pakFlag: `PAKISTANI FLAG \u2014 ${activateHint} for invincibility (10s)`,
            repair: 'REPAIR \u2014 Hull +20',
            fuel: 'FUEL \u2014 Boost +50',
            laser: 'LASER \u2014 Iron Beam buffed for 10s',
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

    resetPickupNotifications() {
        this._seenPickups = new Set();
    }

    _powerupLabel(type) {
        switch (type) {
            case 'oil': return 'OIL';
            case 'ceasefire': return 'PEACE';
            case 'pakFlag': return 'PAK';
            default: return '?';
        }
    }
}
