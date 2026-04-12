import { CONFIG } from '../config.js';
import { aabbOverlap } from '../utils/math-utils.js';

export class BlockadeSystem {
    constructor() {
        this.pending = [];
        this.activeWalls = [];
        this.warned = new Set();
    }

    reset() {
        this.pending = [];
        this.activeWalls = [];
        this.warned = new Set();
    }

    scheduleTollBlockade(tankerZ, straitHalfWidth) {
        const triggerZ = tankerZ + CONFIG.BLOCKADE_DISTANCE_AFTER_TOLL;
        this.pending.push({ triggerZ, straitHalfWidth });
    }

    update(tankerZ, blockadePool, scene, radio, audio) {
        // Spawn pending blockades when tanker approaches
        for (let i = this.pending.length - 1; i >= 0; i--) {
            const p = this.pending[i];

            // Radio warning ~120 units before blockade
            if (!this.warned.has(i) && tankerZ > p.triggerZ - 120) {
                this.warned.add(i);
                radio.showCustom('COMMAND', 'USA naval blockade ahead! Navigate through the gap!', audio);
            }

            if (tankerZ > p.triggerZ - CONFIG.SPAWN_Z) {
                this._spawnBlockade(p, blockadePool, scene);
                this.pending.splice(i, 1);
            }
        }
    }

    _spawnBlockade(pending, blockadePool, scene) {
        const hw = pending.straitHalfWidth;
        const passageHalf = CONFIG.BLOCKADE_PASSAGE_WIDTH / 2;
        const z = pending.triggerZ;

        // Left wall: from -hw to -passageHalf
        const leftWidth = hw - passageHalf;
        const leftX = -(passageHalf + leftWidth / 2);
        const left = blockadePool.acquire();
        if (left) {
            left.init(leftX, z, leftWidth);
            if (!left.mesh.parent) scene.add(left.mesh);
            this.activeWalls.push(left);
        }

        // Right wall: from +passageHalf to +hw
        const rightWidth = hw - passageHalf;
        const rightX = passageHalf + rightWidth / 2;
        const right = blockadePool.acquire();
        if (right) {
            right.init(rightX, z, rightWidth);
            if (!right.mesh.parent) scene.add(right.mesh);
            this.activeWalls.push(right);
        }
    }

    checkCollision(tanker) {
        for (const wall of this.activeWalls) {
            if (!wall.active) continue;
            if (aabbOverlap(
                tanker.x, tanker.z, tanker.halfW, tanker.halfH,
                wall.x, wall.z, wall.halfW, wall.halfH
            )) {
                return true;
            }
        }
        return false;
    }
}
