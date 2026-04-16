import { CONFIG } from '../config.js';
import { lerp, noise2D } from '../utils/math-utils.js';
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

    // Distance from centerline (X=0) to the shore on the given side at worldZ.
    // Multi-octave fBm for a natural coastline with regional width trends,
    // medium-scale bays, and fine-grain irregularity. Both shores share the
    // large-scale width trend (so the strait as a whole narrows and widens)
    // but each side also has its own peninsulas/bays for asymmetric character.
    getShoreDistance(worldZ, side) {
        // Symmetric regional width trend (both shores move together)
        const big1 = noise2D(worldZ * 0.00045, 0);              // ~2200 wavelength
        const big2 = noise2D(worldZ * 0.0013,  0.31);           // ~770 wavelength
        const big3 = noise2D(worldZ * 0.0038,  0.73);           // ~260 wavelength
        let baseBlend = big1 * 0.55 + big2 * 0.3 + big3 * 0.15;

        // Guaranteed open opener so the run never starts in a pinch
        const startRamp = 600;
        if (worldZ < startRamp) {
            const t = Math.max(0, worldZ) / startRamp;
            baseBlend = lerp(0.85, baseBlend, t * t);
        }

        const baseHalfW = lerp(
            CONFIG.STRAIT_WIDTH_MIN / 2,
            CONFIG.STRAIT_WIDTH_START / 2,
            baseBlend,
        );

        // Side-specific coast shape (peninsulas and bays, uncorrelated between sides)
        const bay1 = (noise2D(worldZ * 0.0028, side * 51.7)  - 0.5) * 2; // ~360 wavelength
        const bay2 = (noise2D(worldZ * 0.0085, side * 77.3)  - 0.5) * 2; // ~120 wavelength
        const bay3 = (noise2D(worldZ * 0.022,  side * 137.1) - 0.5) * 2; // ~45 wavelength
        const asym = bay1 * 2.2 + bay2 * 1.3 + bay3 * 0.7;               // up to ~±4.2

        // Floor: shore cannot recede inside the terrain chunk's inner edge, or the
        // chunk would leave a visible gap between the rendered land and the water.
        const floor = (CONFIG.STRAIT_WIDTH_MIN / 2) - CONFIG.TERRAIN_OVERLAP + 1;
        return Math.max(floor, baseHalfW + asym);
    }

    // Narrowest shore of the two sides — the safe symmetric passage width.
    // Used by spawner/blockade/tutorial for any caller that needs a single value.
    getStraitHalfWidth(worldZ) {
        return Math.min(
            this.getShoreDistance(worldZ, -1),
            this.getShoreDistance(worldZ, 1),
        );
    }
}
