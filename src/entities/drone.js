import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { clamp } from '../utils/math-utils.js';
import { getGeometry, getMaterial } from '../utils/shared-assets.js';

export class Drone extends Entity {
    constructor() {
        super();
        this.type = 'drone';
        this.halfW = CONFIG.DRONE_SIZE / 2;
        this.halfH = CONFIG.DRONE_SIZE / 2;
        this.bombTimer = 0;
        this.frozen = false;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const bodyGeo = getGeometry('drone-body', () =>
            new THREE.BoxGeometry(CONFIG.DRONE_SIZE, 0.3, CONFIG.DRONE_SIZE * 0.6)
        );
        const bodyMat = getMaterial('drone-body', () =>
            new THREE.MeshPhongMaterial({ color: CONFIG.DRONE_COLOR })
        );
        group.add(new THREE.Mesh(bodyGeo, bodyMat));

        const wingGeo = getGeometry('drone-wing', () =>
            new THREE.BoxGeometry(CONFIG.DRONE_SIZE * 1.8, 0.05, CONFIG.DRONE_SIZE * 0.3)
        );
        const wingMat = getMaterial('drone-wing', () =>
            new THREE.MeshPhongMaterial({ color: 0x888888 })
        );
        group.add(new THREE.Mesh(wingGeo, wingMat));

        const ledGeo = getGeometry('drone-led', () =>
            new THREE.SphereGeometry(0.1, 4, 4)
        );
        const ledMat = getMaterial('drone-led', () =>
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, 0.2, CONFIG.DRONE_SIZE * 0.3);
        group.add(led);

        group.position.y = CONFIG.DRONE_ALTITUDE;
        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z) {
        super.init(x, z);
        this.bombTimer = CONFIG.DRONE_BOMB_INTERVAL * (0.5 + Math.random() * 0.5);
        this.frozen = false;
        this.mesh.position.set(x, CONFIG.DRONE_ALTITUDE, z);
    }

    update(delta, context) {
        if (this.frozen) {
            // Frozen drones stop — tanker sails past them
            this.syncMesh();
            this.mesh.position.y = CONFIG.DRONE_ALTITUDE;
            return;
        }

        const dx = context.tankerX - this.x;
        this.x += clamp(dx * CONFIG.DRONE_HOMING_STRENGTH, -CONFIG.DRONE_SPEED, CONFIG.DRONE_SPEED) * delta;
        // Drones fly forward at half the tanker's speed — tanker overtakes them
        this.z += context.scrollSpeed * 0.5 * delta;

        this.bombTimer -= delta;
        if (this.bombTimer <= 0) {
            this.bombTimer = CONFIG.DRONE_BOMB_INTERVAL;
            if (context.spawnProjectile) {
                context.spawnProjectile(this.x, this.z, 0, -CONFIG.BOAT_ROCKET_SPEED * 0.5, CONFIG.DRONE_BOMB_DAMAGE);
            }
        }

        this.mesh.position.y = CONFIG.DRONE_ALTITUDE + Math.sin(Date.now() * 0.003) * 0.3;
        this.syncMesh();
    }
}
