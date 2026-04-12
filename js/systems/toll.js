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

    update(distance) {
        if (this.tollActive) return null;

        if (distance >= this.nextTollDistance) {
            const percent = randomRange(CONFIG.TOLL_CARGO_PERCENT_MIN, CONFIG.TOLL_CARGO_PERCENT_MAX);
            this.pendingToll = {
                percent: Math.round(percent),
                distance: distance,
            };
            this.tollActive = true;
            this.nextTollDistance = distance + randomRange(CONFIG.TOLL_INTERVAL_MIN, CONFIG.TOLL_INTERVAL_MAX);
            return this.pendingToll;
        }
        return null;
    }

    resolve(accepted, scoring) {
        if (!this.pendingToll) return;

        if (accepted) {
            const penalty = scoring.score * (this.pendingToll.percent / 100);
            scoring.score -= penalty;
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
