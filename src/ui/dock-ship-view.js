import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class DockShipView {
  constructor(container) {
    this.container = container;
    this._built = false;
    this._animId = null;
    this._time = 0;
    this._targetRotY = -0.5;
    this._currentRotY = -0.5;
    this._dragging = false;
    this._lastPointerX = 0;
    this._upgradeMeshes = {};
  }

  _build() {
    if (this._built) return;
    this._built = true;

    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setClearColor(0x1e4a54);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1e4a54, 60, 120);

    this.camera = new THREE.PerspectiveCamera(35, 2, 0.1, 200);
    this.camera.position.set(18, 14, 20);
    this.camera.lookAt(0, 1, 0);

    const ambient = new THREE.AmbientLight(0x88bbcc, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
    sun.position.set(10, 20, 15);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4488aa, 0.3);
    fill.position.set(-10, 5, -10);
    this.scene.add(fill);

    const waterGeo = new THREE.PlaneGeometry(200, 200);
    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x2a7888,
      shininess: 80,
      transparent: true,
      opacity: 0.85,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -0.2;
    this.scene.add(this.water);

    this._buildShip();
    this._bindDrag();
  }

  _buildShip() {
    const W = CONFIG.TANKER_WIDTH;
    const L = CONFIG.TANKER_LENGTH;
    this.shipGroup = new THREE.Group();

    // Hull shape
    const hullShape = new THREE.Shape();
    const hw = W / 2;
    const hl = L / 2;
    hullShape.moveTo(-hw * 0.7, hl);
    hullShape.lineTo(-hw, hl * 0.5);
    hullShape.lineTo(-hw, -hl * 0.3);
    hullShape.lineTo(-hw * 0.6, -hl * 0.8);
    hullShape.lineTo(0, -(hl + 2));
    hullShape.lineTo(hw * 0.6, -hl * 0.8);
    hullShape.lineTo(hw, -hl * 0.3);
    hullShape.lineTo(hw, hl * 0.5);
    hullShape.lineTo(hw * 0.7, hl);
    hullShape.closePath();

    // Hull body
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 2.2, bevelEnabled: false });
    hullGeo.rotateX(-Math.PI / 2);
    hullGeo.translate(0, 1.1, 0);
    this._hullMat = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 30 });
    this.shipGroup.add(new THREE.Mesh(hullGeo, this._hullMat));

    // Red waterline
    const wlGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.4, bevelEnabled: false });
    wlGeo.rotateX(-Math.PI / 2);
    wlGeo.translate(0, 0.2, 0);
    this.shipGroup.add(new THREE.Mesh(wlGeo, new THREE.MeshPhongMaterial({ color: 0xcc3333 })));

    // Deck
    const deckGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.15, bevelEnabled: false });
    deckGeo.rotateX(-Math.PI / 2);
    deckGeo.translate(0, 2.2, 0);
    this.shipGroup.add(new THREE.Mesh(deckGeo, new THREE.MeshPhongMaterial({ color: 0xAA8855 })));

    // Deck pipes
    const pipeMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    for (let side = -1; side <= 1; side += 2) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, L * 0.7, 6), pipeMat
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(side * W * 0.25, 2.45, -L * 0.05);
      this.shipGroup.add(pipe);
    }

    // Bridge
    const bridgeW = W * 0.55;
    const bridgeMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x222222 });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 3, L * 0.18), bridgeMat);
    bridge.position.set(0, 3.8, -L * 0.32);
    this.shipGroup.add(bridge);

    // Bridge windows
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeW * 0.85, 0.5, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x66ccff })
    );
    win.position.set(0, 4.3, -L * 0.32 + L * 0.09 + 0.05);
    this.shipGroup.add(win);

    // Funnel
    const funnel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.8, 8),
      new THREE.MeshPhongMaterial({ color: 0xda0000 })
    );
    funnel.position.set(0, 6, -L * 0.35);
    this.shipGroup.add(funnel);

    const funnelRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8),
      new THREE.MeshPhongMaterial({ color: 0x111111 })
    );
    funnelRing.position.set(0, 6.9, -L * 0.35);
    this.shipGroup.add(funnelRing);

    // Mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), pipeMat
    );
    mast.position.set(0, 3.6, L * 0.25);
    this.shipGroup.add(mast);

    // Nav light
    const navLight = new THREE.PointLight(0xffffaa, 0.8, 25);
    navLight.position.set(0, 3, L / 2 + 1);
    this.shipGroup.add(navLight);

    // Running lights
    const redLight = new THREE.PointLight(0xff2200, 0.3, 8);
    redLight.position.set(-W / 2, 2.5, -L * 0.4);
    this.shipGroup.add(redLight);
    const greenLight = new THREE.PointLight(0x00ff22, 0.3, 8);
    greenLight.position.set(W / 2, 2.5, -L * 0.4);
    this.shipGroup.add(greenLight);

    this._buildUpgradeSlots();

    this.shipGroup.position.set(0, 0, 0);
    this.scene.add(this.shipGroup);
  }

  _buildUpgradeSlots() {
    const W = CONFIG.TANKER_WIDTH;
    const L = CONFIG.TANKER_LENGTH;
    const metalMat = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 60 });
    const goldMat = new THREE.MeshPhongMaterial({ color: 0xccaa44, shininess: 80, emissive: 0x332200 });

    // === RUDDER: Large rudder fin at stern, grows with level ===
    this._upgradeMeshes.rudder = [];
    for (let i = 0; i < 5; i++) {
      const h = 0.6 + i * 0.25;
      const w = 0.3 + i * 0.08;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 0.08),
        i >= 3 ? goldMat.clone() : metalMat.clone()
      );
      fin.position.set(0, -0.2 + h / 2, L * 0.48 + 0.1);
      fin.visible = false;
      this.shipGroup.add(fin);
      this._upgradeMeshes.rudder.push(fin);
    }

    // === HULL: Armor plates along the sides, more = tougher ===
    this._upgradeMeshes.hull = [];
    const plateMat = new THREE.MeshPhongMaterial({ color: 0x556677, shininess: 40 });
    const plateMatHeavy = new THREE.MeshPhongMaterial({ color: 0x445566, shininess: 50, emissive: 0x111122 });
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group();
      const zPos = L * 0.2 - i * L * 0.15;
      const mat = i >= 3 ? plateMatHeavy : plateMat;
      for (let side = -1; side <= 1; side += 2) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 1.2 + i * 0.15, L * 0.12),
          mat
        );
        plate.position.set(side * (W / 2 + 0.08), 1.2, zPos);
        group.add(plate);
      }
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.hull.push(group);
    }

    // === RADAR: Dish on top of bridge, larger each level ===
    this._upgradeMeshes.radar = [];
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const poleH = 1.0 + i * 0.4;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, poleH, 6),
        metalMat
      );
      pole.position.y = poleH / 2;
      group.add(pole);

      const dishR = 0.3 + i * 0.2;
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(dishR, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 90, side: THREE.DoubleSide })
      );
      dish.rotation.x = Math.PI;
      dish.position.y = poleH;
      group.add(dish);

      if (i === 2) {
        const glow = new THREE.PointLight(0x44ff88, 0.6, 8);
        glow.position.y = poleH + 0.2;
        group.add(glow);
      }

      group.position.set(0, 5.3, -L * 0.32);
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.radar.push(group);
    }

    // === TOLL DISCOUNT: Diplomatic flags / gold trim ===
    this._upgradeMeshes.tollDiscount = [];
    const flagColors = [0x2244aa, 0xeecc22, 0xff4444];
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const flagMat = new THREE.MeshPhongMaterial({
        color: flagColors[i], side: THREE.DoubleSide, emissive: 0x111111
      });
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), flagMat);
      const yOff = 4.0 - i * 0.7;
      flag.position.set(0.45, yOff, L * 0.25);
      group.add(flag);

      if (i >= 1) {
        for (let side = -1; side <= 1; side += 2) {
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, L * 0.5),
            goldMat
          );
          trim.position.set(side * (W / 2 - 0.1), 2.35, -L * 0.1);
          group.add(trim);
        }
      }

      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.tollDiscount.push(group);
    }

    // === IRON BEAM: Turret on foredeck ===
    this._upgradeMeshes.ironBeam = [];
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const baseR = 0.35 + i * 0.1;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(baseR, baseR + 0.05, 0.4, 8),
        new THREE.MeshPhongMaterial({ color: 0x445544, shininess: 40 })
      );
      base.position.y = 0;
      group.add(base);

      const barrelLen = 1.0 + i * 0.5;
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 + i * 0.02, 0.08 + i * 0.02, barrelLen, 6),
        new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 70 })
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.15, -barrelLen / 2);
      group.add(barrel);

      if (i >= 1) {
        const glow = new THREE.PointLight(i === 2 ? 0xff4422 : 0xff8844, 0.5, 6);
        glow.position.set(0, 0.2, -barrelLen);
        group.add(glow);
      }

      group.position.set(0, 2.55, L * 0.05 + i * 0.3);
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.ironBeam.push(group);
    }
  }

  applyUpgrades(upgrades) {
    if (!this._built) return;
    for (const [key, meshes] of Object.entries(this._upgradeMeshes)) {
      const level = upgrades[key] || 0;
      for (let i = 0; i < meshes.length; i++) {
        meshes[i].visible = false;
      }
      if (level > 0 && meshes[level - 1]) {
        meshes[level - 1].visible = true;
      }
    }

    // Hull color darkens with hull plating upgrades
    const hullLevel = upgrades.hull || 0;
    if (this._hullMat) {
      const r = 0x33 - hullLevel * 0x04;
      const g = 0x44 - hullLevel * 0x03;
      const b = 0x55 + hullLevel * 0x08;
      this._hullMat.color.setHex((r << 16) | (g << 8) | b);
    }
  }

  _bindDrag() {
    const el = this.canvas;
    let startX = 0;
    let startRotY = 0;

    const onDown = (e) => {
      this._dragging = true;
      startX = e.clientX ?? e.touches[0].clientX;
      startRotY = this._targetRotY;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e) => {
      if (!this._dragging) return;
      const x = e.clientX ?? e.touches[0].clientX;
      const dx = x - startX;
      this._targetRotY = startRotY + dx * 0.008;
    };

    const onUp = () => {
      this._dragging = false;
      el.style.cursor = 'grab';
    };

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
  }

  start() {
    this._build();
    this._resize();
    this._time = 0;
    this._animate();
  }

  stop() {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }

  _resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _animate() {
    this._animId = requestAnimationFrame(() => this._animate());
    this._time += 0.016;

    // Smooth rotation toward target
    this._currentRotY += (this._targetRotY - this._currentRotY) * 0.08;

    this.shipGroup.position.y = Math.sin(this._time * 0.8) * 0.15;
    this.shipGroup.rotation.y = this._currentRotY;
    this.shipGroup.rotation.z = Math.sin(this._time * 0.6) * 0.008;
    this.shipGroup.rotation.x = Math.sin(this._time * 0.5 + 1) * 0.005;

    // Spin radar dish
    if (this._upgradeMeshes.radar) {
      for (const g of this._upgradeMeshes.radar) {
        if (g.visible && g.children[1]) {
          g.children[1].rotation.y += 0.03;
        }
      }
    }

    this._resize();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
