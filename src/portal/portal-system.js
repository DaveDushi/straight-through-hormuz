import { PortalParams } from './portal-params.js';
import { PortalEntity } from './portal-entity.js';
import { aabbOverlap } from '../utils/math-utils.js';

const ENABLED = true;
const EXIT_COLOR = 0x8800ff;
const START_COLOR = 0x00ddff;
const EXIT_Z_OFFSET = 120;
const START_Z_OFFSET = 30;
const DEACTIVATE_BEHIND = 40;
const PORTAL_ZONE_HALF_LENGTH = 15;
const PORTAL_EXTRA_WIDTH = 12;

export class PortalSystem {
    constructor() {
        this.params = null;
        this.exitPortal = null;
        this.startPortal = null;
        this._initialized = false;
        this._needsSpawn = true;
    }

    reset() {
        this._needsSpawn = true;
    }

    init(game) {
        if (!ENABLED) return;
        this.params = new PortalParams();

        this.exitPortal = new PortalEntity('exit', EXIT_COLOR);
        game.scene.add(this.exitPortal.mesh);
        this.exitPortal.mesh.visible = false;

        if (this.params.isPortalEntry && this.params.ref) {
            this.startPortal = new PortalEntity('start', START_COLOR);
            game.scene.add(this.startPortal.mesh);
            this.startPortal.mesh.visible = false;
        }

        if (this.params.isPortalEntry) {
            game.save.data.tutorialComplete = true;
            game._startGame();
            this._applyIncomingParams(game);
        }
    }

    update(delta, game) {
        if (!ENABLED || !this.params) return;
        if (!game.fsm.is('playing')) return;

        if (this._needsSpawn) {
            this._positionPortals(game);
            this._needsSpawn = false;
        }

        const tanker = game.tanker;

        for (const portal of [this.exitPortal, this.startPortal]) {
            if (!portal || !portal.active) continue;
            portal.update(delta);
            if (portal.z < tanker.z - DEACTIVATE_BEHIND) {
                portal.deactivate();
            } else if (this._tankerInsidePortal(tanker, portal)) {
                this._enterPortal(portal, game);
                return;
            }
        }
    }

    getExtraWidth(tankerZ) {
        if (!ENABLED) return 0;
        const portals = [this.exitPortal, this.startPortal];
        for (const p of portals) {
            if (p && p.active && Math.abs(tankerZ - p.z) < PORTAL_ZONE_HALF_LENGTH) {
                return PORTAL_EXTRA_WIDTH;
            }
        }
        return 0;
    }

    _positionPortals(game) {
        const tankerZ = game.tanker.z;
        const halfW = game.difficulty.getStraitHalfWidth(game.scoring.distance);

        // Push portal into the cliff so the tunnel mouth sits at the terrain edge
        this.exitPortal.init(halfW + 4, tankerZ + EXIT_Z_OFFSET, -Math.PI / 2);

        if (this.startPortal) {
            this.startPortal.init(-(halfW + 4), tankerZ + START_Z_OFFSET, Math.PI / 2);
        }
    }

    _tankerInsidePortal(tanker, portal) {
        const dx = Math.abs(tanker.x - portal.x);
        const dz = Math.abs(tanker.z - portal.z);
        return dx < portal.halfW + tanker.halfW && dz < portal.halfH + tanker.halfH;
    }

    _applyIncomingParams(game) {
        const p = this.params;
        const tanker = game.tanker;

        if (p.hp > 0) {
            tanker.hull = Math.round((p.hp / 100) * tanker.maxHull);
        }
        if (p.color) {
            const hex = parseInt(p.color.replace('#', ''), 16);
            if (!isNaN(hex)) tanker.bodyMat.color.setHex(hex);
        }
    }

    _enterPortal(portal, game) {
        let url;
        if (portal.portalKind === 'exit') {
            const scrollSpeed = game.difficulty.getScrollSpeed();
            url = this.params.buildExitUrl(game.tanker.hull, game.tanker.maxHull, scrollSpeed);
        } else {
            url = this.params.buildReturnUrl();
        }
        if (url) window.location.href = url;
    }
}
