import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Entity } from './entity.js';
import { getGeometry, getMaterial, getLabelSprite } from '../utils/shared-assets.js';

const POWERUP_COLORS = {
    oil: CONFIG.OIL_BOOST_COLOR,
    ceasefire: CONFIG.CEASEFIRE_COLOR,
    pakFlag: CONFIG.PAK_FLAG_COLOR,
};

const POWERUP_LABELS = {
    oil: 'OIL',
    ceasefire: 'CEASEFIRE',
    pakFlag: 'PAKISTANI FLAG',
};

export class Powerup extends Entity {
    constructor() {
        super();
        this.type = 'powerup';
        this.halfW = CONFIG.POWERUP_SIZE / 2;
        this.halfH = CONFIG.POWERUP_SIZE / 2;
        this.powerupType = 'oil';
        this.time = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        this._oilBarrel = this._buildOilBarrel();
        this._oilBarrel.visible = false;
        group.add(this._oilBarrel);

        this._ceasefireMesh = this._buildCeasefire();
        this._ceasefireMesh.visible = false;
        group.add(this._ceasefireMesh);

        this._pakFlagMesh = this._buildPakFlag();
        this._pakFlagMesh.visible = false;
        group.add(this._pakFlagMesh);

        this._light = new THREE.PointLight(0xffffff, 2.0, 40);
        this._light.position.y = 1;
        group.add(this._light);

        this.labelSprite = null;
        this.mesh = group;
        this.mesh.visible = false;
    }

    _buildOilBarrel() {
        const barrel = new THREE.Group();
        const s = CONFIG.POWERUP_SIZE;

        const bodyGeo = getGeometry('oil-body', () =>
            new THREE.CylinderGeometry(s * 0.4, s * 0.4, s * 0.9, 12)
        );
        this._oilBodyMat = new THREE.MeshPhongMaterial({
            color: 0xCC8800, emissive: 0x442200, shininess: 60
        });
        barrel.add(new THREE.Mesh(bodyGeo, this._oilBodyMat));

        const rimGeo = getGeometry('oil-rim', () =>
            new THREE.CylinderGeometry(s * 0.42, s * 0.42, s * 0.06, 12)
        );
        const rimMat = getMaterial('oil-rim-mat', () =>
            new THREE.MeshPhongMaterial({ color: 0x886622 })
        );
        const topRim = new THREE.Mesh(rimGeo, rimMat);
        topRim.position.y = s * 0.44;
        barrel.add(topRim);
        const botRim = new THREE.Mesh(rimGeo, rimMat);
        botRim.position.y = -s * 0.44;
        barrel.add(botRim);

        const bandGeo = getGeometry('oil-band', () =>
            new THREE.TorusGeometry(s * 0.41, 0.04, 6, 16)
        );
        const bandMat = getMaterial('oil-band-mat', () =>
            new THREE.MeshPhongMaterial({ color: 0x664400 })
        );
        for (const yOff of [-s * 0.2, s * 0.2]) {
            const band = new THREE.Mesh(bandGeo, bandMat);
            band.rotation.x = Math.PI / 2;
            band.position.y = yOff;
            barrel.add(band);
        }

        return barrel;
    }

