import * as THREE from 'three';
import { CONFIG } from './config.js';
import { StateMachine } from './state/state-machine.js';
import { InputSystem } from './systems/input.js';
import { CollisionSystem } from './systems/collision.js';
import { DifficultySystem } from './systems/difficulty.js';
import { ScoringSystem } from './systems/scoring.js';
import { TollSystem } from './systems/toll.js';
import { InventorySystem } from './systems/inventory.js';
import { ParticleSystem } from './systems/particles.js';
import { AudioManager } from './audio/audio-manager.js';
import { Water } from './world/water.js';
import { Terrain } from './world/terrain.js';
import { Spawner } from './world/spawner.js';
import { Pool } from './utils/pool.js';
import { Tanker } from './entities/tanker.js';
import { Mine } from './entities/mine.js';
import { Drone } from './entities/drone.js';
import { FastBoat } from './entities/fast-boat.js';
import { Projectile } from './entities/projectile.js';
import { Powerup } from './entities/powerup.js';
import { Resource } from './entities/resource.js';
import { HUD } from './ui/hud.js';
import { MenuScreen } from './ui/menu.js';
import { GameOverScreen } from './ui/gameover.js';
import { TollDialog } from './ui/toll-dialog.js';
import { RadioUI } from './ui/radio.js';
import { PortHub } from './ui/port-hub.js';
import { SaveManager } from './save.js';

export class Game {
    constructor() {
        this.save = new SaveManager();

        this._initRenderer();
        this._initScene();
        this._initPools();

        this.input = new InputSystem(this.renderer.domElement);
        this.collision = new CollisionSystem();
        this.difficulty = new DifficultySystem();
        this.scoring = new ScoringSystem();
        this.toll = new TollSystem();
        this.inventory = new InventorySystem();
        this.particles = new ParticleSystem(this.scene);
        this.audio = new AudioManager();

        this.water = new Water(this.scene);
        this.terrain = new Terrain(this.scene);

        this.tanker = new Tanker();
        this.scene.add(this.tanker.mesh);

        this.spawner = new Spawner(this.pools, this.scene);

        this.hud = new HUD((slot) => { this.input.activatePowerup = slot; });
        this.radio = new RadioUI();
        this.tollDialog = new TollDialog((accepted) => this._onTollChoice(accepted));
        this.gameover = new GameOverScreen(
            () => this._startGame(),
            () => this.fsm.transition('port-hub')
        );
        this.menu = new MenuScreen(
            () => this._startGame(),
            () => this.fsm.transition('port-hub')
        );
        this.portHub = new PortHub(
            () => this._startGame(),
            this.save
        );

        this._wakeTimer = 0;

        this.fsm = new StateMachine({
            'menu': {
                onEnter: () => {
                    this.menu.show();
                    this.hud.hide();
                    this.gameover.hide();
                    this.tollDialog.hide();
                    this.portHub.hide();
                },
                onExit: () => this.menu.hide(),
            },
            'playing': {
                onEnter: () => {
                    this.hud.show();
                    this.tollDialog.hide();
                },
                onExit: () => {},
            },
            'toll': {
                onEnter: (data) => {
                    this.tollDialog.show(data.percent);
                },
                onExit: () => this.tollDialog.hide(),
            },
            'gameover': {
                onEnter: () => {
                    this.hud.hide();
                    this.audio.stopEngine();
                    const earned = this.save.addRun(
                        this.scoring.getDisplayScore(),
                        this.scoring.distance
                    );
                    this.gameover.show({
                        distance: this.scoring.distance,
                        score: this.scoring.getDisplayScore(),
                        tollsPaid: this.scoring.tollsPaid,
                        tollsRefused: this.scoring.tollsRefused,
                        nearMissCount: this.scoring.nearMissCount,
                        earned,
                    });
                },
                onExit: () => this.gameover.hide(),
            },
            'port-hub': {
                onEnter: () => {
                    this.hud.hide();
                    this.menu.hide();
                    this.gameover.hide();
                    this.portHub.show();
                },
                onExit: () => this.portHub.hide(),
            },
        }, 'menu');

        this._lastTime = 0;
        this._bound_loop = (t) => this._loop(t);

        window.addEventListener('resize', () => this._onResize());
    }

