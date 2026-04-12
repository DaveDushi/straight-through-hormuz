import { CONFIG } from '../config.js';
import { randomRange } from '../utils/math-utils.js';

export class TollSystem {
    constructor() {
        this.nextTollDistance = randomRange(CONFIG.TOLL_INTERVAL_MIN, CONFIG.TOLL_INTERVAL_MAX);
        this.pendingToll = null;
        this.tollActive = false;
    }

    reset() {
        this.nextTollDistance = randomRange(CONFIG.TOLL_INTERVAL_MIN, CONFIG.TOLL_INTERVAL_MAX);
        this.pendingToll = null;
        this.tollActive = false;
    }

    update(distance, saveManager) {
        if (this.tollActive) return null;

        if (distance >= this.nextTollDistance) {
            const km = distance / 1000;
            const baseCost = CONFIG.TOLL_BASE_COST + km * CONFIG.TOLL_COST_PER_KM;
            const variance = 1 + randomRange(-CONFIG.TOLL_COST_VARIANCE, CONFIG.TOLL_COST_VARIANCE);
            let cost = Math.round(baseCost * variance);

            // Apply toll discount upgrade
            if (saveManager) {
                const discountLevel = saveManager.getUpgradeLevel('tollDiscount');
                cost = Math.ceil(cost * (1 - discountLevel * CONFIG.UPGRADES.tollDiscount.effect));
            }

            this.pendingToll = {
                cost,
                distance,
            };
            this.tollActive = true;
            this.nextTollDistance = distance + randomRange(CONFIG.TOLL_INTERVAL_MIN, CONFIG.TOLL_INTERVAL_MAX);
            return this.pendingToll;
        }
        return null;
    }

    resolve(accepted, scoring, saveManager) {
        if (!this.pendingToll) return;

        if (accepted) {
            saveManager.data.currency -= this.pendingToll.cost;
            if (saveManager.data.currency < 0) saveManager.data.currency = 0;
            saveManager.save();
            scoring.tollsPaid++;
        } else {
            scoring.multiplier = CONFIG.TOLL_REFUSE_MULTIPLIER;
            scoring.multiplierTimer = 10;
            scoring.tollsRefused++;
        }

        this.pendingToll = null;
        this.tollActive = false;
    }
}
