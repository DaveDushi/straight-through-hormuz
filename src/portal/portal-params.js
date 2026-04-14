export class PortalParams {
    constructor() {
        const params = new URLSearchParams(window.location.search);
        this.isPortalEntry = params.get('portal') === 'true';
        this.ref = params.get('ref') || '';
        this.username = params.get('username') || '';
        this.color = params.get('color') || '';
        this.speed = parseFloat(params.get('speed')) || 0;
        this.hp = parseFloat(params.get('hp')) || 0;
        this.avatarUrl = params.get('avatar_url') || '';
        this.team = params.get('team') || '';
        this.speedX = parseFloat(params.get('speed_x')) || 0;
        this.speedY = parseFloat(params.get('speed_y')) || 0;
        this.speedZ = parseFloat(params.get('speed_z')) || 0;
        this.rotationX = parseFloat(params.get('rotation_x')) || 0;
        this.rotationY = parseFloat(params.get('rotation_y')) || 0;
        this.rotationZ = parseFloat(params.get('rotation_z')) || 0;
        this._raw = Object.fromEntries(params.entries());
    }

    buildExitUrl(tankerHull, maxHull, scrollSpeed) {
        const base = 'https://vibejam.cc/portal/2026';
        const p = new URLSearchParams();
        p.set('ref', window.location.origin + window.location.pathname);
        p.set('hp', String(Math.round((tankerHull / maxHull) * 100)));
        p.set('speed', String(Math.round(scrollSpeed)));
        p.set('username', this.username || 'Captain');
        return `${base}?${p.toString()}`;
    }

    buildReturnUrl() {
        if (!this.ref) return null;
        const url = new URL(this.ref);
        for (const [key, val] of Object.entries(this._raw)) {
            if (key !== 'portal') url.searchParams.set(key, val);
        }
        url.searchParams.set('portal', 'true');
        return url.toString();
    }
}