    _buildCeasefire() {
        const group = new THREE.Group();
        const s = CONFIG.POWERUP_SIZE;

        const flagGeo = getGeometry('cf-flag', () =>
            new THREE.PlaneGeometry(s * 1.2, s * 0.85)
        );
        const flagMat = new THREE.MeshPhongMaterial({
            color: 0xFFFFF0, emissive: 0x666633, side: THREE.DoubleSide, shininess: 60
        });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        group.add(flag);

        const doveMat = getMaterial('cf-dove', () =>
            new THREE.MeshPhongMaterial({ color: 0xFFEE88, emissive: 0x886622 })
        );
        const doveBody = new THREE.Mesh(
            getGeometry('cf-dove-body', () => new THREE.SphereGeometry(s * 0.14, 8, 6)),
            doveMat
        );
        doveBody.position.set(0, 0, 0.05);
        group.add(doveBody);

        const wingGeo = getGeometry('cf-wing', () =>
            new THREE.PlaneGeometry(s * 0.28, s * 0.08)
        );
        for (const side of [-1, 1]) {
            const wing = new THREE.Mesh(wingGeo, doveMat);
            wing.position.set(side * s * 0.15, s * 0.04, 0.05);
            wing.rotation.z = side * 0.3;
            group.add(wing);
        }

        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFDD44, transparent: true, opacity: 0.15, side: THREE.BackSide
        });
        this._cfGlow = new THREE.Mesh(
            getGeometry('cf-glow', () => new THREE.SphereGeometry(s * 0.7, 8, 8)),
            glowMat
        );
        group.add(this._cfGlow);

        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xFFDD44, transparent: true, opacity: 0.22, side: THREE.DoubleSide
        });
        this._cfRing = new THREE.Mesh(
            getGeometry('cf-ring', () => new THREE.RingGeometry(s * 0.5, s * 0.8, 24)),
            ringMat
        );
        this._cfRing.rotation.x = -Math.PI / 2;
        this._cfRing.position.y = -1.5;
        group.add(this._cfRing);

        return group;
    }

    _buildPakFlag() {
        const group = new THREE.Group();
        const s = CONFIG.POWERUP_SIZE;

        const flagGeo = getGeometry('pak-flag-body', () =>
            new THREE.PlaneGeometry(s * 1.4, s * 1.0)
        );
        this._pakFlagBodyMat = new THREE.MeshPhongMaterial({
            color: 0x00CC44, emissive: 0x009922, side: THREE.DoubleSide, shininess: 60
        });
        const flag = new THREE.Mesh(flagGeo, this._pakFlagBodyMat);
        group.add(flag);

        const whiteMat = getMaterial('pak-white', () =>
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x888888, side: THREE.DoubleSide })
        );

        const stripeGeo = getGeometry('pak-stripe', () =>
            new THREE.PlaneGeometry(s * 0.22, s * 1.0)
        );
        const stripe = new THREE.Mesh(stripeGeo, whiteMat);
        stripe.position.set(-s * 0.59, 0, 0.01);
        group.add(stripe);

        const crescentGeo = getGeometry('pak-crescent', () =>
            new THREE.TorusGeometry(s * 0.18, 0.06, 8, 16, Math.PI * 1.3)
        );
        const crescent = new THREE.Mesh(crescentGeo, whiteMat);
        crescent.position.set(s * 0.1, s * 0.04, 0.02);
        crescent.rotation.z = Math.PI * 0.2;
        group.add(crescent);

        const starGeo = getGeometry('pak-star', () =>
            new THREE.OctahedronGeometry(s * 0.09, 0)
        );
        const star = new THREE.Mesh(starGeo, whiteMat);
        star.position.set(s * 0.35, s * 0.06, 0.02);
        group.add(star);

        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00FF66, transparent: true, opacity: 0.18, side: THREE.BackSide
        });
        this._pakGlow = new THREE.Mesh(
            getGeometry('pak-glow', () => new THREE.SphereGeometry(s * 0.8, 8, 8)),
            glowMat
        );
        group.add(this._pakGlow);

        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00FF66, transparent: true, opacity: 0.25, side: THREE.DoubleSide
        });
        this._pakRing = new THREE.Mesh(
            getGeometry('pak-ring', () => new THREE.RingGeometry(s * 0.6, s * 0.9, 24)),
            ringMat
        );
        this._pakRing.rotation.x = -Math.PI / 2;
        this._pakRing.position.y = -1.5;
        group.add(this._pakRing);

        return group;
    }

    init(x, z) {
        super.init(x, z);
        this.time = Math.random() * Math.PI * 2;
        const color = POWERUP_COLORS[this.powerupType] || 0xffffff;
        const hexStr = '#' + color.toString(16).padStart(6, '0');

        this._oilBarrel.visible = (this.powerupType === 'oil');
        this._ceasefireMesh.visible = (this.powerupType === 'ceasefire');
        this._pakFlagMesh.visible = (this.powerupType === 'pakFlag');

        this._light.color.setHex(color);

        const label = POWERUP_LABELS[this.powerupType] || 'POWER';
        if (this.labelSprite) {
            this.mesh.remove(this.labelSprite);
        }
        this.labelSprite = getLabelSprite(label, hexStr);
        this.labelSprite.position.y = 9;
        this.mesh.add(this.labelSprite);

        this.mesh.position.set(x, 2, z);
        this.mesh.scale.setScalar(CONFIG.isMobile ? CONFIG.MOBILE_ENTITY_SCALE : 1);
    }

    update(delta, context) {
        this.time += delta;
        this.mesh.position.y = 2 + Math.sin(this.time * CONFIG.POWERUP_BOB_SPEED) * CONFIG.POWERUP_BOB_AMPLITUDE;
        this.mesh.rotation.y += delta * CONFIG.POWERUP_ROTATE_SPEED;
        this._light.intensity = 1.5 + Math.sin(this.time * 3) * 0.8;

        if (this._pakGlow && this._pakFlagMesh.visible) {
            this._pakGlow.material.opacity = 0.14 + Math.sin(this.time * 4) * 0.08;
            this._pakRing.material.opacity = 0.20 + Math.sin(this.time * 3) * 0.10;
        }
        if (this._cfGlow && this._ceasefireMesh.visible) {
            this._cfGlow.material.opacity = 0.12 + Math.sin(this.time * 4) * 0.07;
            this._cfRing.material.opacity = 0.18 + Math.sin(this.time * 3) * 0.08;
        }

        this.syncMesh();
    }
}
