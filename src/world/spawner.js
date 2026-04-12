import { CONFIG } from '../config.js';
import { randomRange } from '../utils/math-utils.js';

export class Spawner {
    constructor(pools, scene) {
        this.pools = pools;
        this.scene = scene;
        this.timers = {
            mine: 0,
            drone: 0,
            boat: 0,
            powerup: 0,
            resource: 0,
        };
        this.ceasefireActive = false;
    }

    update(delta, difficulty, straitHalfWidth, distance, tankerZ) {
        if (this.ceasefireActive) return;

        const phase = difficulty.currentPhase;

        this._tickSpawn(delta, 'mine', phase.mineRate, straitHalfWidth, tankerZ);
        this._tickSpawn(delta, 'drone', phase.droneRate, straitHalfWidth, tankerZ);
        this._tickSpawn(delta, 'boat', phase.boatRate, straitHalfWidth, tankerZ);
        this._tickSpawn(delta, 'powerup', phase.powerupRate, straitHalfWidth, tankerZ);
        this._tickSpawn(delta, 'resource', phase.resourceRate, straitHalfWidth, tankerZ);
    }

    _tickSpawn(delta, type, rate, straitHalfWidth, tankerZ) {
        if (rate <= 0) return;

        this.timers[type] += delta;
        const interval = 1 / rate;

        if (this.timers[type] >= interval) {
            this.timers[type] -= interval;
            this._spawn(type, straitHalfWidth, tankerZ);
        }
    }

    _spawn(type, straitHalfWidth, tankerZ) {
        const pool = this.pools[type];
        if (!pool) return;

        const entity = pool.acquire();
        if (!entity) return;

        const x = randomRange(-straitHalfWidth + 2, straitHalfWidth - 2);
        const z = tankerZ + CONFIG.SPAWN_Z + randomRange(0, 30);

        if (type === 'powerup') {
            const types = ['flare', 'oilSlick', 'ceasefire'];
            entity.powerupType = types[Math.floor(Math.random() * types.length)];
        }

        if (type === 'resource') {
            const types = ['repair', 'fuel', 'radar'];
            entity.resourceType = types[Math.floor(Math.random() * types.length)];
        }

        if (type === 'boat') {
            entity.approachSide = Math.random() < 0.5 ? -1 : 1;
            const bx = entity.approachSide * (straitHalfWidth + 5);
            entity.init(bx, z);
            entity.targetX = randomRange(-straitHalfWidth * 0.5, straitHalfWidth * 0.5);
        } else {
            entity.init(x, z);
        }

        if (entity.mesh && !entity.mesh.parent) {
            this.scene.add(entity.mesh);
        }
    }

    despawnOffscreen(pools, tankerZ) {
        for (const key in pools) {
            pools[key].forEach((entity) => {
                if (entity.z < tankerZ + CONFIG.DESPAWN_Z) {
                    pools[key].release(entity);
                }
            });
        }
    }
}
