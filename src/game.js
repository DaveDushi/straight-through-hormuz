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
import { Blockade } from './entities/blockade.js';
import { IronBeamSystem } from './systems/iron-beam.js';
import { BlockadeSystem } from './systems/blockade-system.js';
import { HUD } from './ui/hud.js';
import { MenuScreen } from './ui/menu.js';
import { GameOverScreen } from './ui/gameover.js';
import { TollDialog } from './ui/toll-dialog.js';
import { RadioUI } from './ui/radio.js';
import { PortHub } from './ui/port-hub.js';
import { VictoryScreen } from './ui/victory.js';
import { SaveManager } from './save.js';
import { quality } from './utils/quality-manager.js';
import { CameraController } from './utils/camera-controller.js';
import { Tutorial } from './systems/tutorial.js';
import { TutorialUI } from './ui/tutorial-ui.js';
import { PauseScreen } from './ui/pause.js';
import { PortalSystem } from './portal/portal-system.js';
import { track } from './analytics.js';

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
        this.ironBeam = new IronBeamSystem(this.scene);
        this.blockadeSystem = new BlockadeSystem();
        this.ceasefireShootingDisabled = false;
        this.gameOverReason = null;

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
            this.save,
            () => this.fsm.transition('menu')
        );
        this.victory = new VictoryScreen(
            () => this._startGame(),
            () => this.fsm.transition('port-hub')
        );

        this.pause = new PauseScreen(
            () => this._resumeGame(),
            () => this._exitToHome()
        );

        this.tutorialUI = new TutorialUI(() => this._endTutorial());
        this.tutorial = new Tutorial(this.tutorialUI);
        this.portalSystem = new PortalSystem();

        this._wakeTimer = 0;

        // Mobile boost button
        this._boostBtn = document.getElementById('btn-boost');
        this._boostBtnLeft = document.getElementById('btn-boost-left');
        const boostHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.input.boostTriggered = true;
            if (navigator.vibrate) navigator.vibrate(15);
        };
        if (this._boostBtn) this._boostBtn.addEventListener('pointerdown', boostHandler);
        if (this._boostBtnLeft) this._boostBtnLeft.addEventListener('pointerdown', boostHandler);
        if (this.input.isTouchDevice) {
            document.body.classList.add('touch-device');
            CONFIG.isMobile = true;
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
            if (isPWA) {
                try {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(() => {});
                    }
                } catch (e) {}
            }
            this._showOrientationBanner();
        }

        this._pauseBtn = document.getElementById('btn-pause');
        if (this._pauseBtn) {
            this._pauseBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._pauseGame();
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.fsm.is('playing')) {
                    this._pauseGame();
                } else if (this.fsm.is('paused')) {
                    this._resumeGame();
                }
            }
        });

        this.fsm = new StateMachine({
            'menu': {
                onEnter: () => {
                    this.menu.show();
                    this.hud.hide();
                    this.gameover.hide();
                    this.victory.hide();
                    this.tollDialog.hide();
                    this.pause.hide();
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
                    this.tollDialog.show(data.cost, this.save.data.currency);
                },
                onExit: () => this.tollDialog.hide(),
            },
            'paused': {
                onEnter: () => {
                    this.pause.show();
                    this.audio.stopEngine();
                    this.audio.stopVoice();
                },
                onExit: () => {
                    this.pause.hide();
                },
            },
            'gameover': {
                onEnter: () => {
                    this.hud.hide();
                    this.audio.stopEngine();
                    this.audio.stopVoice();
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
                        earned: earned,
                        reason: this.gameOverReason,
                    });
                },
                onExit: () => this.gameover.hide(),
            },
            'victory': {
                onEnter: () => {
                    this.hud.hide();
                    this.audio.stopEngine();
                    this.audio.stopVoice();
                    const earned = this.save.addRun(
                        this.scoring.getDisplayScore(),
                        this.scoring.distance
                    );
                    this.victory.show({
                        distance: this.scoring.distance,
                        score: this.scoring.getDisplayScore(),
                        tollsPaid: this.scoring.tollsPaid,
                        tollsRefused: this.scoring.tollsRefused,
                        nearMissCount: this.scoring.nearMissCount,
                        earned: earned,
                    });
                },
                onExit: () => this.victory.hide(),
            },
            'port-hub': {
                onEnter: () => {
                    this.hud.hide();
                    this.menu.hide();
                    this.gameover.hide();
                    this.victory.hide();
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
        this.portalSystem.init(this);
        requestAnimationFrame(this._bound_loop);
    }

    _initRenderer() {
        const canvas = document.getElementById(CONFIG.CANVAS_ID);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.tier !== 'low' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.settings.pixelRatioCap));
        this.renderer.setClearColor(0x2a7888);
        quality.bindRenderer(this.renderer);
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x2a7888, quality.settings.fogNear, quality.settings.fogFar);

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

        this.cameraController = new CameraController(this.camera, CONFIG.CAMERA_POSITION, CONFIG.CAMERA_LOOKAT);
        this._adjustCameraForAspect();

        const ambient = new THREE.AmbientLight(0xddeedd, 1.2);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.8);
        sun.position.set(20, 60, 30);

        const fill = new THREE.DirectionalLight(0x88bbdd, 0.6);
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
            blockade: new Pool(() => new Blockade(), CONFIG.POOL_BLOCKADES),
        };
    }

    _startGame() {
        this.audio.init();
        this.audio.applyMuteState();
        this.audio.preloadVoice();
        this.audio.playEngine();

        for (const key in this.pools) {
            this.pools[key].releaseAll();
        }

        this.tanker.maxHull = CONFIG.HULL_MAX + this.save.getUpgradeLevel('hull') * CONFIG.UPGRADES.hull.effect;
        this.tanker.steerSpeedBonus = this.save.getUpgradeLevel('rudder') * CONFIG.UPGRADES.rudder.effect;

        const fuelLevel = this.save.getUpgradeLevel('fuelTank');
        this.tanker.maxFuel = CONFIG.TANKER_FUEL_MAX + fuelLevel * CONFIG.UPGRADES.fuelTank.effect;
        this.tanker.fuelRegenCap = CONFIG.TANKER_FUEL_REGEN_CAP + fuelLevel * 3;

        this.tanker.wallDamageReduction = this.save.getUpgradeLevel('reinforcedBow') * CONFIG.UPGRADES.reinforcedBow.effect;
        this.tanker.reset();

        const slotCount = 1 + this.save.getUpgradeLevel('cargoHold') * CONFIG.UPGRADES.cargoHold.effect;
        this.scoring.reset();
        this.hud.resetPickupNotifications();
        this.hud.setSlotCount(slotCount);
        this.collision.reset();
        this.toll.reset();
        this.inventory.reset(slotCount);
        this.radio.reset();
        this.difficulty.update(0);
        this.terrain.reset();
        this.ironBeam.reset(this.save.getUpgradeLevel('ironBeam'), this.save.getUpgradeLevel('radar'));
        this.blockadeSystem.reset();
        this.spawner.spawnRateMultiplier = 1;
        this.spawner.spawnRateBoostTimer = 0;
        this.ceasefireShootingDisabled = false;
        this.gameOverReason = null;
        this.portalSystem.reset();

        this.fsm.transition('playing');

        track('game_start', {
            run_number: this.save.data.totalRuns + 1,
            upgrades: JSON.stringify(this.save.data.upgrades),
        });

        if (this.save.data.totalRuns === 0 && !this.save.data.tutorialComplete) {
            this.tutorial.start(this);
        }
    }

    _pauseGame() {
        if (!this.fsm.is('playing')) return;
        this.fsm.transition('paused');
        track('game_paused', { distance: Math.round(this.scoring.distance) });
    }

    _resumeGame() {
        if (!this.fsm.is('paused')) return;
        this.fsm.transition('playing');
        this.audio.playEngine();
        this.audio.applyMuteState();
    }

    _exitToHome() {
        if (!this.fsm.is('paused')) return;

        for (const key in this.pools) {
            this.pools[key].releaseAll();
        }
        this.inventory.reset(1);
        this.radio.reset();
        this.ironBeam.reset(0, 0);
        this.blockadeSystem.reset();

        if (this.tutorial.active) {
            this.tutorial.active = false;
            this.tutorialUI.hide();
        }

        track('game_exit_to_home', { distance: Math.round(this.scoring.distance) });
        this.fsm.transition('menu');
    }

    _endTutorial() {
        this.tutorial.end(this);
    }

    _loop(timestamp) {
        requestAnimationFrame(this._bound_loop);

        const delta = Math.min((timestamp - this._lastTime) / 1000, 0.05);
        this._lastTime = timestamp;

        try {
            if (this.fsm.is('playing')) {
                this._update(delta);
            } else if (this.fsm.is('toll') || this.fsm.is('paused')) {
                this.water.update(delta * 0.2, this.scoring.distance, this.tanker.z);
                this.particles.update(delta, 0);
            }
        } catch (e) {
            console.error('Game loop error:', e);
        }

        this.renderer.render(this.scene, this.camera);
        quality.sampleFrame(delta);
    }

    _update(delta) {
        if (this.tutorial.active) {
            this.tutorial.update(delta, this);
            return;
        }

        this.input.update();
        this.difficulty.update(this.scoring.distance);

        const baseScrollSpeed = this.difficulty.getScrollSpeed();
        const scrollSpeed = this.tanker.oilBoostActive ? baseScrollSpeed * CONFIG.OIL_BOOST_SPEED_MULT : baseScrollSpeed;
        const straitHalfWidth = this.difficulty.getStraitHalfWidth()
            + this.portalSystem.getExtraWidth(this.tanker.z);

        this.tanker.update(delta, {
            input: this.input,
            straitHalfWidth,
            scrollSpeed,
        });

        const ctx = {
            scrollSpeed,
            tankerX: this.tanker.x,
            tankerZ: this.tanker.z,
            spawnProjectile: (x, z, vx, vz, dmg) => this._spawnProjectile(x, z, vx, vz, dmg),
            ceasefireShootingDisabled: this.ceasefireShootingDisabled,
        };

        for (const key in this.pools) {
            this.pools[key].forEach((entity) => {
                entity.update(delta, ctx);
            });
        }

        // Iron beam evaluates drones before collision
        const releaseEntity = (e) => {
            for (const key in this.pools) {
                this.pools[key].forEach((item) => {
                    if (item === e) this.pools[key].release(item);
                });
            }
        };
        this.ironBeam.update(delta, this.pools.drone, this.tanker, this.particles, this.audio, releaseEntity);
        this.portalSystem.update(delta, this);

        const poolArray = Object.values(this.pools);
        const prevHull = this.tanker.hull;
        this.collision.check(this.tanker, poolArray, {
            particles: this.particles,
            audio: this.audio,
            inventory: this.inventory,
            ironBeam: this.ironBeam,
            ceasefireActive: this.ceasefireShootingDisabled,
            releaseEntity,
            addScore: (pts) => this.scoring.addScore(pts),
            notifyPickup: (type) => this.hud.showPickupNotification(type),
        });

        if (this.tanker.wallHitThisFrame) {
            this.audio.playSFX('scrape');
            this.cameraController.triggerShake(0.5);
        }

        // Damage flash + camera shake when hull drops
        if (this.tanker.hull < prevHull) {
            this.hud.flashDamage();
            this.cameraController.triggerShake(1.5);
        }

        // Steer indicators
        this.hud.updateSteerIndicators(this.input.steer);

        this.scoring.update(delta, scrollSpeed, this.collision.nearMisses);
        this.spawner.update(delta, this.difficulty, straitHalfWidth, this.scoring.distance, this.tanker.z);
        this.spawner.despawnOffscreen(this.pools, this.tanker.z);

        const powerupCtx = {
            activateOilBoost: (active) => this._activateOilBoost(active),
            activateCeasefire: (active) => this._activateCeasefire(active),
            activatePakFlag: (active) => this._activatePakFlag(active),
        };
        const powerupSlot = this.input.consumePowerupActivation();
        if (powerupSlot >= 0) {
            const powerupType = this.inventory.slots[powerupSlot];
            if (powerupType) {
                track('powerup_used', {
                    powerup: powerupType,
                    distance: Math.round(this.scoring.distance),
                });
            }
            this.inventory.activate(powerupSlot, powerupCtx);
        }
        this.inventory.update(delta, powerupCtx);

        const tollOffer = this.toll.update(this.scoring.distance, this.save);
        if (tollOffer) {
            this.fsm.transition('toll', tollOffer);
        }

        this.water.update(delta, this.scoring.distance, this.tanker.z);
        this.terrain.update(delta, this.tanker.z, straitHalfWidth);
        this.particles.update(delta, scrollSpeed);

        // Blockade system
        this.blockadeSystem.update(this.tanker.z, this.pools.blockade, this.scene, this.radio, this.audio);

        this.radio.update(delta, this.scoring.distance, this.audio);

        this._wakeTimer += delta;
        if (this._wakeTimer > 0.08) {
            this._wakeTimer = 0;
            this.particles.spawnWake(this.tanker.x, this.tanker.z, scrollSpeed);
            this.particles.spawnSpeedLines(scrollSpeed, this.tanker.z);
        }

        this.hud.update({
            hull: this.tanker.hull,
            maxHull: this.tanker.maxHull,
            score: this.scoring.getDisplayScore(),
            distance: this.scoring.distance,
            yuan: this.save.data.currency,
            multiplier: this.scoring.multiplier,
            phaseName: this.difficulty.phaseName,
            fuel: this.tanker.fuel,
            maxFuel: this.tanker.maxFuel,
            inventory: this.inventory.slots,
            ceasefireActive: this.inventory.isCeasefireActive(),
            pakFlagActive: this.inventory.isPakFlagActive(),
            oilBoostActive: this.inventory.isOilBoostActive(),
        });

        // Camera follows tanker + sway/shake
        this.cameraController.update(delta, this.tanker.z);

        if (this.scoring.distance >= CONFIG.WIN_DISTANCE) {
            this.fsm.transition('victory');
        } else if (this.blockadeSystem.checkCollision(this.tanker)) {
            this.gameOverReason = 'blockade';
            this.audio.playSFX('explosion');
            this.cameraController.triggerShake(3.0);
            this.fsm.transition('gameover');
        } else if (this.tanker.isDead()) {
            this.particles.spawnExplosion(this.tanker.x, 2, this.tanker.z);
            this.audio.playSFX('explosion');
            this.cameraController.triggerShake(3.0);
            this.fsm.transition('gameover');
        }
    }

    _spawnProjectile(x, z, vx, vz, damage) {
        const p = this.pools.projectile.acquire();
        if (!p) return;
        p.init(x, z, vx, vz, damage);
        if (!p.mesh.parent) this.scene.add(p.mesh);
    }

    _activateOilBoost(active) {
        this.tanker.oilBoostActive = active;
        if (active) {
            this.audio.playSFX('boost');
            this.radio.showCustom('COMMAND', 'Oil reserves tapped — full speed ahead!', this.audio, 'oil-reserves-tapped---full-spe.wav');
        }
    }

    _activateCeasefire(active) {
        this.ceasefireShootingDisabled = active;
        this.spawner.ceasefireActive = active;
        this.tanker.ceasefireActive = active;
        if (active) {
            this.audio.playSFX('ceasefire');
            this.radio.showCustom('COMMAND', 'Ceasefire holding… all shooting stopped.', this.audio, 'ceasefire-holding--all-shootin.wav');
            // Clear all projectiles in the air
            this.pools.projectile.releaseAll();
        } else {
            this.radio.showCustom('COMMAND', 'Ceasefire collapsed! Brace!', this.audio, 'ceasefire-collapsed--brace-.wav');
        }
    }

    _activatePakFlag(active) {
        this.tanker.pakFlagActive = active;
        if (active) {
            this.tanker.invulnTimer = CONFIG.PAK_FLAG_DURATION;
            this.audio.playSFX('ceasefire');
            this.radio.showCustom('COMMAND', 'Pakistan stands with you! Full protection!', this.audio, 'pakistan-stands-with-you--full.wav');
        } else {
            this.tanker.bodyMat.emissive.setHex(0x000000);
        }
    }

    _onTollChoice(accepted) {
        track('toll_decision', {
            decision: accepted ? 'accepted' : 'refused',
            toll_cost: this.toll.pendingToll ? this.toll.pendingToll.cost : 0,
            distance: Math.round(this.scoring.distance),
        });
        this.toll.resolve(accepted, this.scoring, this.save);
        if (accepted) {
            this.radio.showCustom('TRUMP', 'Smart move. Sometimes you gotta pay to play.', this.audio, 'smart-move--sometimes-you-gott.wav');
            this.blockadeSystem.scheduleTollBlockade(this.tanker.z, this.difficulty.getStraitHalfWidth());
        } else {
            this.radio.showCustom('BIBI', 'Brave. Israel respects courage.', this.audio, 'brave--israel-respects-courage.wav');
            this.spawner.spawnRateMultiplier = CONFIG.TOLL_REFUSE_SPAWN_MULTIPLIER;
            this.spawner.spawnRateBoostTimer = 10;
        }
        this.fsm.transition('playing');
    }

    _adjustCameraForAspect() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;

        if (aspect < 1) {
            // Portrait / narrow: widen FOV + raise camera to show more of the strait
            const narrow = 1 - aspect;
            this.camera.fov = CONFIG.CAMERA_FOV + narrow * 25;
            this.cameraController.baseY = CONFIG.CAMERA_POSITION.y + narrow * 20;
        } else {
            this.camera.fov = CONFIG.CAMERA_FOV;
            this.cameraController.baseY = CONFIG.CAMERA_POSITION.y;
        }

        this.camera.updateProjectionMatrix();
    }

    _onResize() {
        this._adjustCameraForAspect();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _showOrientationBanner() {
        const banner = document.getElementById('rotate-overlay');
        if (!banner || sessionStorage.getItem('orientation-dismissed')) return;
        const dismiss = () => {
            banner.classList.add('fade-out');
            setTimeout(() => banner.remove(), 300);
            sessionStorage.setItem('orientation-dismissed', '1');
        };
        const btn = banner.querySelector('.rotate-dismiss');
        if (btn) btn.addEventListener('pointerup', dismiss);
        setTimeout(dismiss, 5000);
    }
}
