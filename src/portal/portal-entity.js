import * as THREE from 'three';
import { Entity } from '../entities/entity.js';

const W = 10;
const H = 10;
const ARCH_THICK = 1.6;

export class PortalEntity extends Entity {
    constructor(kind, color) {
        super();
        this.type = 'portal';
        this.portalKind = kind;
        this.halfW = 8;
        this.halfH = 8;
        this._color = color;
        this._time = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        // Dark backing — the "hole" in the mountain
        const holeShape = new THREE.Shape();
        this._roundedRect(holeShape, -W / 2, 0, W, H, 2);
        const holeGeo = new THREE.ShapeGeometry(holeShape);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x050008, side: THREE.DoubleSide });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        group.add(hole);

        // Stone archway frame
        const outerShape = new THREE.Shape();
        this._roundedRect(outerShape, -W / 2 - ARCH_THICK, -ARCH_THICK, W + ARCH_THICK * 2, H + ARCH_THICK * 2, 3);
        const innerPath = new THREE.Path();
        this._roundedRect(innerPath, -W / 2, 0, W, H, 2);
        outerShape.holes.push(innerPath);
        const archGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 2, bevelEnabled: false });
        const archMat = new THREE.MeshPhongMaterial({ color: 0x5a4e3c, flatShading: true });
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.z = -1;
        group.add(arch);

        // Glowing edge — slightly smaller torus-like ring using a tube along the hole perimeter
        const edgeShape = new THREE.Shape();
        this._roundedRect(edgeShape, -W / 2 + 0.3, 0.3, W - 0.6, H - 0.6, 1.8);
        const edgePoints = edgeShape.getPoints(48);
        const edgeCurve = new THREE.CatmullRomCurve3(
            edgePoints.map(p => new THREE.Vector3(p.x, p.y, 0)), true
        );
        const edgeGeo = new THREE.TubeGeometry(edgeCurve, 48, 0.25, 8, true);
        this._edgeMat = new THREE.MeshBasicMaterial({
            color: this._color,
            transparent: true,
            opacity: 0.9,
        });
        const edge = new THREE.Mesh(edgeGeo, this._edgeMat);
        edge.position.z = 0.2;
        group.add(edge);

        // Swirling energy inside
        const vortexGeo = new THREE.PlaneGeometry(W - 1, H - 1);
        this._vortexMat = new THREE.MeshBasicMaterial({
            color: this._color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        });
        this._vortex = new THREE.Mesh(vortexGeo, this._vortexMat);
        this._vortex.position.set(0, H / 2, -0.5);
        group.add(this._vortex);

        // Lights
        this._innerLight = new THREE.PointLight(this._color, 4, 30);
        this._innerLight.position.set(0, H / 2, -2);
        group.add(this._innerLight);

        this._outerLight = new THREE.PointLight(this._color, 3, 40);
        this._outerLight.position.set(0, H / 2, 8);
        group.add(this._outerLight);

        // Label
        this._label = this._createLabel(
            this.portalKind === 'exit' ? 'VIBE JAM PORTAL' : 'RETURN PORTAL'
        );
        this._label.position.set(0, H + ARCH_THICK + 3, 2);
        group.add(this._label);

        // Arrow
        this._arrow = this._createLabel('\u25BC');
        this._arrow.position.set(0, H + ARCH_THICK + 0.5, 2);
        group.add(this._arrow);

        this.mesh = group;
    }

    _roundedRect(shape, x, y, w, h, r) {
        shape.moveTo(x + r, y);
        shape.lineTo(x + w - r, y);
        shape.quadraticCurveTo(x + w, y, x + w, y + r);
        shape.lineTo(x + w, y + h - r);
        shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        shape.lineTo(x + r, y + h);
        shape.quadraticCurveTo(x, y + h, x, y + h - r);
        shape.lineTo(x, y + r);
        shape.quadraticCurveTo(x, y, x + r, y);
    }

    _createLabel(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const hex = '#' + this._color.toString(16).padStart(6, '0');

        ctx.shadowColor = hex;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 55);

        ctx.shadowBlur = 0;
        ctx.fillStyle = hex;
        ctx.font = 'bold 44px monospace';
        ctx.fillText(text, 256, 55);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(14, 3.5, 1);
        return sprite;
    }

    init(x, z, facingAngle) {
        this.x = x;
        this.z = z;
        this.active = true;
        this._time = 0;
        if (this.mesh) {
            this.mesh.position.set(x, 0, z);
            this.mesh.rotation.y = facingAngle || 0;
            this.mesh.visible = true;
        }
    }

    update(delta) {
        if (!this.active) return;
        this._time += delta;

        this._vortexMat.opacity = 0.25 + Math.sin(this._time * 2.5) * 0.15;
        this._edgeMat.opacity = 0.7 + Math.sin(this._time * 3) * 0.3;
        this._innerLight.intensity = 3.5 + Math.sin(this._time * 3) * 1.5;
        this._outerLight.intensity = 2.5 + Math.sin(this._time * 2) * 1.0;
        this._arrow.position.y = H + ARCH_THICK + 0.5 + Math.sin(this._time * 3) * 0.5;
    }

    deactivate() {
        this.active = false;
        if (this.mesh) this.mesh.visible = false;
    }
}
