import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { getLabelSprite } from '../utils/shared-assets.js';

export class Blockade extends Entity {
    constructor() {
        super();
        this.type = 'blockade';
        this.halfW = 1;
        this.halfH = 1;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        // Main wall body — dimensions set in init()
        const wallGeo = new THREE.BoxGeometry(1, CONFIG.BLOCKADE_WALL_HEIGHT, 6);
        const wallMat = new THREE.MeshPhongMaterial({ color: CONFIG.BLOCKADE_COLOR, shininess: 40 });
        this._wallMesh = new THREE.Mesh(wallGeo, wallMat);
        this._wallMesh.position.y = CONFIG.BLOCKADE_WALL_HEIGHT / 2;
        group.add(this._wallMesh);

        // Red/white warning stripes on front face
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xcc2222 });
        for (let i = 0; i < 3; i++) {
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(1.02, 0.4, 0.1),
                stripeMat
            );
            stripe.position.set(0, 1 + i * 2.5, 3.05);
            group.add(stripe);
            this._stripes = this._stripes || [];
            this._stripes.push(stripe);
        }

        // Flashing warning light at passage edge
        this._light = new THREE.PointLight(0xff0000, 1, 15);
        this._light.position.set(0, CONFIG.BLOCKADE_WALL_HEIGHT + 1, 0);
        group.add(this._light);

        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z, wallWidth) {
        super.init(x, z);
        this.halfW = wallWidth / 2;
        this.halfH = 3; // z-depth half

        // Scale wall mesh to match width
        this._wallMesh.scale.x = wallWidth;
        for (const stripe of (this._stripes || [])) {
            stripe.scale.x = wallWidth;
        }

        this.mesh.position.set(x, 0, z);
    }

    update(delta, context) {
        // Flash warning light
        this._light.intensity = 0.5 + Math.sin(Date.now() * 0.006) * 0.5;
        this.syncMesh();
    }
}
