import { CONFIG } from "../config.js";
import { track } from "../analytics.js";

const SCROLL_SPEED = CONFIG.WORLD_SCROLL_BASE_SPEED * 0.5;

function makeSteps() {
  return [
    // --- Storyline intro ---
    {
      type: "narrative",
      speaker: "COMMAND",
      text: "Captain, this is COMMAND. Welcome aboard MT Make Hormuz Great Again.",
      letterbox: true,
      showPrompt: true,
      allowSteering: false,
      scrolling: false,
    },
    {
      type: "narrative",
      speaker: "COMMAND",
      text: "April 2026. Iran has mined the Strait of Hormuz. The IRGC is enforcing a total shipping blockade.",
      letterbox: true,
      showPrompt: true,
      allowSteering: false,
      scrolling: false,
    },
    {
      type: "narrative",
      speaker: "COMMAND",
      text: "167 kilometers of hostile water between you and open sea. Mines, drones, patrol boats \u2014 all of it.",
      letterbox: true,
      showPrompt: true,
      allowSteering: false,
      scrolling: false,
    },
    {
      type: "narrative",
      speaker: "TRUMP",
      text: "We're sending you through. Nobody else has the guts. This is gonna be historic.",
      letterbox: true,
      showPrompt: true,
      allowSteering: false,
      scrolling: false,
    },
    {
      type: "narrative",
      speaker: "COMMAND",
      text: "Israel has deployed Iron Beam to cover your corridor. It will intercept what it can.",
      letterbox: true,
      showPrompt: true,
      allowSteering: false,
      scrolling: false,
    },

    // --- Gameplay tutorial ---
    {
      type: "action",
      speaker: "COMMAND",
      text: "Test your helm. Steer left, then right.",
      allowSteering: true,
      scrolling: true,
      checkComplete(game, tut) {
        if (!tut._stepState.steerLeft && game.input.steer < -0.3) {
          tut._stepState.steerLeft = true;
        }
        if (tut._stepState.steerLeft && game.input.steer > 0.3) {
          return true;
        }
        return false;
      },
    },
    {
      type: "action",
      speaker: "COMMAND",
      text: null,
      allowSteering: true,
      scrolling: true,
      highlight: "#btn-boost",
      onEnter(game, tut) {
        const isTouchDevice = game.input.isTouchDevice;
        tut.ui.showStep({
          speaker: "COMMAND",
          text: isTouchDevice
            ? "Good. Now tap BOOST \u2014 it burns fuel for a burst of sharper steering."
            : "Good. Now hit SPACE \u2014 it burns fuel for a burst of sharper steering.",
          highlight: "#btn-boost",
        });
      },
      checkComplete(game, tut) {
        return game.tanker.boostTimer > 0;
      },
    },
    {
      type: "guided",
      speaker: "COMMAND",
      text: "Iranian mine ahead! Dodge it!",
      allowSteering: true,
      scrolling: true,
      onEnter(game, tut) {
        const mineX = game.tanker.x + 3;
        tut._spawnEntity(game, "mine", mineX, 80);
      },
      checkComplete(game, tut) {
        const mine = tut._spawnedEntities[0];
        if (!mine) return true;
        if (!mine.active) return true;
        if (mine.z < game.tanker.z - 30) {
          tut._releaseEntity(game, mine);
          return true;
        }
        return false;
      },
    },
    {
      type: "guided",
      speaker: "COMMAND",
      text: "IRGC drone incoming! Iron Beam engaging.",
      allowSteering: true,
      scrolling: true,
      runIronBeam: true,
      onEnter(game, tut) {
        tut._savedHitRate = game.ironBeam.hitRate;
        game.ironBeam.hitRate = 1.0;
        tut._spawnEntity(game, "drone", game.tanker.x + 5, 60);
      },
      onExit(game, tut) {
        game.ironBeam.hitRate = tut._savedHitRate || game.ironBeam._baseHitRate;
      },
      checkComplete(game, tut) {
        const drone = tut._spawnedEntities[0];
        if (!drone) return true;
        return !drone.active;
      },
    },
    {
      type: "guided",
      speaker: "COMMAND",
      text: "Power-up ahead. Collect it \u2014 you'll need every advantage.",
      allowSteering: true,
      scrolling: true,
      runCollision: true,
      onEnter(game, tut) {
        tut._spawnEntity(game, "powerup", game.tanker.x, 80, {
          powerupType: "ceasefire",
        });
      },
      checkComplete(game, tut) {
        return game.inventory.slots[0] !== null;
      },
    },
    {
      type: "action",
      speaker: "COMMAND",
      text: null,
      allowSteering: true,
      scrolling: true,
      highlight: ".inventory-bar",
      onEnter(game, tut) {
        const isTouchDevice = game.input.isTouchDevice;
        tut.ui.showStep({
          speaker: "COMMAND",
          text: isTouchDevice
            ? "Stored in your inventory. Tap Slot 1 to activate."
            : "Stored in your inventory. Press 1 to activate.",
          highlight: ".inventory-bar",
        });
      },
      checkComplete(game, tut) {
        return game.inventory.slots[0] === null && tut._stepState.hadItem;
      },
      onUpdate(game, tut) {
        if (game.inventory.slots[0] !== null) tut._stepState.hadItem = true;
      },
    },

    // --- Oil Boost tutorial ---
    {
      type: "guided",
      speaker: "COMMAND",
      text: "Oil barrel ahead. Grab it \u2014 it supercharges your speed.",
      allowSteering: true,
      scrolling: true,
      runCollision: true,
      onEnter(game, tut) {
        tut._spawnEntity(game, "powerup", game.tanker.x, 80, {
          powerupType: "oil",
        });
      },
      checkComplete(game, tut) {
        return game.inventory.slots.some((s) => s === "oil");
      },
    },
    {
      type: "action",
      speaker: "COMMAND",
      text: null,
      allowSteering: true,
      scrolling: true,
      highlight: ".inventory-bar",
      onEnter(game, tut) {
        const isTouchDevice = game.input.isTouchDevice;
        const slotIndex = game.inventory.slots.indexOf("oil");
        tut.ui.showStep({
          speaker: "COMMAND",
          text: isTouchDevice
            ? `Activate it \u2014 tap Slot ${slotIndex + 1}. 8 seconds of boosted speed.`
            : `Activate it \u2014 press ${slotIndex + 1}. 8 seconds of boosted speed.`,
          highlight: ".inventory-bar",
        });
      },
      checkComplete(game, tut) {
        return !game.inventory.slots.some((s) => s === "oil") && tut._stepState.hadOil;
      },
      onUpdate(game, tut) {
        if (game.inventory.slots.some((s) => s === "oil")) tut._stepState.hadOil = true;
      },
    },

    // --- Pak Flag tutorial ---
    {
      type: "guided",
      speaker: "COMMAND",
      text: "Pakistan's flag ahead \u2014 grab it for full invulnerability.",
      allowSteering: true,
      scrolling: true,
      runCollision: true,
      onEnter(game, tut) {
        tut._spawnEntity(game, "powerup", game.tanker.x, 80, {
          powerupType: "pakFlag",
        });
      },
      checkComplete(game, tut) {
        return game.inventory.slots.some((s) => s === "pakFlag");
      },
    },
    {
      type: "action",
      speaker: "COMMAND",
      text: null,
      allowSteering: true,
      scrolling: true,
      highlight: ".inventory-bar",
      onEnter(game, tut) {
        const isTouchDevice = game.input.isTouchDevice;
        const slotIndex = game.inventory.slots.indexOf("pakFlag");
        tut.ui.showStep({
          speaker: "COMMAND",
          text: isTouchDevice
            ? `Activate it \u2014 tap Slot ${slotIndex + 1}. 10 seconds of invulnerability.`
            : `Activate it \u2014 press ${slotIndex + 1}. 10 seconds of invulnerability.`,
          highlight: ".inventory-bar",
        });
      },
      checkComplete(game, tut) {
        return !game.inventory.slots.some((s) => s === "pakFlag") && tut._stepState.hadPak;
      },
      onUpdate(game, tut) {
        if (game.inventory.slots.some((s) => s === "pakFlag")) tut._stepState.hadPak = true;
      },
    },

    // --- Send-off ---
    {
      type: "narrative",
      speaker: "COMMAND",
      text: "Solid work, Captain. From here on \u2014 it's real. Godspeed, Eternal Horizon.",
      letterbox: true,
      showPrompt: true,
      allowSteering: false,
      scrolling: false,
      autoAdvance: 4,
    },
  ];
}