    start() {
        requestAnimationFrame(this._bound_loop);
    }

    _initRenderer() {
        const canvas = document.getElementById(CONFIG.CANVAS_ID);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x1a3050);
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x1a3050, 100, 200);

        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            0.1, 300
        );
        this.camera.position.set(
            CONFIG.CAMERA_POSITION.x,
            CONFIG.CAMERA_POSITION.y,
            CONFIG.CAMERA_POSITION.z
        );
        this.camera.lookAt(
            CONFIG.CAMERA_LOOKAT.x,
            CONFIG.CAMERA_LOOKAT.y,
            CONFIG.CAMERA_LOOKAT.z
        );

        const ambient = new THREE.AmbientLight(0x88aacc, 1.2);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.8);
        sun.position.set(20, 60, 30);

        const fill = new THREE.DirectionalLight(0x4488cc, 0.6);
        fill.position.set(-15, 30, -10);
        this.scene.add(fill);
        this.scene.add(sun);
    }

    _initPools() {
        this.pools = {
            mine: new Pool(() => new Mine(), CONFIG.POOL_MINES),
            drone: new Pool(() => new Drone(), CONFIG.POOL_DRONES),
            boat: new Pool(() => new FastBoat(), CONFIG.POOL_BOATS),
            projectile: new Pool(() => new Projectile(), CONFIG.POOL_PROJECTILES),
            powerup: new Pool(() => new Powerup(), CONFIG.POOL_POWERUPS),
            resource: new Pool(() => new Resource(), CONFIG.POOL_RESOURCES),
        };
    }

    _startGame() {
        this.audio.init();
        this.audio.playEngine();

        for (const key in this.pools) {
            this.pools[key].releaseAll();
        }

        this.tanker.maxHull = CONFIG.HULL_MAX + this.save.getUpgradeLevel('hull') * CONFIG.UPGRADES.hull.effect;
        this.tanker.reset();

        this.scoring.reset();
        this.toll.reset();
        this.inventory.reset();
        this.radio.reset();
        this.difficulty.update(0);
        this.spawner.ceasefireActive = false;

        this.fsm.transition('playing');
    }

    _loop(timestamp) {
        requestAnimationFrame(this._bound_loop);

        const delta = Math.min((timestamp - this._lastTime) / 1000, 0.05);
        this._lastTime = timestamp;

        try {
            if (this.fsm.is('playing')) {
                this._update(delta);
            } else if (this.fsm.is('toll')) {
                this.water.update(delta * 0.2, this.scoring.distance);
                this.particles.update(delta, 0);
            }
        } catch (e) {
            console.error('Game loop error:', e);
        }

        this.renderer.render(this.scene, this.camera);
    }

    _update(delta) {
        this.input.update();
        this.difficulty.update(this.scoring.distance);

        const scrollSpeed = this.difficulty.getScrollSpeed();
        const straitHalfWidth = this.difficulty.getStraitHalfWidth();

        this.tanker.update(delta, {
            input: this.input,
            straitHalfWidth,
        });

        const ctx = {
            scrollSpeed,
            tankerX: this.tanker.x,
            tankerZ: this.tanker.z,
            spawnProjectile: (x, z, vx, vz, dmg) => this._spawnProjectile(x, z, vx, vz, dmg),
        };

        for (const key in this.pools) {
            this.pools[key].forEach((entity) => {
                entity.update(delta, ctx);
            });
        }

        const poolArray = Object.values(this.pools);
        this.collision.check(this.tanker, poolArray, {
            particles: this.particles,
            audio: this.audio,
            inventory: this.inventory,
            releaseEntity: (e) => {
                for (const key in this.pools) {
                    this.pools[key].forEach((item) => {
                        if (item === e) this.pools[key].release(item);
                    });
                }
            },
            addScore: (pts) => this.scoring.addScore(pts),
        });

        this.scoring.update(delta, scrollSpeed, this.collision.nearMisses);
        this.spawner.update(delta, this.difficulty, straitHalfWidth, this.scoring.distance);
        this.spawner.despawnOffscreen(this.pools);

        const powerupSlot = this.input.consumePowerupActivation();
        if (powerupSlot >= 0) {
            this.inventory.activate(powerupSlot, {
                freezeDrones: (freeze) => this._freezeDrones(freeze),
                activateCeasefire: (active) => this._activateCeasefire(active),
                deployOilSlick: () => {},
            });
        }
        this.inventory.update(delta, {
            freezeDrones: (freeze) => this._freezeDrones(freeze),
            activateCeasefire: (active) => this._activateCeasefire(active),
        });

        const tollOffer = this.toll.update(this.scoring.distance);
        if (tollOffer) {
            this.fsm.transition('toll', tollOffer);
        }

        this.water.update(delta, this.scoring.distance);
        this.terrain.update(delta, scrollSpeed, straitHalfWidth);
        this.particles.update(delta, scrollSpeed);
        this.radio.update(delta, this.scoring.distance, this.audio);

        this._wakeTimer += delta;
        if (this._wakeTimer > 0.08) {
            this._wakeTimer = 0;
            this.particles.spawnWake(this.tanker.x, this.tanker.z, scrollSpeed);
            this.particles.spawnSpeedLines(scrollSpeed);
        }

        this.hud.update({
            hull: this.tanker.hull,
            maxHull: this.tanker.maxHull,
            score: this.scoring.getDisplayScore(),
            distance: this.scoring.distance,
            multiplier: this.scoring.multiplier,
            phaseName: this.difficulty.phaseName,
            boostCooldown: this.tanker.boostCooldown,
            inventory: this.inventory.slots,
            ceasefireActive: this.inventory.isCeasefireActive(),
        });

        if (this.tanker.isDead()) {
            this.particles.spawnExplosion(this.tanker.x, 2, this.tanker.z);
            this.audio.playSFX('explosion');
            this.fsm.transition('gameover');
        }
    }

    _spawnProjectile(x, z, vx, vz, damage) {
        const p = this.pools.projectile.acquire();
        if (!p) return;
        p.init(x, z, vx, vz, damage);
        if (!p.mesh.parent) this.scene.add(p.mesh);
    }

    _freezeDrones(freeze) {
        if (freeze) {
            this.audio.playSFX('ceasefire');
            this.radio.showCustom('COMMAND', 'Flare deployed — drones scattered!', this.audio);
        }
        this.pools.drone.forEach((d) => { d.frozen = freeze; });
    }

    _activateCeasefire(active) {
        this.spawner.ceasefireActive = active;
        if (active) {
            this.audio.playSFX('ceasefire');
            this.radio.showCustom('COMMAND', 'Ceasefire holding… for now.', this.audio);
            this.pools.drone.forEach((d) => { d.frozen = true; });
            this.pools.boat.forEach((b) => { b.frozen = true; });
        } else {
            this.radio.showCustom('COMMAND', 'Ceasefire collapsed! Brace!', this.audio);
            this.pools.drone.forEach((d) => { d.frozen = false; });
            this.pools.boat.forEach((b) => { b.frozen = false; });
        }
    }

    _onTollChoice(accepted) {
        this.toll.resolve(accepted, this.scoring);
        if (accepted) {
            this.radio.showCustom('TRUMP', 'Smart move. Sometimes you gotta pay to play.', this.audio);
        } else {
            this.radio.showCustom('BIBI', 'Brave. Israel respects courage.', this.audio);
        }
        this.fsm.transition('playing');
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
