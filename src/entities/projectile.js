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
        this.damage = CONFIG.BOAT_ROCKET_DAMAGE;
        this.owner = 'enemy';
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const enemyGeo = getGeometry('projectile', () =>
            new THREE.SphereGeometry(CONFIG.PROJECTILE_RADIUS, 6, 6)
        );
        const enemyMat = getMaterial('projectile', () =>
            new THREE.MeshBasicMaterial({ color: CONFIG.PROJECTILE_COLOR })
        );
        this._enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
        group.add(this._enemyMesh);

        const torpedoBody = new THREE.Group();
        const bodyGeo = getGeometry('torpedo-body', () =>
            new THREE.CylinderGeometry(CONFIG.PROJECTILE_RADIUS * 0.8, CONFIG.PROJECTILE_RADIUS * 0.8, CONFIG.PROJECTILE_RADIUS * 4.0, 10)
        );
        const bodyMat = getMaterial('torpedo-body', () =>
            new THREE.MeshPhongMaterial({ color: CONFIG.TORPEDO_COLOR, emissive: 0x222a30, shininess: 80 })
        );
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        torpedoBody.add(body);

        const noseGeo = getGeometry('torpedo-nose', () =>
            new THREE.ConeGeometry(CONFIG.PROJECTILE_RADIUS * 0.8, CONFIG.PROJECTILE_RADIUS * 1.4, 10)
        );
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.rotation.x = Math.PI / 2;
        nose.position.z = CONFIG.PROJECTILE_RADIUS * 2.7;
        torpedoBody.add(nose);

        const trailGeo = getGeometry('torpedo-trail', () =>
            new THREE.SphereGeometry(CONFIG.PROJECTILE_RADIUS * 1.2, 8, 6)
        );
        const trailMat = new THREE.MeshBasicMaterial({
            color: CONFIG.TORPEDO_TRAIL_COLOR,
            transparent: true,
            opacity: 0.75,
        });
        this._torpedoTrailMat = trailMat;
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.position.z = -CONFIG.PROJECTILE_RADIUS * 2.4;
        trail.scale.set(0.9, 0.9, 1.8);
        torpedoBody.add(trail);

        this._torpedoMesh = torpedoBody;
        group.add(this._torpedoMesh);

        this.mesh = group;
        this.mesh.visible = false;
        this._enemyMesh.visible = true;
        this._torpedoMesh.visible = false;
    }

    init(x, z, vx, vz, damage, owner = 'enemy') {
        super.init(x, z);
        this.vx = vx || 0;
        this.vz = vz || 0;
        this.damage = damage || CONFIG.BOAT_ROCKET_DAMAGE;
        this.owner = owner;

        const isPlayer = owner === 'player';
        this._enemyMesh.visible = !isPlayer;
        this._torpedoMesh.visible = isPlayer;

        const y = isPlayer ? 1.2 : 2;
        this.mesh.position.set(x, y, z);
    }

    update(delta, context) {
        this.x += this.vx * delta;
        this.z += this.vz * delta;

        if (this.owner === 'player') {
            this.mesh.position.y = 1.2;
            if (this._torpedoTrailMat) {
                this._torpedoTrailMat.opacity = 0.55 + Math.random() * 0.35;
            }
            if (context && context.releaseEntity && context.tankerZ !== undefined) {
                if (this.z > context.tankerZ + CONFIG.TORPEDO_MAX_RANGE || this.z < context.tankerZ - 30) {
                    context.releaseEntity(this);
                    return;
                }
            }
        } else {
            this.mesh.position.y = Math.max(0.5, this.mesh.position.y - delta * 3);
        }

        this.syncMesh();
    }
}