export class Tutorial {
  constructor(ui) {
    this.ui = ui;
    this.active = false;
    this.stepIndex = -1;
    this.steps = makeSteps();
    this._stepState = {};
    this._spawnedEntities = [];
    this._savedHitRate = 0;
    this._autoTimer = 0;
    this._advancing = false;
  }

  start(game) {
    this.active = true;
    this.stepIndex = -1;
    this._stepState = {};
    this._spawnedEntities = [];
    this._advancing = false;
    game.spawner.suppressed = true;
    game.tanker.invulnTimer = 9999;
    this._savedCameraY = game.cameraController.baseY;
    game.cameraController.baseY = 55;
    this.ui.show();
    this._advanceStep(game);
  }

  update(delta, game) {
    if (!this.active) return;

    const step = this.steps[this.stepIndex];
    if (!step) return;

    game.input.update();

    game.tanker.invulnTimer = 9999;

    const scrollSpeed = step.scrolling ? SCROLL_SPEED : 0;

    if (step.allowSteering) {
      game.tanker.update(delta, {
        input: game.input,
        straitHalfWidth: game.difficulty.getStraitHalfWidth(),
        scrollSpeed,
      });
    } else if (step.scrolling) {
      game.tanker.z += scrollSpeed * delta;
      game.tanker.syncMesh();
    }

    game.tanker.mesh.visible = true;

    const ctx = {
      scrollSpeed,
      tankerX: game.tanker.x,
      tankerZ: game.tanker.z,
      spawnProjectile: () => {},
      ceasefireShootingDisabled: true,
    };
    for (const entity of this._spawnedEntities) {
      if (entity.active) entity.update(delta, ctx);
    }

    const releaseEntity = (e) => {
      for (const key in game.pools) {
        game.pools[key].forEach((item) => {
          if (item === e) game.pools[key].release(item);
        });
      }
    };
    if (step.runIronBeam) {
      game.ironBeam.update(
        delta,
        game.pools.drone,
        game.tanker,
        game.particles,
        game.audio,
        releaseEntity,
      );
    } else {
      game.ironBeam.update(
        delta,
        { forEach: () => {} },
        game.tanker,
        game.particles,
        game.audio,
        releaseEntity,
      );
    }

    if (step.runCollision) {
      const poolArray = Object.values(game.pools);
      game.collision.check(game.tanker, poolArray, {
        particles: game.particles,
        audio: game.audio,
        inventory: game.inventory,
        ironBeam: game.ironBeam,
        ceasefireActive: false,
        releaseEntity: (e) => {
          for (const key in game.pools) {
            game.pools[key].forEach((item) => {
              if (item === e) game.pools[key].release(item);
            });
          }
        },
        addScore: () => {},
        notifyPickup: (type) => game.hud.showPickupNotification(type),
      });
    }

    const powerupCtx = {
      activateOilBoost: () => {},
      activateCeasefire: () => {},
      activatePakFlag: () => {},
    };
    const powerupSlot = game.input.consumePowerupActivation();
    if (powerupSlot >= 0) {
      game.inventory.activate(powerupSlot, powerupCtx);
    }
    game.inventory.update(delta, powerupCtx);

    game.water.update(delta, 0, game.tanker.z);
    game.terrain.update(
      delta,
      game.tanker.z,
      game.difficulty.getStraitHalfWidth(),
    );
    game.particles.update(delta, scrollSpeed);
    game.cameraController.update(delta, game.tanker.z);

    game.hud.update({
      hull: game.tanker.hull,
      maxHull: game.tanker.maxHull,
      score: 0,
      distance: 0,
      yuan: game.save.data.currency,
      multiplier: 1,
      phaseName: game.difficulty.phaseName,
      fuel: game.tanker.fuel,
      inventory: game.inventory.slots,
      ceasefireActive: false,
      pakFlagActive: false,
      oilBoostActive: false,
    });

    if (step.onUpdate) step.onUpdate(game, this);

    if (step.autoAdvance) {
      this._autoTimer += delta;
      if (this._autoTimer >= step.autoAdvance) {
        this._advanceStep(game);
        return;
      }
    }

    if (step.checkComplete && step.checkComplete(game, this)) {
      this._advanceStep(game);
    }
  }

