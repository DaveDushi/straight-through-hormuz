import { CONFIG } from '../config.js';
import { lerp } from '../utils/math-utils.js';
import { track } from '../analytics.js';

export class DifficultySystem {
    constructor() {
        this.currentPhase = CONFIG.DIFFICULTY[0];
        this.phaseIndex = 0;
        this.phaseName = this.currentPhase.name;
    }

    update(distance) {
        let idx = 0;
        for (let i = CONFIG.DIFFICULTY.length - 1; i >= 0; i--) {
            if (distance >= CONFIG.DIFFICULTY[i].startDistance) {
                idx = i;
                break;
            }
        }

        if (idx < CONFIG.DIFFICULTY.length - 1) {
            const curr = CONFIG.DIFFICULTY[idx];
            const next = CONFIG.DIFFICULTY[idx + 1];
            const t = (distance - curr.startDistance) / (next.startDistance - curr.startDistance);
            this.currentPhase = {
                name: curr.name,
                mineRate: lerp(curr.mineRate, next.mineRate, t),
                droneRate: lerp(curr.droneRate, next.droneRate, t),
                boatRate: lerp(curr.boatRate, next.boatRate, t),
                powerupRate: lerp(curr.powerupRate, next.powerupRate, t),
                resourceRate: lerp(curr.resourceRate, next.resourceRate, t),
                scrollSpeedMult: lerp(curr.scrollSpeedMult, next.scrollSpeedMult, t),
                straitWidthMult: lerp(curr.straitWidthMult, next.straitWidthMult, t),
            };
        } else {
            this.currentPhase = CONFIG.DIFFICULTY[idx];
        }

        if (idx !== this.phaseIndex && idx > 0) {
            track('phase_reached', {
                phase: CONFIG.DIFFICULTY[idx].name,
                phase_index: idx,
                distance: Math.round(distance),
            });
        }
        this.phaseIndex = idx;
        this.phaseName = CONFIG.DIFFICULTY[idx].name;
    }

    getScrollSpeed() {
        return CONFIG.WORLD_SCROLL_BASE_SPEED * this.currentPhase.scrollSpeedMult;
    }

    getStraitHalfWidth() {
        return (CONFIG.STRAIT_WIDTH_START / 2) * this.currentPhase.straitWidthMult;
    }
}
