import { CONFIG } from '../config.js';

export class ScoringSystem {
    constructor() {
        this.score = 0;
        this.distance = 0;
        this.multiplier = 1;
        this.multiplierTimer = 0;
        this.nearMissCount = 0;
        this.tollsPaid = 0;
        this.tollsRefused = 0;
    }

    reset() {
        this.score = 0;
        this.distance = 0;
        this.multiplier = 1;
        this.multiplierTimer = 0;
        this.nearMissCount = 0;
        this.tollsPaid = 0;
        this.tollsRefused = 0;
    }

    update(delta, scrollSpeed, nearMisses) {
        const dist = scrollSpeed * delta * CONFIG.DISTANCE_MULTIPLIER;
        this.distance += dist;
        this.score += dist * CONFIG.SCORE_PER_METER * this.multiplier;

        if (this.multiplierTimer > 0) {
            this.multiplierTimer -= delta;
            if (this.multiplierTimer <= 0) {
                this.multiplier = 1;
            }
        }

        if (nearMisses && nearMisses.length > 0) {
            this.nearMissCount += nearMisses.length;
            this.multiplier = CONFIG.NEAR_MISS_MULTIPLIER;
            this.multiplierTimer = CONFIG.NEAR_MISS_DURATION;
        }
    }

    addScore(points) {
        this.score += points * this.multiplier;
    }

    getDisplayScore() {
        return Math.floor(this.score);
    }

    getDisplayDistance() {
        return Math.floor(this.distance);
    }
}
