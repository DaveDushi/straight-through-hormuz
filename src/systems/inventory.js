import { CONFIG } from '../config.js';

export class InventorySystem {
    constructor() {
        this.slots = [null];
        this.ceasefireTimer = 0;
        this.oilBoostTimer = 0;
        this.pakFlagTimer = 0;
    }

    reset(slotCount = 1) {
        this.slots = new Array(slotCount).fill(null);
        this.ceasefireTimer = 0;
        this.oilBoostTimer = 0;
        this.pakFlagTimer = 0;
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
            case 'oil':
                this.oilBoostTimer = CONFIG.OIL_BOOST_DURATION;
                if (context.activateOilBoost) context.activateOilBoost(true);
                break;
            case 'ceasefire':
                this.ceasefireTimer = CONFIG.CEASEFIRE_DURATION;
                if (context.activateCeasefire) context.activateCeasefire(true);
                break;
            case 'pakFlag':
                this.pakFlagTimer = CONFIG.PAK_FLAG_DURATION;
                if (context.activatePakFlag) context.activatePakFlag(true);
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

        if (this.oilBoostTimer > 0) {
            this.oilBoostTimer -= delta;
            if (this.oilBoostTimer <= 0) {
                this.oilBoostTimer = 0;
                if (context.activateOilBoost) context.activateOilBoost(false);
            }
        }

        if (this.pakFlagTimer > 0) {
            this.pakFlagTimer -= delta;
            if (this.pakFlagTimer <= 0) {
                this.pakFlagTimer = 0;
                if (context.activatePakFlag) context.activatePakFlag(false);
            }
        }
    }

    isCeasefireActive() {
        return this.ceasefireTimer > 0;
    }

    isOilBoostActive() {
        return this.oilBoostTimer > 0;
    }

    isPakFlagActive() {
        return this.pakFlagTimer > 0;
    }
}
