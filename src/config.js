export const CONFIG = {
    // Display
    CANVAS_ID: 'game-canvas',

    // Camera
    CAMERA_FOV: 55,
    CAMERA_POSITION: { x: 0, y: 80, z: -30 },
    CAMERA_LOOKAT: { x: 0, y: 0, z: 20 },

    // World
    WORLD_SCROLL_BASE_SPEED: 15,
    WORLD_WIDTH: 60,
    STRAIT_WIDTH_START: 50,
    STRAIT_WIDTH_MIN: 20,
    WATER_PLANE_SIZE: 300,
    TERRAIN_CHUNK_LENGTH: 200,
    TERRAIN_CHUNKS_VISIBLE: 4,
    TERRAIN_CHUNK_WIDTH: 100,
    TERRAIN_COAST_FADE: 8,
    TERRAIN_HEIGHT_SCALE: 50,
    TERRAIN_BASE_HEIGHT: 18,
    TERRAIN_OVERLAP: 3,
    DESPAWN_Z: -60,
    SPAWN_Z: 150,

    // Tanker
    TANKER_STEER_SPEED: 70,
    TANKER_INERTIA: 0.88,
    TANKER_MAX_LATERAL_SPEED: 35,
    TANKER_BOOST_MULTIPLIER: 2.5,
    TANKER_BOOST_DURATION: 0.8,
    TANKER_BOOST_COOLDOWN: 3,
    TANKER_WIDTH: 4,
    TANKER_LENGTH: 10,
    TANKER_COLOR: 0x7a8a7a,
    TANKER_BRIDGE_COLOR: 0xeeeedd,

    // Hull
    HULL_MAX: 100,
    HULL_FIRE_THRESHOLD: 30,
    HULL_SPEED_PENALTY_FACTOR: 0.5,
    HULL_INVULNERABILITY_TIME: 1.0,

    // Mines
    MINE_RADIUS: 1.5,
    MINE_DAMAGE: 20,
    MINE_COLOR: 0x1a1a1a,
    MINE_SPIKE_COLOR: 0xff2200,
    MINE_BOB_SPEED: 2,
    MINE_BOB_AMPLITUDE: 0.4,

    // Drones
    DRONE_SIZE: 1.5,
    DRONE_SPEED: 8,
    DRONE_BOMB_INTERVAL: 3,
    DRONE_BOMB_DAMAGE: 12,
    DRONE_COLOR: 0xaaaaaa,
    DRONE_ALTITUDE: 8,
    DRONE_HOMING_STRENGTH: 0.3,

    // Fast boats
    BOAT_WIDTH: 1.5,
    BOAT_LENGTH: 4,
    BOAT_SPEED: 20,
    BOAT_RAM_DAMAGE: 15,
    BOAT_ROCKET_DAMAGE: 10,
    BOAT_ROCKET_SPEED: 30,
    BOAT_FIRE_INTERVAL: 2.5,
    BOAT_COLOR: 0x557755,

    // Projectiles
    PROJECTILE_RADIUS: 0.4,
    PROJECTILE_COLOR: 0xda0000,

    // Power-ups
    POWERUP_SIZE: 2.2,
    POWERUP_BOB_SPEED: 3,
    POWERUP_BOB_AMPLITUDE: 0.5,
    POWERUP_ROTATE_SPEED: 2,
    FLARE_DURATION: 8,
    FLARE_COLOR: 0xda0000,
    OIL_SLICK_DURATION: 10,
    OIL_SLICK_COLOR: 0x222222,
    CEASEFIRE_DURATION: 13,
    CEASEFIRE_COLOR: 0x3a8fd4,

    // Resources
    RESOURCE_SIZE: 1.8,
    REPAIR_AMOUNT: 20,
    REPAIR_COLOR: 0x44ff44,
    FUEL_COLOR: 0xffaa22,
    RADAR_COLOR: 0x44aaff,
    RADAR_DURATION: 5,

    // Tolls
    TOLL_INTERVAL_MIN: 800,
    TOLL_INTERVAL_MAX: 1200,
    TOLL_BASE_COST: 25,
    TOLL_COST_PER_KM: 5,
    TOLL_COST_VARIANCE: 0.3,
    TOLL_REFUSE_MULTIPLIER: 1.5,

    // Win condition
    WIN_DISTANCE: 167000,

    // Scoring
    SCORE_PER_METER: 1,
    NEAR_MISS_DISTANCE: 3,
    NEAR_MISS_MULTIPLIER: 2,
    NEAR_MISS_DURATION: 2,

    // Difficulty phases (distance in meters)
    DIFFICULTY: [
        {
            name: 'Fragile Calm',
            startDistance: 0,
            mineRate: 0.3,
            droneRate: 0,
            boatRate: 0,
            powerupRate: 0.05,
            resourceRate: 0.1,
            scrollSpeedMult: 1.0,
            straitWidthMult: 1.0,
        },
        {
            name: 'IRGC Awakening',
            startDistance: 3000,
            mineRate: 0.6,
            droneRate: 0.15,
            boatRate: 0.1,
            powerupRate: 0.08,
            resourceRate: 0.08,
            scrollSpeedMult: 1.2,
            straitWidthMult: 0.85,
        },
        {
            name: 'Escalation Phase',
            startDistance: 8000,
            mineRate: 1.0,
            droneRate: 0.35,
            boatRate: 0.25,
            powerupRate: 0.1,
            resourceRate: 0.06,
            scrollSpeedMult: 1.5,
            straitWidthMult: 0.65,
        },
        {
            name: 'Total War Zone',
            startDistance: 15000,
            mineRate: 1.5,
            droneRate: 0.5,
            boatRate: 0.4,
            powerupRate: 0.12,
            resourceRate: 0.05,
            scrollSpeedMult: 1.8,
            straitWidthMult: 0.5,
        },
        {
            name: 'Iron Gauntlet',
            startDistance: 40000,
            mineRate: 1.8,
            droneRate: 0.6,
            boatRate: 0.5,
            powerupRate: 0.14,
            resourceRate: 0.04,
            scrollSpeedMult: 2.0,
            straitWidthMult: 0.45,
        },
        {
            name: 'No Passage',
            startDistance: 100000,
            mineRate: 2.0,
            droneRate: 0.7,
            boatRate: 0.6,
            powerupRate: 0.15,
            resourceRate: 0.04,
            scrollSpeedMult: 2.2,
            straitWidthMult: 0.4,
        },
    ],

    // Pool sizes
    POOL_MINES: 25,
    POOL_DRONES: 10,
    POOL_BOATS: 8,
    POOL_PROJECTILES: 30,
    POOL_POWERUPS: 5,
    POOL_RESOURCES: 8,
    POOL_PARTICLES: 60,

    // Particles
    PARTICLE_EXPLOSION_COUNT: 15,
    PARTICLE_WAKE_RATE: 0.05,
    PARTICLE_LIFETIME: 1.5,

    // Radio chatter
    RADIO_MESSAGES: [
        { distance: 100, text: "MV Eternal Horizon, you are cleared for transit. Godspeed.", speaker: 'COMMAND' },
        { distance: 500, text: "Scattered mines reported ahead. Stay in the channel.", speaker: 'COMMAND' },
        { distance: 2000, text: "We're gonna get you through. Believe me. Nobody does safe passage better.", speaker: 'TRUMP' },
        { distance: 3500, text: "IRGC patrol boats detected on radar. Maintain course.", speaker: 'COMMAND' },
        { distance: 5000, text: "The ceasefire is holding. For now. Stay vigilant.", speaker: 'BIBI' },
        { distance: 7000, text: "Multiple drone signatures detected. This is getting serious, folks.", speaker: 'TRUMP' },
        { distance: 9000, text: "Ceasefire breach! All stations — defensive posture!", speaker: 'COMMAND' },
        { distance: 11000, text: "We will not allow any vessel to be threatened. Israel stands ready.", speaker: 'BIBI' },
        { distance: 13000, text: "I told them — you mess with our ships, there will be consequences. Big consequences.", speaker: 'TRUMP' },
        { distance: 15000, text: "Total closure imminent. All commercial traffic — you're on your own.", speaker: 'COMMAND' },
        { distance: 18000, text: "This is the worst they've thrown at us. But we're still here. Tremendous.", speaker: 'TRUMP' },
        { distance: 25000, text: "Quarter way through. Keep pushing, Eternal Horizon.", speaker: 'COMMAND' },
        { distance: 40000, text: "Iron Gauntlet ahead. They're throwing everything at you now.", speaker: 'COMMAND' },
        { distance: 50000, text: "Halfway mark. Nobody thought we'd make it this far. Nobody.", speaker: 'TRUMP' },
        { distance: 80000, text: "Israel's Iron Dome is covering your corridor. Stay in the channel.", speaker: 'BIBI' },
        { distance: 100000, text: "Final blockade zone. No passage they said — prove them wrong.", speaker: 'COMMAND' },
        { distance: 120000, text: "You can see the other side now. Incredible. The best ship captain, maybe ever.", speaker: 'TRUMP' },
        { distance: 150000, text: "Almost through! The world is watching, Eternal Horizon.", speaker: 'COMMAND' },
        { distance: 165000, text: "Two kilometers to open water. Hold steady!", speaker: 'BIBI' },
    ],

    // Night progression
    NIGHT_MODIFIERS: {
        2: { mineDensityMult: 1.25 },
        4: { droneHomingMult: 1.5 },
        6: { boatFireRateMult: 1.4 },
        8: { noSafeGaps: true },
    },

    // Port Hub upgrades
    UPGRADES: {
        rudder: { name: 'Better Rudder', description: '+10% steering speed per level', maxLevel: 5, baseCost: 500, costMult: 1.8, effect: 0.1 },
        hull: { name: 'Hull Plating', description: '+15 max hull points per level', maxLevel: 5, baseCost: 600, costMult: 1.8, effect: 15 },
        radar: { name: 'Radar Range', description: '+2s threat detection range per level', maxLevel: 3, baseCost: 400, costMult: 2.0, effect: 2 },
        tollDiscount: { name: 'Toll Negotiator', description: '-15% toll cost per level', maxLevel: 3, baseCost: 300, costMult: 1.5, effect: 0.15 },
        ceasefire: { name: 'Extended Ceasefire', description: '+3s ceasefire duration per level', maxLevel: 3, baseCost: 800, costMult: 2.0, effect: 3 },
    },
};
