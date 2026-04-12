import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { getGeometry, getMaterial } from '../utils/shared-assets.js';

export class Projectile extends Entity {
    constructor() {
        super();
        this.type = 'projectile';
        this.halfW = CONFIG.PROJECTILE_RADIUS;
        this.halfH = CONFIG.PROJECTILE_RADIUS;
        this.vx = 0;
        this.vz = 0;
        this.damage = CONFIG.DRONE_BOMB_DAMAGE;
        this._buildMesh();
    }

    _buildMesh() {
        const geo = getGeometry('projectile', () =>
            new THREE.SphereGeometry(CONFIG.PROJECTILE_RADIUS, 6, 6)
        );
        const mat = getMaterial('projectile', () =>
            new THREE.MeshBasicMaterial({ color: CONFIG.PROJECTILE_COLOR })
        );
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.visible = false;
    }

    init(x, z, vx, vz, damage) {
        super.init(x, z);
        this.vx = vx || 0;
        this.vz = vz || 0;
        this.damage = damage || CONFIG.DRONE_BOMB_DAMAGE;
        this.mesh.position.set(x, 2, z);
    }

    update(delta, context) {
        this.x += this.vx * delta;
        this.z += this.vz * delta - context.scrollSpeed * delta;
        this.mesh.position.y = Math.max(0.5, this.mesh.position.y - delta * 3);
        this.syncMesh();
    }
}
