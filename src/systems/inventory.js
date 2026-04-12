import { CONFIG } from '../config.js';

export class InventorySystem {
    constructor() {
        this.slots = [null, null, null];
        this.ceasefireTimer = 0;
        this.flareTimer = 0;
        this.oilSlickTimer = 0;
    }

    reset() {
        this.slots = [null, null, null];
        this.ceasefireTimer = 0;
        this.flareTimer = 0;
        this.oilSlickTimer = 0;
    }

    add(type) {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] === null) {
                this.slots[i] = type;
                return true;
            }
        }
        return false;
    }

    activate(slotIndex, context) {
        const type = this.slots[slotIndex];
        if (!type) return false;

        this.slots[slotIndex] = null;

        switch (type) {
            case 'flare':
                this.flareTimer = CONFIG.FLARE_DURATION;
                if (context.freezeDrones) context.freezeDrones(true);
                break;
            case 'oilSlick':
                this.oilSlickTimer = CONFIG.OIL_SLICK_DURATION;
                if (context.deployOilSlick) context.deployOilSlick();
                break;
            case 'ceasefire':
                this.ceasefireTimer = CONFIG.CEASEFIRE_DURATION;
                if (context.activateCeasefire) context.activateCeasefire(true);
                break;
        }
        return true;
    }

    update(delta, context) {
        if (this.ceasefireTimer > 0) {
            this.ceasefireTimer -= delta;
            if (this.ceasefireTimer <= 0) {
                this.ceasefireTimer = 0;
                if (context.activateCeasefire) context.activateCeasefire(false);
            }
        }

        if (this.flareTimer > 0) {
            this.flareTimer -= delta;
            if (this.flareTimer <= 0) {
                this.flareTimer = 0;
                if (context.freezeDrones) context.freezeDrones(false);
            }
        }

        if (this.oilSlickTimer > 0) {
            this.oilSlickTimer -= delta;
        }
    }

    isCeasefireActive() {
        return this.ceasefireTimer > 0;
    }
}
