import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { getGeometry, getMaterial, getLabelSprite } from '../utils/shared-assets.js';

const POWERUP_COLORS = {
    flare: CONFIG.FLARE_COLOR,
    oilSlick: CONFIG.OIL_SLICK_COLOR,
    ceasefire: CONFIG.CEASEFIRE_COLOR,
};

const POWERUP_LABELS = {
    flare: 'FLARE',
    oilSlick: 'OIL SLICK',
    ceasefire: 'CEASEFIRE',
};

export class Powerup extends Entity {
    constructor() {
        super();
        this.type = 'powerup';
        this.halfW = CONFIG.POWERUP_SIZE / 2;
        this.halfH = CONFIG.POWERUP_SIZE / 2;
        this.powerupType = 'flare';
        this.time = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const coreGeo = getGeometry('powerup-core', () =>
            new THREE.OctahedronGeometry(CONFIG.POWERUP_SIZE / 2, 0)
        );
        // Each powerup instance needs own material for per-instance color
        this.coreMesh = new THREE.Mesh(
            coreGeo,
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x444444, transparent: true, opacity: 0.9, shininess: 80 })
        );
        group.add(this.coreMesh);

        const ringGeo = getGeometry('powerup-ring', () =>
            new THREE.TorusGeometry(CONFIG.POWERUP_SIZE / 2 + 0.3, 0.12, 8, 20)
        );
        this.ringMesh = new THREE.Mesh(
            ringGeo,
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
        );
        this.ringMesh.rotation.x = Math.PI / 2;
        group.add(this.ringMesh);

        const glowGeo = getGeometry('powerup-glow', () =>
            new THREE.SphereGeometry(CONFIG.POWERUP_SIZE, 8, 8)
        );
        this.glowMesh = new THREE.Mesh(
            glowGeo,
            new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.BackSide
            })
        );
        group.add(this.glowMesh);

        // Keep powerup PointLight (max 5 in pool — visual pop justified)
        this._light = new THREE.PointLight(0xffffff, 1, 18);
        this._light.position.y = 1;
        group.add(this._light);

        // Placeholder sprite — will be swapped in init()
        this.labelSprite = null;

        this.mesh = group;
        this.mesh.visible = false;
    }

    init(x, z) {
        super.init(x, z);
        this.time = Math.random() * Math.PI * 2;
        const color = POWERUP_COLORS[this.powerupType] || 0xffffff;
        const hexStr = '#' + color.toString(16).padStart(6, '0');
        this.coreMesh.material.color.setHex(color);
        this.coreMesh.material.emissive.set(
            ((color >> 16) & 0xff) / 255 * 0.5,
            ((color >> 8) & 0xff) / 255 * 0.5,
            (color & 0xff) / 255 * 0.5
        );
        this.ringMesh.material.color.setHex(color);
        this.glowMesh.material.color.setHex(color);
        this._light.color.setHex(color);

        // Swap label sprite using cached textures (no leak)
        const label = POWERUP_LABELS[this.powerupType] || 'POWER';
        if (this.labelSprite) {
            this.mesh.remove(this.labelSprite);
        }
        this.labelSprite = getLabelSprite(label, hexStr);
        this.labelSprite.position.y = 6;
        this.mesh.add(this.labelSprite);

        this.mesh.position.set(x, 2, z);
    }

    update(delta, context) {
        this.time += delta;
        this.z -= context.scrollSpeed * delta;
        this.mesh.position.y = 2 + Math.sin(this.time * CONFIG.POWERUP_BOB_SPEED) * CONFIG.POWERUP_BOB_AMPLITUDE;
        this.mesh.rotation.y += delta * CONFIG.POWERUP_ROTATE_SPEED;
        this.glowMesh.material.opacity = 0.06 + Math.sin(this.time * 4) * 0.04;
        this._light.intensity = 0.6 + Math.sin(this.time * 3) * 0.4;
        this.syncMesh();
    }
}
