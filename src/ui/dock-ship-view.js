import * as THREE from 'three';
import { CONFIG } from '../config.js';

const HIGHLIGHT_ROTATIONS = {
  rudder: 0.5,
  hull: -0.8,
  radar: 0.1,
  tollDiscount: -0.3,
  ironBeam: -1.2,
  fuelTank: -0.5,
  reinforcedBow: -1.6,
  cargoInsurance: -0.6,
};

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
    this._highlightedKey = null;
    this._hlMats = null;
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

    // === RUDDER: fin at stern, grows with level (8 levels) ===
    this._upgradeMeshes.rudder = [];
    for (let i = 0; i < 8; i++) {
      const h = 0.5 + i * 0.18;
      const w = 0.25 + i * 0.06;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 0.08),
        i >= 5 ? goldMat.clone() : metalMat.clone()
      );
      fin.position.set(0, -0.2 + h / 2, L * 0.48 + 0.1);
      fin.visible = false;
      this.shipGroup.add(fin);
      this._upgradeMeshes.rudder.push(fin);
    }

    // === HULL: Armor plates along sides (8 levels) ===
    this._upgradeMeshes.hull = [];
    const plateMat = new THREE.MeshPhongMaterial({ color: 0x7788aa, shininess: 60 });
    const plateMatHeavy = new THREE.MeshPhongMaterial({ color: 0x99aacc, shininess: 80, emissive: 0x112233 });
    for (let i = 0; i < 8; i++) {
      const group = new THREE.Group();
      const zPos = L * 0.25 - i * L * 0.09;
      const mat = i >= 5 ? plateMatHeavy : plateMat;
      for (let side = -1; side <= 1; side += 2) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 1.2 + i * 0.1, L * 0.08),
          mat
        );
        plate.position.set(side * (W / 2 + 0.1), 1.3, zPos);
        group.add(plate);
      }
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.hull.push(group);
    }

    // === RADAR: Dish on bridge (6 levels) ===
    this._upgradeMeshes.radar = [];
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const poleH = 0.8 + i * 0.25;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, poleH, 6),
        metalMat
      );
      pole.position.y = poleH / 2;
      group.add(pole);

      const dishR = 0.2 + i * 0.12;
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(dishR, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 90, side: THREE.DoubleSide })
      );
      dish.rotation.x = Math.PI;
      dish.position.y = poleH;
      group.add(dish);

      if (i >= 4) {
        const glow = new THREE.PointLight(0x44ff88, 0.3 + (i - 4) * 0.3, 8);
        glow.position.y = poleH + 0.2;
        group.add(glow);
      }

      group.position.set(0, 5.3, -L * 0.32);
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.radar.push(group);
    }

    // === TOLL DISCOUNT: Diplomatic flags / gold trim (5 levels) ===
    this._upgradeMeshes.tollDiscount = [];
    const flagColors = [0x2244aa, 0xeecc22, 0xff4444, 0x22aa44, 0xffffff];
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group();
      const flagMat = new THREE.MeshPhongMaterial({
        color: flagColors[i], side: THREE.DoubleSide, emissive: 0x111111
      });
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), flagMat);
      const yOff = 4.0 - i * 0.5;
      flag.position.set(0.45, yOff, L * 0.25);
      group.add(flag);

      if (i >= 1) {
        for (let side = -1; side <= 1; side += 2) {
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, L * (0.3 + i * 0.05)),
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

    // === IRON BEAM: Turret on foredeck (6 levels) ===
    this._upgradeMeshes.ironBeam = [];
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const baseR = 0.3 + i * 0.06;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(baseR, baseR + 0.05, 0.4, 8),
        new THREE.MeshPhongMaterial({ color: 0x445544, shininess: 40 })
      );
      base.position.y = 0;
      group.add(base);

      const barrelLen = 0.8 + i * 0.3;
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05 + i * 0.012, 0.07 + i * 0.012, barrelLen, 6),
        new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 70 })
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.15, -barrelLen / 2);
      group.add(barrel);

      if (i >= 2) {
        const intensity = i >= 4 ? 0xff4422 : 0xff8844;
        const glow = new THREE.PointLight(intensity, 0.3 + (i - 2) * 0.15, 6);
        glow.position.set(0, 0.2, -barrelLen);
        group.add(glow);
      }

      group.position.set(0, 2.55, L * 0.05 + i * 0.15);
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.ironBeam.push(group);
    }

    // === FUEL TANK: Cylindrical tanks on deck (5 levels) ===
    this._upgradeMeshes.fuelTank = [];
    const tankMat = new THREE.MeshPhongMaterial({ color: 0xcc7722, shininess: 60 });
    const tankMatHeavy = new THREE.MeshPhongMaterial({ color: 0xeeaa44, shininess: 80, emissive: 0x332200 });
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group();
      const r = 0.2 + i * 0.04;
      const tankLen = 1.2 + i * 0.3;
      const mat = i >= 3 ? tankMatHeavy : tankMat;
      for (let side = -1; side <= 1; side += 2) {
        const tank = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, tankLen, 8),
          mat
        );
        tank.rotation.x = Math.PI / 2;
        tank.position.set(side * W * 0.22, 2.55, L * 0.12 - i * 0.15);
        group.add(tank);
      }
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.fuelTank.push(group);
    }

    // === REINFORCED BOW: Armor plating at bow (4 levels) ===
    this._upgradeMeshes.reinforcedBow = [];
    const bowMat = new THREE.MeshPhongMaterial({ color: 0x8899aa, shininess: 60 });
    const bowMatHeavy = new THREE.MeshPhongMaterial({ color: 0xaabbcc, shininess: 80, emissive: 0x223344 });
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      const thickness = 0.12 + i * 0.04;
      const height = 1.0 + i * 0.3;
      const mat = i >= 2 ? bowMatHeavy : bowMat;
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(W * (0.5 + i * 0.08), height, thickness),
        mat
      );
      plate.position.set(0, 1.2, -(L * 0.45 + i * 0.15));
      group.add(plate);
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.reinforcedBow.push(group);
    }

    // === CARGO INSURANCE: Cargo crates on deck (4 levels) ===
    this._upgradeMeshes.cargoInsurance = [];
    const crateMat = new THREE.MeshPhongMaterial({ color: 0xcc9966, shininess: 40 });
    const crateMatGold = new THREE.MeshPhongMaterial({ color: 0xeecc77, shininess: 70, emissive: 0x332211 });
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      const count = i + 1;
      const mat = i >= 2 ? crateMatGold : crateMat;
      for (let c = 0; c < count; c++) {
        const size = 0.4 + i * 0.05;
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(size, size, size),
          mat
        );
        crate.position.set(
          (c - (count - 1) / 2) * (size + 0.1),
          2.45 + size / 2,
          -L * 0.08
        );
        group.add(crate);
      }
      group.visible = false;
      this.shipGroup.add(group);
      this._upgradeMeshes.cargoInsurance.push(group);
    }
  }

  applyUpgrades(upgrades) {
    if (!this._built) return;

    // Upgrades that replace (show only latest level)
    const replaceKeys = ['rudder', 'radar', 'ironBeam'];
    // Upgrades that stack (show all up to current level)
    const stackKeys = ['hull', 'tollDiscount', 'fuelTank', 'reinforcedBow', 'cargoInsurance'];

    for (const key of replaceKeys) {
      const meshes = this._upgradeMeshes[key];
      if (!meshes) continue;
      const level = upgrades[key] || 0;
      for (let i = 0; i < meshes.length; i++) {
        meshes[i].visible = false;
      }
      if (level > 0 && meshes[level - 1]) {
        meshes[level - 1].visible = true;
      }
    }

    for (const key of stackKeys) {
      const meshes = this._upgradeMeshes[key];
      if (!meshes) continue;
      const level = upgrades[key] || 0;
      for (let i = 0; i < meshes.length; i++) {
        meshes[i].visible = i < level;
      }
    }

    // Hull color shifts toward armored blue-steel with upgrades
    const hullLevel = upgrades.hull || 0;
    if (this._hullMat) {
      const r = Math.max(0x20, 0x33 - hullLevel * 0x01);
      const g = Math.max(0x30, 0x44 - hullLevel * 0x01);
      const b = Math.min(0x80, 0x55 + hullLevel * 0x04);
      this._hullMat.color.setHex((r << 16) | (g << 8) | b);
      if (hullLevel >= 6) {
        this._hullMat.emissive.setHex(0x0a1520);
        this._hullMat.shininess = 30 + hullLevel * 5;
      } else {
        this._hullMat.emissive.setHex(0x000000);
        this._hullMat.shininess = 30;
      }
    }
  }

  highlightUpgrade(key) {
    if (!this._built) return;
    this._clearHighlight();
    this._highlightedKey = key;

    if (!this._dragging) {
      this._targetRotY = HIGHLIGHT_ROTATIONS[key] ?? -0.5;
    }

    const meshes = this._upgradeMeshes[key];
    if (!meshes) return;
    this._hlMats = [];
    for (const mesh of meshes) {
      if (!mesh.visible) continue;
      this._collectHlMats(mesh);
    }
  }

  _collectHlMats(obj) {
    if (obj.material && !obj.material.__hlStored) {
      obj.material.__hlOrig = obj.material.emissive.getHex();
      obj.material.__hlStored = true;
      this._hlMats.push(obj.material);
    }
    if (obj.children) {
      for (const child of obj.children) this._collectHlMats(child);
    }
  }

  _clearHighlight() {
    if (this._hlMats) {
      for (const mat of this._hlMats) {
        mat.emissive.setHex(mat.__hlOrig);
        delete mat.__hlStored;
        delete mat.__hlOrig;
      }
      this._hlMats = null;
    }
    this._highlightedKey = null;
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

    if (this._hlMats && this._hlMats.length > 0) {
      const pulse = 0.5 + Math.sin(this._time * 3) * 0.5;
      for (const mat of this._hlMats) {
        const origR = ((mat.__hlOrig >> 16) & 0xff) / 255;
        const origG = ((mat.__hlOrig >> 8) & 0xff) / 255;
        const origB = (mat.__hlOrig & 0xff) / 255;
        mat.emissive.setRGB(
          origR + 0.1 * pulse,
          origG + 0.4 * pulse,
          origB + 0.15 * pulse
        );
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
