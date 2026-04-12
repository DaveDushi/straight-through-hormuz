const SAVE_KEY = 'strait_through_hormuz_save';
const OLD_SAVE_KEY = 'hormuz_rush_save';

const DEFAULT_SAVE = {
    highScore: 0,
    totalRuns: 0,
    upgrades: {},
    night: 1,
    currency: 0,
};

export class SaveManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            let raw = localStorage.getItem(SAVE_KEY);
            if (!raw) {
                raw = localStorage.getItem(OLD_SAVE_KEY);
                if (raw) localStorage.setItem(SAVE_KEY, raw);
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
        if (score > this.data.highScore) {
            this.data.highScore = score;
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
