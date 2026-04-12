const SAVE_KEY = 'strait_outta_hormuz_save';
const OLD_SAVE_KEYS = ['strait_through_hormuz_save', 'hormuz_rush_save'];

const DEFAULT_SAVE = {
    farthestDistance: 0,
    totalRuns: 0,
    upgrades: {},
    night: 1,
    currency: 0,
    tutorialComplete: false,
};

export class SaveManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            let raw = localStorage.getItem(SAVE_KEY);
            if (!raw) {
                for (const key of OLD_SAVE_KEYS) {
                    raw = localStorage.getItem(key);
                    if (raw) { localStorage.setItem(SAVE_KEY, raw); break; }
                }
            }
            if (raw) {
                return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
            }
        } catch (e) {}
        return { ...DEFAULT_SAVE };
    }

    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {}
    }

    addRun(score, distance) {
        this.data.totalRuns++;
        if (distance > this.data.farthestDistance) {
            this.data.farthestDistance = distance;
        }
        const earned = Math.floor(score * 0.1);
        this.data.currency += earned;
        this.save();
        return earned;
    }

    getUpgradeLevel(key) {
        return this.data.upgrades[key] || 0;
    }
}
