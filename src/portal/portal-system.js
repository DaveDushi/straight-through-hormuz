import { PortalParams } from './portal-params.js';
import { PortalEntity } from './portal-entity.js';
import { aabbOverlap } from '../utils/math-utils.js';

const ENABLED = true;
const EXIT_COLOR = 0x8800ff;
const START_COLOR = 0x00ddff;
const EXIT_Z_OFFSET = 120;
const START_Z_OFFSET = 30;
const PORTAL_Y = 6;
const DEACTIVATE_BEHIND = 40;

export class PortalSystem {
    constructor() {
        this.params = null;
        this.exitPortal = null;
        this.startPortal = null;
        this._initialized = false;
        this._positioned = false;
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

        if (!this._positioned) {
            this._positionPortals(game);
            this._positioned = true;
        }

        const tanker = game.tanker;

        if (this.exitPortal && this.exitPortal.active) {
            this.exitPortal.update(delta);
            if (this.exitPortal.z < tanker.z - DEACTIVATE_BEHIND) {
                this.exitPortal.deactivate();
            } else if (aabbOverlap(
                tanker.x, tanker.z, tanker.halfW, tanker.halfH,
                this.exitPortal.x, this.exitPortal.z, this.exitPortal.halfW, this.exitPortal.halfH
            )) {
                this._enterPortal(this.exitPortal, game);
                return;
            }
        }

        if (this.startPortal && this.startPortal.active) {
            this.startPortal.update(delta);
            if (this.startPortal.z < tanker.z - DEACTIVATE_BEHIND) {
                this.startPortal.deactivate();
            } else if (aabbOverlap(
                tanker.x, tanker.z, tanker.halfW, tanker.halfH,
                this.startPortal.x, this.startPortal.z, this.startPortal.halfW, this.startPortal.halfH
            )) {
                this._enterPortal(this.startPortal, game);
                return;
            }
        }
    }

    _positionPortals(game) {
        const tankerZ = game.tanker.z;
        const halfW = game.difficulty.getStraitHalfWidth();

        this.exitPortal.init(halfW, tankerZ + EXIT_Z_OFFSET, -Math.PI / 2);

        if (this.startPortal) {
            this.startPortal.init(-halfW, tankerZ + START_Z_OFFSET, Math.PI / 2);
        }
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
