import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { getGeometry, getMaterial } from '../utils/shared-assets.js';

export class Mine extends Entity {
    constructor() {
        super();
        this.type = 'mine';
        this.halfW = CONFIG.MINE_RADIUS;
        this.halfH = CONFIG.MINE_RADIUS;
        this.baseY = 0;
        this.time = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const sphereGeo = getGeometry('mine-body', () =>
            new THREE.SphereGeometry(CONFIG.MINE_RADIUS, 10, 10)
        );
        const sphereMat = getMaterial('mine-body', () =>
            new THREE.MeshPhongMaterial({ color: CONFIG.MINE_COLOR, emissive: 0x330000, shininess: 60 })
        );
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        group.add(sphere);

        const spikeGeo = getGeometry('mine-spike', () =>
            new THREE.ConeGeometry(0.2, 0.7, 5)
        );
        const spikeMat = getMaterial('mine-spike', () =>
            new THREE.MeshPhongMaterial({ color: CONFIG.MINE_SPIKE_COLOR, emissive: 0x881100 })
        );
        const dirs = [
            [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
            [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7],
            [0.7, -0.7, 0], [-0.7, -0.7, 0],
        ];
        for (const [dx, dy, dz] of dirs) {
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(dx * CONFIG.MINE_RADIUS, dy * CONFIG.MINE_RADIUS, dz * CONFIG.MINE_RADIUS);
            spike.lookAt(dx * 2, dy * 2, dz * 2);
            group.add(spike);
        }

        const glowGeo = getGeometry('mine-glow', () =>
            new THREE.SphereGeometry(CONFIG.MINE_RADIUS * 1.6, 8, 8)
        );
        const glowMat = getMaterial('mine-glow', () =>
            new THREE.MeshBasicMaterial({
                color: 0xff2200, transparent: true, opacity: 0.12, side: THREE.BackSide
            })
        );
        this._glowMesh = new THREE.Mesh(glowGeo, glowMat.clone());
        group.add(this._glowMesh);

        // PointLight REMOVED — glow sphere is sufficient visual cue

        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z) {
        super.init(x, z);
        this.time = Math.random() * Math.PI * 2;
        this.baseY = 0.5;
        this.mesh.position.set(x, this.baseY, z);
        this.mesh.scale.setScalar(CONFIG.isMobile ? CONFIG.MOBILE_ENTITY_SCALE : 1);
    }

    update(delta, context) {
        this.time += delta * CONFIG.MINE_BOB_SPEED;
        this.mesh.position.y = this.baseY + Math.sin(this.time) * CONFIG.MINE_BOB_AMPLITUDE;
        this.mesh.rotation.y += delta * 0.8;
        // Pulsing glow via opacity
        if (this._glowMesh) {
            this._glowMesh.material.opacity = 0.08 + Math.sin(this.time * 3) * 0.06;
        }
        this.syncMesh();
    }
}
