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
        this.laserEvaluated = false;
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
        this.laserEvaluated = false;
        this.mesh.position.set(x, CONFIG.DRONE_ALTITUDE, z);
        this.mesh.scale.setScalar(CONFIG.isMobile ? CONFIG.MOBILE_ENTITY_SCALE : 1);
    }

    update(delta, context) {
        const dx = context.tankerX - this.x;
        const dz = context.tankerZ - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 1;

        const speed = CONFIG.DRONE_SPEED;
        this.x += (dx / dist) * speed * delta;
        this.z += (dz / dist) * speed * delta;

        // Dive toward deck level when close
        let targetY = CONFIG.DRONE_ALTITUDE;
        if (dist < CONFIG.DRONE_DIVE_RANGE) {
            const t = 1 - dist / CONFIG.DRONE_DIVE_RANGE;
            targetY = CONFIG.DRONE_ALTITUDE - (CONFIG.DRONE_ALTITUDE - 2) * t;
        }
        this.mesh.position.y = targetY + Math.sin(Date.now() * 0.003) * 0.3;

        // Tilt toward target
        this.mesh.rotation.z = clamp(dx * 0.05, -0.4, 0.4);

        this.syncMesh();
    }
}
