import * as THREE from 'three';
import { Entity } from '../entities/entity.js';

export class PortalEntity extends Entity {
    constructor(kind, color) {
        super();
        this.type = 'portal';
        this.portalKind = kind;
        this.halfW = 6;
        this.halfH = 6;
        this._color = color;
        this._time = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const torusGeo = new THREE.TorusGeometry(4, 0.5, 16, 48);
        const torusMat = new THREE.MeshPhongMaterial({
            color: this._color,
            emissive: this._color,
            emissiveIntensity: 0.6,
            shininess: 80,
        });
        this._torus = new THREE.Mesh(torusGeo, torusMat);
        this._torus.rotation.x = Math.PI / 2;
        group.add(this._torus);

        const diskGeo = new THREE.CircleGeometry(3.5, 32);
        this._diskMat = new THREE.MeshBasicMaterial({
            color: this._color,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
        });
        this._disk = new THREE.Mesh(diskGeo, this._diskMat);
        this._disk.rotation.x = Math.PI / 2;
        group.add(this._disk);

        this._light = new THREE.PointLight(this._color, 3, 30);
        this._light.position.set(0, 0, 0);
        group.add(this._light);

        this._label = this._createLabel(
            this.portalKind === 'exit' ? 'VIBE JAM PORTAL' : 'RETURN'
        );
        this._label.position.set(0, 6, 0);
        group.add(this._label);

        this.mesh = group;
    }

    _createLabel(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + this._color.toString(16).padStart(6, '0');
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(8, 2, 1);
        return sprite;
    }

    init(x, z, facingAngle) {
        this.x = x;
        this.z = z;
        this.active = true;
        this._time = 0;
        if (this.mesh) {
            this.mesh.position.set(x, 6, z);
            this.mesh.rotation.y = facingAngle || 0;
            this.mesh.visible = true;
        }
    }

    update(delta) {
        if (!this.active) return;
        this._time += delta;
        this._torus.rotation.z += delta * 1.5;
        this._diskMat.opacity = 0.3 + Math.sin(this._time * 3) * 0.15;
        this._light.intensity = 2.5 + Math.sin(this._time * 2.5) * 1.0;
        this.mesh.position.y = 6 + Math.sin(this._time * 1.5) * 0.5;
    }

    deactivate() {
        this.active = false;
        if (this.mesh) this.mesh.visible = false;
    }
}
