const SETTINGS_KEY = 'soh_settings';
const OLD_SOUND_KEY = 'soh_sound';

const SETTINGS_VERSION = 2;

const DEFAULTS = {
    sound: true,
    powerupPosition: 'center',
    boostButtons: 'both',
    version: SETTINGS_VERSION,
};

export class SettingsManager {
    constructor() {
        const { data, migrated } = this._load();
        this.data = data;
        if (migrated) this._save();
        this.applyLayout();
    }

    _load() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const data = { ...DEFAULTS, ...JSON.parse(raw) };
                let migrated = false;
                if (data.powerupPosition === 'default') {
                    data.powerupPosition = 'center';
                    migrated = true;
                }
                if ((data.version || 1) < 2) {
                    data.powerupPosition = 'center';
                    data.version = SETTINGS_VERSION;
                    migrated = true;
                }
                return { data, migrated };
            }
        } catch {}
        const data = { ...DEFAULTS };
        try {
            const oldSound = localStorage.getItem(OLD_SOUND_KEY);
            if (oldSound === 'off') data.sound = false;
        } catch {}
        return { data, migrated: false };
    }

    _save() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.data));
            localStorage.setItem(OLD_SOUND_KEY, this.data.sound ? 'on' : 'off');
        } catch {}
    }

    get sound() { return this.data.sound; }
    set sound(val) {
        this.data.sound = val;
        this._save();
    }

    get powerupPosition() { return this.data.powerupPosition; }
    set powerupPosition(val) {
        this.data.powerupPosition = val;
        this._save();
        this.applyLayout();
    }

    get boostButtons() { return this.data.boostButtons; }
    set boostButtons(val) {
        this.data.boostButtons = val;
        this._save();
        this.applyLayout();
    }

    applyLayout() {
        const cl = document.body.classList;
        cl.remove('powerup-left', 'powerup-right', 'boost-left-only', 'boost-right-only');
        if (this.data.powerupPosition === 'left') cl.add('powerup-left');
        else if (this.data.powerupPosition === 'right') cl.add('powerup-right');
        if (this.data.boostButtons === 'left') cl.add('boost-left-only');
        else if (this.data.boostButtons === 'right') cl.add('boost-right-only');
    }
}