  _advanceStep(game) {
    if (!this.active || this._advancing) return;
    this._advancing = true;

    const prev = this.steps[this.stepIndex];
    if (prev && prev.onExit) prev.onExit(game, this);

    this._cleanupEntities(game);
    this._stepState = {};
    this._autoTimer = 0;
    this.stepIndex++;

    if (this.stepIndex >= this.steps.length) {
      this.end(game);
      return;
    }

    const step = this.steps[this.stepIndex];

    if (step.text) {
      this.ui.showStep(step);
    }
    if (step.onEnter) {
      step.onEnter(game, this);
    }

    if (step.type === "narrative") {
      this.ui.setTappable(true);
      this.ui.onTapCallback = () => {
        this._advanceStep(game);
      };
    } else {
      this.ui.setTappable(false);
      this.ui.onTapCallback = null;
    }

    this._advancing = false;
  }

  end(game) {
    this.active = false;
    this._advancing = false;
    this._cleanupEntities(game);
    game.spawner.suppressed = false;
    game.tanker.invulnTimer = 0;
    game.tanker.mesh.visible = true;
    game.cameraController.baseY = this._savedCameraY;
    game.scoring.reset();
    game.tanker.reset();
    game.inventory.reset();
    game.save.data.tutorialComplete = true;
    game.save.save();
    track('tutorial_complete');
    this.ui.hide();
  }

  _spawnEntity(game, type, x, zOffset, props) {
    const pool = game.pools[type];
    if (!pool) return null;
    const entity = pool.acquire();
    if (!entity) return null;

    if (props) Object.assign(entity, props);

    entity.init(x, game.tanker.z + zOffset);
    if (entity.mesh && !entity.mesh.parent) {
      game.scene.add(entity.mesh);
    }
    this._spawnedEntities.push(entity);
    return entity;
  }

  _releaseEntity(game, entity) {
    for (const key in game.pools) {
      game.pools[key].forEach((item) => {
        if (item === entity) game.pools[key].release(item);
      });
    }
    this._spawnedEntities = this._spawnedEntities.filter((e) => e !== entity);
  }

  _cleanupEntities(game) {
    for (const entity of this._spawnedEntities) {
      if (entity.active) {
        for (const key in game.pools) {
          game.pools[key].forEach((item) => {
            if (item === entity) game.pools[key].release(item);
          });
        }
      }
    }
    this._spawnedEntities = [];
  }
}
