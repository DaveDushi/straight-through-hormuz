import * as THREE from 'three';
import { CONFIG } from '../config.js';

class Particle {
    constructor() {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
        );
        this.active = false;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.life = 0;
        this.maxLife = 1;
        this.type = 'default';
    }
}

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        for (let i = 0; i < 120; i++) {
            const p = new Particle();
            p.mesh.visible = false;
            scene.add(p.mesh);
            this.particles.push(p);
        }
        this._wakeTimer = 0;
        this._sprayTimer = 0;
        this._lineTimer = 0;
    }

    _acquire() {
        for (const p of this.particles) {
            if (!p.active) return p;
        }
        return null;
    }

    spawnExplosion(x, y, z) {
        for (let i = 0; i < CONFIG.PARTICLE_EXPLOSION_COUNT; i++) {
            const p = this._acquire();
            if (!p) return;
            p.active = true;
            p.life = 0;
            p.maxLife = CONFIG.PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
            p.mesh.position.set(x, y, z);
            p.mesh.visible = true;
            p.type = 'explosion';

            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            p.vx = Math.cos(angle) * speed;
            p.vy = 2 + Math.random() * 5;
            p.vz = Math.sin(angle) * speed;
            p.mesh.scale.setScalar(0.3 + Math.random() * 0.3);

            const colors = [0xda0000, 0xff6600, 0xf0c040, 0xff3300];
            p.mesh.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
        }
    }

    spawnWake(x, z, scrollSpeed) {
        // Bow spray - white water splashing at front of ship
        for (let i = 0; i < 3; i++) {
            const p = this._acquire();
            if (!p) continue;
            p.active = true;
            p.life = 0;
            p.maxLife = 0.6 + Math.random() * 0.4;
            p.type = 'wake';
            const side = (Math.random() - 0.5) * 2;
            p.mesh.position.set(x + side * 2.5, 0.3, z + 6 + Math.random() * 2);
            p.mesh.visible = true;
            p.vx = side * 3;
            p.vy = 0.5 + Math.random();
            p.vz = -2;
            p.mesh.material.color.setHex(0xeeffff);
            p.mesh.scale.setScalar(0.25 + Math.random() * 0.15);
        }

        // Stern wake - trail of white water behind ship
        for (let i = 0; i < 2; i++) {
            const p = this._acquire();
            if (!p) continue;
            p.active = true;
            p.life = 0;
            p.maxLife = 1.2 + Math.random() * 0.6;
            p.type = 'wake';
            p.mesh.position.set(x + (Math.random() - 0.5) * 2, 0.1, z - 6 - Math.random() * 2);
            p.mesh.visible = true;
            p.vx = (Math.random() - 0.5) * 1.5;
            p.vy = 0;
            p.vz = -3;
            p.mesh.material.color.setHex(0xcceeee);
            p.mesh.scale.setScalar(0.3 + Math.random() * 0.2);
        }
    }

    spawnSpeedLines(scrollSpeed, tankerZ) {
        // Speed lines flowing past camera - create sense of forward motion
        for (let i = 0; i < 2; i++) {
            const p = this._acquire();
            if (!p) continue;
            p.active = true;
            p.life = 0;
            p.maxLife = 1.5;
            p.type = 'speedline';
            const x = (Math.random() - 0.5) * 50;
            p.mesh.position.set(x, 0.2 + Math.random() * 0.3, tankerZ + 120 + Math.random() * 30);
            p.mesh.visible = true;
            p.vx = 0;
            p.vy = 0;
            p.vz = -scrollSpeed * 0.2;
            p.mesh.material.color.setHex(0xbbdddd);
            p.mesh.scale.set(0.1, 0.1, 2);
        }
    }

    update(delta, scrollSpeed) {
        for (const p of this.particles) {
            if (!p.active) continue;
            p.life += delta;
            if (p.life >= p.maxLife) {
                p.active = false;
                p.mesh.visible = false;
                p.mesh.scale.setScalar(0.2);
                continue;
            }

            p.mesh.position.x += p.vx * delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.position.z += p.vz * delta;

            if (p.type === 'explosion') {
                p.vy -= 10 * delta;
            }

            const t = p.life / p.maxLife;
            p.mesh.material.opacity = 1 - t;

            if (p.type === 'speedline') {
                p.mesh.material.opacity = (1 - t) * 0.3;
            }
        }
    }
}
