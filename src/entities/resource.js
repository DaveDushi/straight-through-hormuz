import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { getGeometry, getMaterial, getLabelSprite } from '../utils/shared-assets.js';

const RESOURCE_COLORS = {
    repair: CONFIG.REPAIR_COLOR,
    fuel: CONFIG.FUEL_COLOR,
    laser: CONFIG.LASER_BUFF_COLOR,
};

const RESOURCE_LABELS = {
    repair: 'REPAIR',
    fuel: 'FUEL',
    laser: 'LASER',
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

        this._repairMesh = this._buildRepairCross();
        this._repairMesh.visible = false;
        group.add(this._repairMesh);

        this._fuelMesh = this._buildFuelCan();
        this._fuelMesh.visible = false;
        group.add(this._fuelMesh);

        this._laserMesh = this._buildLaserEmitter();
        this._laserMesh.visible = false;
        group.add(this._laserMesh);

        this._light = new THREE.PointLight(0xffffff, 0.8, 15);
        this._light.position.y = 1;
        group.add(this._light);

        this.labelSprite = null;
        this.mesh = group;
        this.mesh.visible = false;
    }

    _buildRepairCross() {
        const cross = new THREE.Group();
        const s = CONFIG.RESOURCE_SIZE;

        const mat = new THREE.MeshPhongMaterial({
            color: 0x44ff44, emissive: 0x115511, shininess: 60
        });

        const hBar = new THREE.Mesh(
            getGeometry('repair-hbar', () => new THREE.BoxGeometry(s * 0.8, s * 0.25, s * 0.25)),
            mat
        );
        cross.add(hBar);

        const vBar = new THREE.Mesh(
            getGeometry('repair-vbar', () => new THREE.BoxGeometry(s * 0.25, s * 0.8, s * 0.25)),
            mat
        );
        cross.add(vBar);

        const backGeo = getGeometry('repair-back', () =>
            new THREE.BoxGeometry(s * 0.9, s * 0.9, s * 0.08)
        );
        const backMat = getMaterial('repair-back-mat', () =>
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x114411, transparent: true, opacity: 0.5 })
        );
        const back = new THREE.Mesh(backGeo, backMat);
        back.position.z = -s * 0.12;
        cross.add(back);

        return cross;
    }

    _buildFuelCan() {
        const can = new THREE.Group();
        const s = CONFIG.RESOURCE_SIZE;

        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0xffaa22, emissive: 0x442200, shininess: 50
        });

        const bodyGeo = getGeometry('fuel-body', () =>
            new THREE.BoxGeometry(s * 0.5, s * 0.7, s * 0.35)
        );
        can.add(new THREE.Mesh(bodyGeo, bodyMat));

        const handleMat = getMaterial('fuel-handle', () =>
            new THREE.MeshPhongMaterial({ color: 0x886622 })
        );
        const handleGeo = getGeometry('fuel-handle', () =>
            new THREE.TorusGeometry(s * 0.12, 0.03, 6, 8, Math.PI)
        );
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(0, s * 0.38, 0);
        handle.rotation.x = Math.PI;
        can.add(handle);

        const spoutGeo = getGeometry('fuel-spout', () =>
            new THREE.CylinderGeometry(0.04, 0.06, s * 0.25, 6)
        );
        const spout = new THREE.Mesh(spoutGeo, handleMat);
        spout.position.set(s * 0.18, s * 0.42, 0);
        spout.rotation.z = -0.4;
        can.add(spout);

        return can;
    }

    _buildLaserEmitter() {
        const emitter = new THREE.Group();
        const s = CONFIG.RESOURCE_SIZE;

        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0xcc2222, emissive: 0x441111, shininess: 80
        });

        const bodyGeo = getGeometry('laser-body', () =>
            new THREE.CylinderGeometry(s * 0.2, s * 0.25, s * 0.6, 8)
        );
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        emitter.add(body);

        const tipGeo = getGeometry('laser-tip', () =>
            new THREE.ConeGeometry(s * 0.18, s * 0.35, 8)
        );
        const tipMat = new THREE.MeshPhongMaterial({
            color: 0xff4444, emissive: 0x662222, shininess: 100
        });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.rotation.x = -Math.PI / 2;
        tip.position.z = s * 0.47;
        emitter.add(tip);

        const lensGeo = getGeometry('laser-lens', () =>
            new THREE.SphereGeometry(s * 0.08, 8, 8)
        );
        const lensMat = new THREE.MeshBasicMaterial({
            color: 0xff6666, transparent: true, opacity: 0.8
        });
        this._laserLens = new THREE.Mesh(lensGeo, lensMat);
        this._laserLens.position.z = s * 0.65;
        emitter.add(this._laserLens);

        const ringGeo = getGeometry('laser-ring', () =>
            new THREE.TorusGeometry(s * 0.22, 0.03, 6, 12)
        );
        const ringMat = getMaterial('laser-ring-mat', () =>
            new THREE.MeshPhongMaterial({ color: 0x444444 })
        );
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.z = s * 0.15;
        emitter.add(ring);

        return emitter;
    }

    init(x, z) {
        super.init(x, z);
        this.time = Math.random() * Math.PI * 2;

        this._repairMesh.visible = (this.resourceType === 'repair');
        this._fuelMesh.visible = (this.resourceType === 'fuel');
        this._laserMesh.visible = (this.resourceType === 'laser');

        const color = RESOURCE_COLORS[this.resourceType] || 0xffffff;
        const hexStr = '#' + color.toString(16).padStart(6, '0');
        this._light.color.setHex(color);

        const label = RESOURCE_LABELS[this.resourceType] || 'ITEM';
        if (this.labelSprite) {
            this.mesh.remove(this.labelSprite);
        }
        this.labelSprite = getLabelSprite(label, hexStr);
        this.labelSprite.position.y = 4;
        this.mesh.add(this.labelSprite);

        this.mesh.position.set(x, 1, z);
        this.mesh.scale.setScalar(CONFIG.isMobile ? CONFIG.MOBILE_ENTITY_SCALE : 1);
    }

    update(delta, context) {
        this.time += delta;
        this.mesh.position.y = 1 + Math.sin(this.time * 3) * 0.3;
        this.mesh.rotation.y += delta * 1.5;
        this._light.intensity = 0.5 + Math.sin(this.time * 3) * 0.3;
        this.syncMesh();
    }
}
