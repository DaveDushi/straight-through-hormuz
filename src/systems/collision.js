import { aabbOverlap } from '../utils/math-utils.js';
import { CONFIG } from '../config.js';

export class CollisionSystem {
    constructor() {
        this.nearMisses = [];
        this._countedNearMisses = new Set();
    }

    reset() {
        this._countedNearMisses.clear();
    }

    check(tanker, entityPools, context) {
        this.nearMisses = [];

        for (const pool of entityPools) {
            pool.forEach((entity) => {
                if (!entity.active) return;
                if (entity.type === 'projectile' && entity.owner === 'player') return;

                if (aabbOverlap(
                    tanker.x, tanker.z, tanker.halfW, tanker.halfH,
                    entity.x, entity.z, entity.halfW, entity.halfH
                )) {
                    this._countedNearMisses.delete(entity);
                    this._resolveCollision(tanker, entity, context);
                    return;
                }

                const nearDist = CONFIG.NEAR_MISS_DISTANCE;
                if (entity.type === 'mine' || entity.type === 'drone' || entity.type === 'boat' || entity.type === 'projectile') {
                    if (!this._countedNearMisses.has(entity) && aabbOverlap(
                        tanker.x, tanker.z, tanker.halfW + nearDist, tanker.halfH + nearDist,
                        entity.x, entity.z, entity.halfW, entity.halfH
                    )) {
                        this._countedNearMisses.add(entity);
                        this.nearMisses.push(entity);
                    }
                }
            });
        }

        this._checkPlayerTorpedoes(entityPools, context);
    }

    _checkPlayerTorpedoes(entityPools, context) {
        const projectilePool = context.projectilePool;
        const boatPool = context.boatPool;
        const minePool = context.minePool;
        if (!projectilePool) return;

        projectilePool.forEach((proj) => {
            if (!proj.active || proj.owner !== 'player') return;

            const hit = (target) => {
                if (context.particles) context.particles.spawnExplosion(target.x, 1, target.z);
                if (context.audio) context.audio.playSFX('explosion');
                context.releaseEntity(target);
                context.releaseEntity(proj);
            };

            if (boatPool) {
                let consumed = false;
                boatPool.forEach((boat) => {
                    if (consumed || !boat.active) return;
                    if (aabbOverlap(
                        proj.x, proj.z, proj.halfW, proj.halfH,
                        boat.x, boat.z, boat.halfW, boat.halfH
                    )) {
                        hit(boat);
                        if (context.addScore) context.addScore(100);
                        consumed = true;
                    }
                });
                if (consumed) return;
            }

            if (minePool) {
                let consumed = false;
                minePool.forEach((mine) => {
                    if (consumed || !mine.active) return;
                    if (aabbOverlap(
                        proj.x, proj.z, proj.halfW, proj.halfH,
                        mine.x, mine.z, mine.halfW, mine.halfH
                    )) {
                        hit(mine);
                        consumed = true;
                    }
                });
            }
        });
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
                    tanker.fuel = Math.min(tanker.fuel + CONFIG.FUEL_PICKUP_AMOUNT, tanker.maxFuel);
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
