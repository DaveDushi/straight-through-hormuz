import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';

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

const POWERUP_ICONS = {
    flare: '* *',
    oilSlick: '~~~',
    ceasefire: 'PEACE',
};

function makeTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 40px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 256, 64);
    // fill
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(10, 2.5, 1);
    return sprite;
}

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

        this.coreMesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(CONFIG.POWERUP_SIZE / 2, 0),
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x444444, transparent: true, opacity: 0.9, shininess: 80 })
        );
        group.add(this.coreMesh);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(CONFIG.POWERUP_SIZE / 2 + 0.3, 0.12, 8, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        this.ringMesh = ring;

        const glowGeo = new THREE.SphereGeometry(CONFIG.POWERUP_SIZE, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.BackSide
        });
        this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
        group.add(this.glowMesh);

        this._light = new THREE.PointLight(0xffffff, 1, 18);
        this._light.position.y = 1;
        group.add(this._light);

        // Label sprite — will be set in init()
        this.labelSprite = makeTextSprite('POWER', '#ffffff');
        this.labelSprite.position.y = 6;
        group.add(this.labelSprite);

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

        // Update label
        const label = POWERUP_LABELS[this.powerupType] || 'POWER';
        this.mesh.remove(this.labelSprite);
        this.labelSprite = makeTextSprite(label, hexStr);
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
        // Keep label facing camera (sprites auto-face camera)
        this.syncMesh();
    }
}
