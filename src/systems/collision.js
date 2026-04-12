import { aabbOverlap } from '../utils/math-utils.js';
import { CONFIG } from '../config.js';

export class CollisionSystem {
    constructor() {
        this.nearMisses = [];
    }

    check(tanker, entityPools, context) {
        this.nearMisses = [];

        for (const pool of entityPools) {
            pool.forEach((entity) => {
                if (!entity.active) return;

                if (aabbOverlap(
                    tanker.x, tanker.z, tanker.halfW, tanker.halfH,
                    entity.x, entity.z, entity.halfW, entity.halfH
                )) {
                    this._resolveCollision(tanker, entity, context);
                    return;
                }

                const nearDist = CONFIG.NEAR_MISS_DISTANCE;
                if (entity.type === 'mine' || entity.type === 'drone' || entity.type === 'boat' || entity.type === 'projectile') {
                    if (aabbOverlap(
                        tanker.x, tanker.z, tanker.halfW + nearDist, tanker.halfH + nearDist,
                        entity.x, entity.z, entity.halfW, entity.halfH
                    )) {
                        this.nearMisses.push(entity);
                    }
                }
            });
        }
    }

    _resolveCollision(tanker, entity, context) {
        if (context.ceasefireActive && (entity.type === 'drone' || entity.type === 'boat' || entity.type === 'projectile')) {
            return;
        }

        switch (entity.type) {
            case 'mine':
                tanker.takeDamage(CONFIG.MINE_DAMAGE);
                if (context.particles) context.particles.spawnExplosion(entity.x, 1, entity.z);
                if (context.audio) context.audio.playSFX('explosion');
                context.releaseEntity(entity);
                break;

            case 'drone':
                tanker.takeDamage(CONFIG.DRONE_KAMIKAZE_DAMAGE);
                if (context.particles) context.particles.spawnExplosion(entity.x, 2, entity.z);
                if (context.audio) context.audio.playSFX('explosion');
                context.releaseEntity(entity);
                context.addScore(75);
                break;

            case 'boat':
                tanker.takeDamage(CONFIG.BOAT_RAM_DAMAGE);
                if (context.particles) context.particles.spawnExplosion(entity.x, 1, entity.z);
                if (context.audio) context.audio.playSFX('explosion');
                context.releaseEntity(entity);
                context.addScore(50);
                break;

            case 'projectile':
                tanker.takeDamage(entity.damage || CONFIG.BOAT_ROCKET_DAMAGE);
                if (context.particles) context.particles.spawnExplosion(entity.x, 1, entity.z);
                context.releaseEntity(entity);
                break;

            case 'powerup':
                if (context.inventory) context.inventory.add(entity.powerupType);
                if (context.notifyPickup) context.notifyPickup(entity.powerupType);
                if (context.audio) context.audio.playSFX('pickup');
                context.releaseEntity(entity);
                break;

            case 'resource':
                if (entity.resourceType === 'repair') {
                    tanker.repair(CONFIG.REPAIR_AMOUNT);
                } else if (entity.resourceType === 'fuel') {
                    tanker.fuel = Math.min(tanker.fuel + CONFIG.FUEL_PICKUP_AMOUNT, CONFIG.TANKER_FUEL_MAX);
                } else if (entity.resourceType === 'laser') {
                    if (context.ironBeam) context.ironBeam.activateBuff();
                }
                if (context.notifyPickup) context.notifyPickup(entity.resourceType);
                if (context.audio) context.audio.playSFX('pickup');
                context.releaseEntity(entity);
                break;
        }
    }
}
