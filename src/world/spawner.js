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

    update(delta, difficulty, straitHalfWidth, distance) {
        if (this.ceasefireActive) return;

        const phase = difficulty.currentPhase;

        this._tickSpawn(delta, 'mine', phase.mineRate, straitHalfWidth);
        this._tickSpawn(delta, 'drone', phase.droneRate, straitHalfWidth);
        this._tickSpawn(delta, 'boat', phase.boatRate, straitHalfWidth);
        this._tickSpawn(delta, 'powerup', phase.powerupRate, straitHalfWidth);
        this._tickSpawn(delta, 'resource', phase.resourceRate, straitHalfWidth);
    }

    _tickSpawn(delta, type, rate, straitHalfWidth) {
        if (rate <= 0) return;

        this.timers[type] += delta;
        const interval = 1 / rate;

        if (this.timers[type] >= interval) {
            this.timers[type] -= interval;
            this._spawn(type, straitHalfWidth);
        }
    }

    _spawn(type, straitHalfWidth) {
        const pool = this.pools[type];
        if (!pool) return;

        const entity = pool.acquire();
        if (!entity) return;

        const x = randomRange(-straitHalfWidth + 2, straitHalfWidth - 2);
        const z = CONFIG.SPAWN_Z + randomRange(0, 30);

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

    despawnOffscreen(pools) {
        for (const key in pools) {
            pools[key].forEach((entity) => {
                if (entity.z < CONFIG.DESPAWN_Z) {
                    pools[key].release(entity);
                }
            });
        }
    }
}
