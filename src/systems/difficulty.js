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
    // One dominant low-frequency noise drives the primary width, stretched so
    // it actually reaches both extremes (averaging multiple noises flattens
    // toward the midpoint via CLT — we deliberately avoid that here). A choke
    // modulator pinches the strait sporadically, and per-side bays/peninsulas
    // add natural coastal irregularity without cancelling the main pulse.
    getShoreDistance(worldZ, side) {
        // Primary width pulse — single octave, ~500-unit wavelength. At base
        // scroll speed that's a ~25s cycle, so the player reads the wide↔narrow
        // sweep as distinct "acts" during the run.
        const primary = noise2D(worldZ * 0.002, 0);                  // 0..1
        // Stretch toward extremes: map to a contrasted curve so the primary
        // actually hits ~0 and ~1 instead of lingering near 0.5.
        const stretched = Math.max(0, Math.min(1, (primary - 0.5) * 1.8 + 0.5));

        // Sporadic choke — occasional dramatic pinches on top of the main pulse.
        const choke = noise2D(worldZ * 0.006, 17.5);                 // 0..1
        const chokeBias = choke < 0.35 ? (choke - 0.35) * 1.2 : 0;   // negative pulses only

        let blend = Math.max(0, Math.min(1, stretched + chokeBias));

        // Guaranteed open opener so the run never starts in a pinch
        const startRamp = 400;
        if (worldZ < startRamp) {
            const t = Math.max(0, worldZ) / startRamp;
            blend = lerp(0.9, blend, t * t);
        }

        const baseHalfW = lerp(
            CONFIG.STRAIT_WIDTH_MIN / 2,
            CONFIG.STRAIT_WIDTH_START / 2,
            blend,
        );

        // Side-specific peninsulas and bays for organic coast shape. These add
        // ±~8 units of per-side wiggle but don't average away the main pulse.
        const bay1 = (noise2D(worldZ * 0.004,  side * 51.7)  - 0.5) * 2; // ~250 wavelength
        const bay2 = (noise2D(worldZ * 0.014,  side * 77.3)  - 0.5) * 2; // ~70 wavelength
        const bay3 = (noise2D(worldZ * 0.035,  side * 137.1) - 0.5) * 2; // ~28 wavelength
        const asym = bay1 * 4.5 + bay2 * 2.5 + bay3 * 1.2;              // up to ~±8.2

        const floor = CONFIG.STRAIT_WIDTH_MIN / 2;
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
