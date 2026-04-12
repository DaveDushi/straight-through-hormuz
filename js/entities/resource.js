import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';

const RESOURCE_COLORS = {
    repair: CONFIG.REPAIR_COLOR,
    fuel: CONFIG.FUEL_COLOR,
    radar: CONFIG.RADAR_COLOR,
};

const RESOURCE_LABELS = {
    repair: '+HP',
    fuel: 'FUEL',
    radar: 'SCAN',
};

export class Resource extends Entity {
    constructor() {
        super();
        this.type = 'resource';
        this.halfW = CONFIG.RESOURCE_SIZE / 2;
        this.halfH = CONFIG.RESOURCE_SIZE / 2;
        this.resourceType = 'repair';
        this.time = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        this.coreMesh = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.RESOURCE_SIZE, CONFIG.RESOURCE_SIZE * 0.7, CONFIG.RESOURCE_SIZE),
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x222222, shininess: 60 })
        );
        group.add(this.coreMesh);

        const glowGeo = new THREE.SphereGeometry(CONFIG.RESOURCE_SIZE * 0.9, 6, 6);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.BackSide
        });
        this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
        group.add(this.glowMesh);

        this._light = new THREE.PointLight(0xffffff, 0.5, 10);
        group.add(this._light);

        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z) {
        super.init(x, z);
        this.time = Math.random() * Math.PI * 2;
        const color = RESOURCE_COLORS[this.resourceType] || 0xffffff;
        this.coreMesh.material.color.setHex(color);
        this.coreMesh.material.emissive.set(
            ((color >> 16) & 0xff) / 255 * 0.4,
            ((color >> 8) & 0xff) / 255 * 0.4,
            (color & 0xff) / 255 * 0.4
        );
        this.glowMesh.material.color.setHex(color);
        this._light.color.setHex(color);
        this.mesh.position.set(x, 1, z);
    }

    update(delta, context) {
        this.time += delta;
        this.z -= context.scrollSpeed * delta;
        this.mesh.position.y = 1 + Math.sin(this.time * 3) * 0.3;
        this.mesh.rotation.y += delta * 1.5;
        this.syncMesh();
    }
}
