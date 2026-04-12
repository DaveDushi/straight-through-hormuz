import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { clamp } from '../utils/math-utils.js';
import { Entity } from './entity.js';

export class Tanker extends Entity {
    constructor() {
        super();
        this.type = 'tanker';
        this.halfW = CONFIG.TANKER_WIDTH / 2;
        this.halfH = CONFIG.TANKER_LENGTH / 2;
        this.lateralVelocity = 0;
        this.boostTimer = 0;
        this.boostCooldown = 0;
        this.hull = CONFIG.HULL_MAX;
        this.invulnTimer = 0;
        this.maxHull = CONFIG.HULL_MAX;
        this.oilBoostActive = false;
        this.pakFlagActive = false;
        this.ceasefireActive = false;
        this._buildMesh();
    }

    _buildMesh() {
        const group = new THREE.Group();
        const W = CONFIG.TANKER_WIDTH;
        const L = CONFIG.TANKER_LENGTH;

        // Hull - tapered shape using a custom geometry
        const hullShape = new THREE.Shape();
        const hw = W / 2;
        const hl = L / 2;
        hullShape.moveTo(-hw * 0.7, hl);         // stern left
        hullShape.lineTo(-hw, hl * 0.5);          // widen
        hullShape.lineTo(-hw, -hl * 0.3);         // full width
        hullShape.lineTo(-hw * 0.6, -hl * 0.8);   // start taper
        hullShape.lineTo(0, -(hl + 2));            // bow point (forward)
        hullShape.lineTo(hw * 0.6, -hl * 0.8);
        hullShape.lineTo(hw, -hl * 0.3);
        hullShape.lineTo(hw, hl * 0.5);
        hullShape.lineTo(hw * 0.7, hl);
        hullShape.closePath();

        const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 2.2, bevelEnabled: false });
        hullGeo.rotateX(-Math.PI / 2);
        hullGeo.translate(0, 1.1, 0);
        const hullMat = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 30 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        group.add(hull);

        // Red waterline
        const wlGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.4, bevelEnabled: false });
        wlGeo.rotateX(-Math.PI / 2);
        wlGeo.translate(0, 0.2, 0);
        const wl = new THREE.Mesh(wlGeo, new THREE.MeshPhongMaterial({ color: 0xcc3333 }));
        group.add(wl);

        // Deck
        const deckGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.15, bevelEnabled: false });
        deckGeo.rotateX(-Math.PI / 2);
        deckGeo.translate(0, 2.2, 0);
        const deck = new THREE.Mesh(deckGeo, new THREE.MeshPhongMaterial({ color: 0xAA8855 }));
        group.add(deck);

        // Deck pipes (two rows along the ship)
        const pipeMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        for (let side = -1; side <= 1; side += 2) {
            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, L * 0.7, 6),
                pipeMat
            );
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(side * W * 0.25, 2.45, -L * 0.05);
            group.add(pipe);
        }

        // Bridge / superstructure at stern
        const bridgeW = W * 0.55;
        const bridgeGeo = new THREE.BoxGeometry(bridgeW, 3, L * 0.18);
        const bridgeMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x222222 });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(0, 3.8, -L * 0.32);
        group.add(bridge);

        // Bridge windows
        const winMat = new THREE.MeshBasicMaterial({ color: 0x66ccff });
        const winGeo = new THREE.BoxGeometry(bridgeW * 0.85, 0.5, 0.05);
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(0, 4.3, -L * 0.32 + L * 0.09 + 0.05);
        group.add(win);

        // Funnel / smokestack
        const funnel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 1.8, 8),
            new THREE.MeshPhongMaterial({ color: 0xda0000 })
        );
        funnel.position.set(0, 6, -L * 0.35);
        group.add(funnel);

        // Funnel top ring
        const funnelRing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8),
            new THREE.MeshPhongMaterial({ color: 0x111111 })
        );
        funnelRing.position.set(0, 6.9, -L * 0.35);
        group.add(funnelRing);

        // Mast at front
        const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6),
            pipeMat
        );
        mast.position.set(0, 3.6, L * 0.25);
        group.add(mast);

        // Navigation light on bow
        const navLight = new THREE.PointLight(0xffffaa, 0.8, 25);
        navLight.position.set(0, 3, L / 2 + 1);
        group.add(navLight);

        // Stern running lights
        const redLight = new THREE.PointLight(0xff2200, 0.3, 8);
        redLight.position.set(-W / 2, 2.5, -L * 0.4);
        group.add(redLight);
        const greenLight = new THREE.PointLight(0x00ff22, 0.3, 8);
        greenLight.position.set(W / 2, 2.5, -L * 0.4);
        group.add(greenLight);

        // === Active powerup visuals ===

        // Pak Flag on mast
        this._pakFlagVisual = new THREE.Group();
        const pfFlagMat = new THREE.MeshPhongMaterial({
            color: 0x01411C, emissive: 0x002210, side: THREE.DoubleSide
        });
        const pfFlag = new THREE.Mesh(
            new THREE.PlaneGeometry(1.0, 0.65),
            pfFlagMat
        );
        pfFlag.position.set(0.56, 0, 0);
        this._pakFlagVisual.add(pfFlag);
        const pfWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const pfStripe = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, 0.65),
            pfWhiteMat
        );
        pfStripe.position.set(0.08, 0, 0.01);
        this._pakFlagVisual.add(pfStripe);
        const pfCrescent = new THREE.Mesh(
            new THREE.TorusGeometry(0.12, 0.03, 8, 12, Math.PI * 1.3),
            pfWhiteMat
        );
        pfCrescent.position.set(0.65, 0.05, 0.02);
        pfCrescent.rotation.z = Math.PI * 0.2;
        this._pakFlagVisual.add(pfCrescent);
        const pfStar = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.06, 0),
            pfWhiteMat
        );
        pfStar.position.set(0.82, 0.05, 0.02);
        this._pakFlagVisual.add(pfStar);
        this._pakFlagVisual.position.set(0, 4.85, L * 0.25);
        this._pakFlagVisual.visible = false;
        group.add(this._pakFlagVisual);

        // Oil exhaust glow at stern
        this._oilExhaust = new THREE.Group();
        this._oilExhaustGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xFF6600, transparent: true, opacity: 0.5
            })
        );
        this._oilExhaust.add(this._oilExhaustGlow);
        this._oilExhaust.add(new THREE.PointLight(0xFF8800, 1.5, 12));
        this._oilExhaust.position.set(0, 2, -L * 0.48);
        this._oilExhaust.visible = false;
        this._oilExhaustTime = 0;
        group.add(this._oilExhaust);

        // Ceasefire white flag on bridge
        this._ceasefireVisual = new THREE.Group();
        const cfPoleMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const cfPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6),
            cfPoleMat
        );
        cfPole.position.y = 0.75;
        this._ceasefireVisual.add(cfPole);
        const cfFlagMat = new THREE.MeshPhongMaterial({
            color: 0xffffff, emissive: 0x333333, side: THREE.DoubleSide
        });
        const cfFlag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.5),
            cfFlagMat
        );
        cfFlag.position.set(0.44, 1.2, 0);
        this._ceasefireVisual.add(cfFlag);
        this._ceasefireVisual.position.set(0, 5.3, -L * 0.32);
        this._ceasefireVisual.visible = false;
        group.add(this._ceasefireVisual);

        this.mesh = group;
        this.bodyMat = hullMat;
    }

    reset() {
        this.x = 0;
        this.z = 0;
        this.lateralVelocity = 0;
        this.hull = this.maxHull;
        this.boostTimer = 0;
        this.boostCooldown = 0;
        this.invulnTimer = 0;
        this.oilBoostActive = false;
        this.pakFlagActive = false;
        this.ceasefireActive = false;
        this.active = true;
        if (this._pakFlagVisual) this._pakFlagVisual.visible = false;
        if (this._oilExhaust) this._oilExhaust.visible = false;
        if (this._ceasefireVisual) this._ceasefireVisual.visible = false;
        this._oilExhaustTime = 0;
        this.syncMesh();
    }

    update(delta, context) {
        const { input, straitHalfWidth, scrollSpeed } = context;

        if (this.invulnTimer > 0) {
            this.invulnTimer -= delta;
            if (this.pakFlagActive) {
                this.mesh.visible = true;
                this.bodyMat.emissive.setHex(0x01411C);
            } else {
                this.mesh.visible = Math.floor(this.invulnTimer * 10) % 2 === 0;
            }
        } else {
            this.mesh.visible = true;
            if (!this.pakFlagActive) this.bodyMat.emissive.setHex(0x000000);
        }

        if (this.boostCooldown > 0) this.boostCooldown -= delta;
        if (this.boostTimer > 0) this.boostTimer -= delta;

        if (input.consumeBoostTrigger() && this.boostCooldown <= 0) {
            this.boostTimer = CONFIG.TANKER_BOOST_DURATION;
            this.boostCooldown = CONFIG.TANKER_BOOST_COOLDOWN;
        }

        let steerMult = this.boostTimer > 0 ? CONFIG.TANKER_BOOST_MULTIPLIER : 1;
        if (this.oilBoostActive) steerMult *= CONFIG.OIL_BOOST_SPEED_MULT;
        let speedPenalty = this.hull < CONFIG.HULL_FIRE_THRESHOLD ? CONFIG.HULL_SPEED_PENALTY_FACTOR : 1;

        this.lateralVelocity += -input.steer * CONFIG.TANKER_STEER_SPEED * steerMult * delta;
        this.lateralVelocity *= CONFIG.TANKER_INERTIA;
        this.lateralVelocity = clamp(
            this.lateralVelocity,
            -CONFIG.TANKER_MAX_LATERAL_SPEED * speedPenalty,
            CONFIG.TANKER_MAX_LATERAL_SPEED * speedPenalty
        );

        this.x += this.lateralVelocity * delta;
        this.x = clamp(this.x, -straitHalfWidth + this.halfW, straitHalfWidth - this.halfW);

        this.z += scrollSpeed * delta;

        this.mesh.rotation.y = -this.lateralVelocity * 0.015;

        // Active powerup visuals
        this._pakFlagVisual.visible = this.pakFlagActive;
        this._ceasefireVisual.visible = this.ceasefireActive;
        this._oilExhaust.visible = this.oilBoostActive;
        if (this.oilBoostActive) {
            this._oilExhaustTime += delta;
            this._oilExhaustGlow.material.opacity = 0.3 + Math.sin(this._oilExhaustTime * 12) * 0.2;
            this._oilExhaustGlow.scale.setScalar(0.8 + Math.sin(this._oilExhaustTime * 8) * 0.3);
        }

        this.syncMesh();
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return;
        this.hull = Math.max(0, this.hull - amount);
        this.invulnTimer = CONFIG.HULL_INVULNERABILITY_TIME;

        this.bodyMat.emissive.setHex(0xff0000);
        setTimeout(() => this.bodyMat.emissive.setHex(0x000000), 200);
    }

    repair(amount) {
        this.hull = Math.min(this.maxHull, this.hull + amount);
    }

    isDead() {
        return this.hull <= 0;
    }
}
