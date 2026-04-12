import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';

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

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(CONFIG.MINE_RADIUS, 10, 10),
            new THREE.MeshPhongMaterial({ color: CONFIG.MINE_COLOR, emissive: 0x330000, shininess: 60 })
        );
        group.add(sphere);

        const spikeGeo = new THREE.ConeGeometry(0.2, 0.7, 5);
        const spikeMat = new THREE.MeshPhongMaterial({ color: CONFIG.MINE_SPIKE_COLOR, emissive: 0x881100 });
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

        const glowGeo = new THREE.SphereGeometry(CONFIG.MINE_RADIUS * 1.6, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff2200, transparent: true, opacity: 0.12, side: THREE.BackSide
        });
        group.add(new THREE.Mesh(glowGeo, glowMat));

        const light = new THREE.PointLight(0xff3300, 0.6, 12);
        light.position.y = 1;
        group.add(light);
        this._light = light;

        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z) {
        super.init(x, z);
        this.time = Math.random() * Math.PI * 2;
        this.baseY = 0.5;
        this.mesh.position.set(x, this.baseY, z);
    }

    update(delta, context) {
        this.time += delta * CONFIG.MINE_BOB_SPEED;
        this.z -= context.scrollSpeed * delta;
        this.mesh.position.y = this.baseY + Math.sin(this.time) * CONFIG.MINE_BOB_AMPLITUDE;
        this.mesh.rotation.y += delta * 0.8;
        if (this._light) {
            this._light.intensity = 0.4 + Math.sin(this.time * 3) * 0.3;
        }
        this.syncMesh();
    }
}
