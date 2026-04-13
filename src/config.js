export const CONFIG = {
  // Display
  CANVAS_ID: "game-canvas",

  // Camera
  CAMERA_FOV: 55,
  CAMERA_POSITION: { x: 0, y: 78, z: -30 },
  CAMERA_LOOKAT: { x: 0, y: 0, z: 20 },

  // World
  WORLD_SCROLL_BASE_SPEED: 15,
  WORLD_WIDTH: 60,
  STRAIT_WIDTH_START: 58,
  STRAIT_WIDTH_MIN: 26,
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
  TANKER_FUEL_MAX: 100,
  TANKER_FUEL_PER_BOOST: 25,
  TANKER_FUEL_REGEN_CAP: 25,
  TANKER_FUEL_REGEN_RATE: 5,
  FUEL_PICKUP_AMOUNT: 50,
  TANKER_WIDTH: 4,
  TANKER_LENGTH: 10,
  TANKER_COLOR: 0x7a8a7a,
  TANKER_BRIDGE_COLOR: 0xeeeedd,

  // Hull
  HULL_MAX: 100,
  HULL_FIRE_THRESHOLD: 30,
  HULL_SPEED_PENALTY_FACTOR: 0.5,
  HULL_INVULNERABILITY_TIME: 1.0,

  // Wall collision
  WALL_DAMAGE_MAX: 10,
  WALL_DAMAGE_VELOCITY_MIN: 5,
  WALL_BOUNCE_FACTOR: -0.4,
  WALL_HIT_COOLDOWN: 0.5,

  // Mines
  MINE_RADIUS: 1.2,
  MINE_DAMAGE: 20,
  MINE_COLOR: 0x1a1a1a,
  MINE_SPIKE_COLOR: 0xff2200,
  MINE_BOB_SPEED: 2,
  MINE_BOB_AMPLITUDE: 0.4,

  // Drones (kamikaze)
  DRONE_SIZE: 2,
  DRONE_SPEED: 12,
  DRONE_COLOR: 0xaaaaaa,
  DRONE_ALTITUDE: 8,
  DRONE_HOMING_STRENGTH: 0.6,
  DRONE_KAMIKAZE_DAMAGE: 25,
  DRONE_DIVE_RANGE: 15,

  // Iron Beam defense
  IRON_BEAM_BASE_HIT_RATE: 0.4,
  IRON_BEAM_UPGRADE_BONUS: 0.15,
  IRON_BEAM_RANGE: 40,
  IRON_BEAM_BEAM_DURATION: 0.3,

  // Fast boats
  BOAT_WIDTH: 2,
  BOAT_LENGTH: 5,
  BOAT_SPEED: 20,
  BOAT_RAM_DAMAGE: 15,
  BOAT_ROCKET_DAMAGE: 10,
  BOAT_ROCKET_SPEED: 30,
  BOAT_FIRE_INTERVAL: 2.5,
  BOAT_COLOR: 0x557755,

  // Projectiles
  PROJECTILE_RADIUS: 0.6,
  PROJECTILE_COLOR: 0xda0000,

  // Power-ups
  POWERUP_SIZE: 3.2,
  POWERUP_BOB_SPEED: 3,
  POWERUP_BOB_AMPLITUDE: 0.8,
  POWERUP_ROTATE_SPEED: 2,
  OIL_BOOST_DURATION: 8,
  OIL_BOOST_COLOR: 0xffaa00,
  OIL_BOOST_SPEED_MULT: 1.5,
  CEASEFIRE_DURATION: 10,
  CEASEFIRE_COLOR: 0x3a8fd4,
  PAK_FLAG_DURATION: 10,
  PAK_FLAG_COLOR: 0x01411c,

  // USA Blockade
  BLOCKADE_DISTANCE_AFTER_TOLL: 500,
  BLOCKADE_PASSAGE_WIDTH: 7,
  BLOCKADE_WALL_HEIGHT: 8,
  BLOCKADE_COLOR: 0x334466,
  POOL_BLOCKADES: 4,

  // Mobile
  MOBILE_ENTITY_SCALE: 1.5,
  isMobile: false,

  // Resources
  RESOURCE_SIZE: 3,
  REPAIR_AMOUNT: 20,
  REPAIR_COLOR: 0x44ff44,
  FUEL_COLOR: 0xffaa22,
  LASER_BUFF_COLOR: 0xff4444,
  LASER_BUFF_DURATION: 10,

  // Tolls
  TOLL_INTERVAL_MIN: 8000,
  TOLL_INTERVAL_MAX: 15000,
  TOLL_BASE_COST: 25,
  TOLL_COST_PER_KM: 5,
  TOLL_COST_VARIANCE: 0.3,
  TOLL_REFUSE_MULTIPLIER: 1.5,
  TOLL_REFUSE_SPAWN_MULTIPLIER: 1.5,

  // Win condition — 167km, the real length of the Strait of Hormuz
  WIN_DISTANCE: 167000,

  // Scoring
  DISTANCE_MULTIPLIER: 9,
  SCORE_PER_METER: 1,
  NEAR_MISS_DISTANCE: 3,
  NEAR_MISS_MULTIPLIER: 2,
  NEAR_MISS_DURATION: 2,

  // Difficulty phases (distance in meters)
  DIFFICULTY: [
    {
      name: "Fragile Calm",
      startDistance: 0,
      mineRate: 0.3,
      droneRate: 0,
      boatRate: 0,
      powerupRate: 0.06,
      resourceRate: 0.1,
      scrollSpeedMult: 1.0,
      straitWidthMult: 1.0,
    },
    {
      name: "IRGC Awakening",
      startDistance: 15000,
      mineRate: 0.6,
      droneRate: 0.15,
      boatRate: 0.1,
      powerupRate: 0.09,
      resourceRate: 0.08,
      scrollSpeedMult: 1.0,
      straitWidthMult: 0.85,
    },
    {
      name: "Escalation Phase",
      startDistance: 40000,
      mineRate: 1.0,
      droneRate: 0.35,
      boatRate: 0.25,
      powerupRate: 0.11,
      resourceRate: 0.06,
      scrollSpeedMult: 1.0,
      straitWidthMult: 0.65,
    },
    {
      name: "Total War Zone",
      startDistance: 70000,
      mineRate: 1.5,
      droneRate: 0.5,
      boatRate: 0.4,
      powerupRate: 0.13,
      resourceRate: 0.05,
      scrollSpeedMult: 1.0,
      straitWidthMult: 0.5,
    },
    {
      name: "Iron Gauntlet",
      startDistance: 110000,
      mineRate: 1.8,
      droneRate: 0.6,
      boatRate: 0.5,
      powerupRate: 0.15,
      resourceRate: 0.04,
      scrollSpeedMult: 1.0,
      straitWidthMult: 0.45,
    },
    {
      name: "No Passage",
      startDistance: 145000,
      mineRate: 2.0,
      droneRate: 0.7,
      boatRate: 0.6,
      powerupRate: 0.15,
      resourceRate: 0.04,
      scrollSpeedMult: 1.0,
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

  // Voice audio
  VOICE_VOLUME: 0.7,
  VOICE_RADIO_DELAY: 0.15,

  // Radio chatter
  RADIO_MESSAGES: [
    {
      distance: 500,
      text: "MT Make Hormuz Great Again, you are cleared for transit. Godspeed.",
      speaker: "COMMAND",
      voice: "mt-make-hormuz-great-again--yo.wav",
    },
    {
      distance: 3000,
      text: "Scattered mines reported ahead. Stay in the channel.",
      speaker: "COMMAND",
      voice: "scattered-mines-reported-ahead.wav",
    },
    {
      distance: 8000,
      text: "We're gonna get you through. Believe me. Nobody does safe passage better.",
      speaker: "TRUMP",
      voice: "we-re-gonna-get-you-through--b.wav",
    },
    {
      distance: 15000,
      text: "IRGC patrol boats detected on radar. Maintain course.",
      speaker: "COMMAND",
      voice: "irgc-patrol-boats-detected-on-.wav",
    },
    {
      distance: 25000,
      text: "The ceasefire is holding. For now. Stay vigilant.",
      speaker: "BIBI",
      voice: "the-ceasefire-is-holding--for-.wav",
    },
    {
      distance: 35000,
      text: "Multiple drone signatures detected. This is getting serious, folks.",
      speaker: "TRUMP",
      voice: "multiple-drone-signatures-dete.wav",
    },
    {
      distance: 50000,
      text: "Ceasefire breach! All stations — defensive posture!",
      speaker: "COMMAND",
      voice: "ceasefire-breach--all-stations.wav",
    },
    {
      distance: 65000,
      text: "We will not allow any vessel to be threatened. Israel stands ready.",
      speaker: "BIBI",
      voice: "we-will-not-allow-any-vessel-t.wav",
    },
    {
      distance: 80000,
      text: "Halfway mark. Nobody thought we'd make it this far. Nobody.",
      speaker: "TRUMP",
      voice: "halfway-mark--nobody-thought-w.wav",
    },
    {
      distance: 95000,
      text: "I told them — you mess with our ships, there will be consequences. Big consequences.",
      speaker: "TRUMP",
      voice: "i-told-them---you-mess-with-ou.wav",
    },
    {
      distance: 105000,
      text: "Iron Gauntlet ahead. They're throwing everything at you now.",
      speaker: "COMMAND",
      voice: "iron-gauntlet-ahead--they-re-t.wav",
    },
    {
      distance: 120000,
      text: "Israel's Iron Dome is covering your corridor. Stay in the channel.",
      speaker: "BIBI",
      voice: "israel-s-iron-dome-is-covering.wav",
    },
    {
      distance: 140000,
      text: "Final blockade zone. No passage they said — prove them wrong.",
      speaker: "COMMAND",
      voice: "final-blockade-zone--no-passag.wav",
    },
    {
      distance: 155000,
      text: "You can see the other side now. Incredible. The best ship captain, maybe ever.",
      speaker: "TRUMP",
      voice: "you-can-see-the-other-side-now.wav",
    },
    {
      distance: 163000,
      text: "Almost through! The world is watching, Eternal Horizon.",
      speaker: "COMMAND",
      voice: "almost-through--the-world-is-w.wav",
    },
    {
      distance: 166000,
      text: "One kilometer to open water. Hold steady!",
      speaker: "BIBI",
      voice: "one-kilometer-to-open-water--h.wav",
    },
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
    rudder: {
      name: "Better Rudder",
      description: "+10% steering speed per level",
      maxLevel: 5,
      baseCost: 500,
      costMult: 1.8,
      effect: 0.1,
    },
    hull: {
      name: "Hull Plating",
      description: "+15 max hull points per level",
      maxLevel: 5,
      baseCost: 600,
      costMult: 1.8,
      effect: 15,
    },
    radar: {
      name: "Radar Range",
      description: "+2s threat detection range per level",
      maxLevel: 3,
      baseCost: 400,
      costMult: 2.0,
      effect: 2,
    },
    tollDiscount: {
      name: "Toll Negotiator",
      description: "-15% toll cost per level",
      maxLevel: 3,
      baseCost: 300,
      costMult: 1.5,
      effect: 0.15,
    },
    ironBeam: {
      name: "Iron Beam",
      description: "+15% drone intercept rate per level",
      maxLevel: 3,
      baseCost: 700,
      costMult: 2.0,
      effect: 0.15,
    },
  },
};
