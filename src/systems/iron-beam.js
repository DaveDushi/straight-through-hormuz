import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class IronBeamSystem {
    constructor(scene) {
        this.scene = scene;
        this.hitRate = CONFIG.IRON_BEAM_BASE_HIT_RATE;
        this._baseHitRate = this.hitRate;
        this.buffTimer = 0;
        this.beams = [];

        // Pre-allocate beam pool
        const beamMat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 1 });
        for (let i = 0; i < 4; i++) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
            const line = new THREE.Line(geo, beamMat.clone());
            line.visible = false;
            scene.add(line);
            this.beams.push({ line, timer: 0, active: false });
        }
    }

    reset(upgradeLevel, radarLevel = 0) {
        this._baseHitRate = CONFIG.IRON_BEAM_BASE_HIT_RATE + upgradeLevel * CONFIG.IRON_BEAM_UPGRADE_BONUS;
        this._rangeBonus = radarLevel * CONFIG.UPGRADES.radar.effect;
        this.hitRate = this._baseHitRate;
        this.buffTimer = 0;
        for (const beam of this.beams) {
            beam.active = false;
            beam.timer = 0;
            beam.line.visible = false;
        }
    }

    activateBuff() {
        this.buffTimer = this.buffDuration ?? CONFIG.LASER_BUFF_DURATION;
        this.hitRate = 1.0;
    }

    isBuffActive() {
        return this.buffTimer > 0;
    }

    update(delta, dronePool, tanker, particles, audio, releaseEntity) {
        if (this.buffTimer > 0) {
            this.buffTimer -= delta;
            if (this.buffTimer <= 0) {
                this.buffTimer = 0;
                this.hitRate = this._baseHitRate;
            }
        }

        // Evaluate drones entering laser range
        dronePool.forEach((drone) => {
            if (!drone.active || drone.laserEvaluated) return;

            const dx = drone.x - tanker.x;
            const dz = drone.z - tanker.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < CONFIG.IRON_BEAM_RANGE + (this._rangeBonus || 0)) {
                drone.laserEvaluated = true;
                const hit = Math.random() < this.hitRate;

                // Fire beam visual
                this._fireBeam(
                    tanker.x, 5, tanker.z,
                    drone.x, drone.mesh.position.y, drone.z,
                    hit
                );

                if (hit) {
                    particles.spawnExplosion(drone.x, drone.mesh.position.y, drone.z);
                    audio.playSFX('laser');
                    releaseEntity(drone);
                } else {
                    audio.playSFX('laser');
                }
            }
        });

        // Update beam fade
        for (const beam of this.beams) {
            if (!beam.active) continue;
            beam.timer -= delta;
            beam.line.material.opacity = Math.max(0, beam.timer / CONFIG.IRON_BEAM_BEAM_DURATION);
            if (beam.timer <= 0) {
                beam.active = false;
                beam.line.visible = false;
            }
        }
    }

    _fireBeam(x1, y1, z1, x2, y2, z2, isHit) {
        let beam = this.beams.find(b => !b.active);
        if (!beam) beam = this.beams[0]; // reuse oldest

        const positions = beam.line.geometry.attributes.position;
        positions.setXYZ(0, x1, y1, z1);
        positions.setXYZ(1, x2, y2, z2);
        positions.needsUpdate = true;

        beam.line.material.color.setHex(isHit ? 0xff2222 : 0xff8888);
        beam.line.material.opacity = 1;
        beam.line.visible = true;
        beam.timer = CONFIG.IRON_BEAM_BEAM_DURATION;
        beam.active = true;
    }
}
