import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { clamp, lerp } from '../utils/math-utils.js';

export class FastBoat extends Entity {
    constructor() {
        super();
        this.type = 'boat';
        this.halfW = CONFIG.BOAT_WIDTH / 2;
        this.halfH = CONFIG.BOAT_LENGTH / 2;
        this.approachSide = 1;
        this.targetX = 0;
        this.fireTimer = 0;
        this.retreating = false;
        this.frozen = false;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const hull = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.BOAT_WIDTH, 0.8, CONFIG.BOAT_LENGTH),
            new THREE.MeshPhongMaterial({ color: CONFIG.BOAT_COLOR })
        );
        hull.position.y = 0.4;
        group.add(hull);

        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.BOAT_WIDTH * 0.5, 0.6, CONFIG.BOAT_LENGTH * 0.3),
            new THREE.MeshPhongMaterial({ color: 0x3a4a3a })
        );
        cabin.position.set(0, 1, -CONFIG.BOAT_LENGTH * 0.2);
        group.add(cabin);

        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z) {
        super.init(x, z);
        this.fireTimer = CONFIG.BOAT_FIRE_INTERVAL * (0.5 + Math.random() * 0.5);
        this.retreating = false;
        this.frozen = false;
    }

    update(delta, context) {
        if (this.frozen) {
            this.z -= context.scrollSpeed * delta * 0.3;
            this.syncMesh();
            return;
        }

        if (this.retreating) {
            this.x += this.approachSide * CONFIG.BOAT_SPEED * delta;
            this.z -= context.scrollSpeed * delta;
            this.syncMesh();
            return;
        }

        const dx = this.targetX - this.x;
        this.x += clamp(dx, -CONFIG.BOAT_SPEED * delta, CONFIG.BOAT_SPEED * delta);

        const zigzag = Math.sin(Date.now() * 0.003 + this.x) * 3 * delta;
        this.x += zigzag;

        this.z -= context.scrollSpeed * delta * 0.3;

        this.fireTimer -= delta;
        if (this.fireTimer <= 0) {
            this.fireTimer = CONFIG.BOAT_FIRE_INTERVAL;
            if (context.spawnProjectile) {
                const dirZ = context.tankerZ - this.z;
                const dirX = context.tankerX - this.x;
                const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
                context.spawnProjectile(
                    this.x, this.z,
                    (dirX / len) * CONFIG.BOAT_ROCKET_SPEED,
                    (dirZ / len) * CONFIG.BOAT_ROCKET_SPEED,
                    CONFIG.BOAT_ROCKET_DAMAGE
                );
            }
        }

        this.mesh.rotation.y = Math.atan2(this.targetX - this.x, 1) * 0.3;
        this.syncMesh();
    }
}
