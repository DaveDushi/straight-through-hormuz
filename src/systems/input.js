import { clamp } from '../utils/math-utils.js';

export class InputSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.steer = 0;
        this.boosting = false;
        this.boostTriggered = false;
        this.torpedoTriggered = false;
        this.activatePowerup = -1;

        this._pointerDown = false;
        this._pointerStartX = 0;
        this._pointerCurrentX = 0;
        this._keys = {};
        this._pointerId = null;

        this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        this._bindEvents();
    }

    _bindEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this._keys[e.code] = true;
            if (e.code === 'Digit1') this.activatePowerup = 0;
            if (e.code === 'Digit2') this.activatePowerup = 1;
            if (e.code === 'Digit3') this.activatePowerup = 2;
            if (e.code === 'Digit4') this.activatePowerup = 3;
            if (e.code === 'Digit5') this.activatePowerup = 4;
            if (e.code === 'Space') this.boostTriggered = true;
            if (e.code === 'KeyF') this.torpedoTriggered = true;
        });
        window.addEventListener('keyup', (e) => {
            this._keys[e.code] = false;
        });

        // Unified Pointer Events (replaces separate mouse + touch)
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this._pointerId !== null) return;
            this._pointerId = e.pointerId;
            this._pointerDown = true;
            this._pointerStartX = e.clientX;
            this._pointerCurrentX = e.clientX;
            e.preventDefault();
        });

        window.addEventListener('pointermove', (e) => {
            if (e.pointerId === this._pointerId && this._pointerDown) {
                this._pointerCurrentX = e.clientX;
            }
        });

        window.addEventListener('pointerup', (e) => {
            if (e.pointerId === this._pointerId) {
                this._pointerDown = false;
                this._pointerId = null;
            }
        });

        window.addEventListener('pointercancel', (e) => {
            if (e.pointerId === this._pointerId) {
                this._pointerDown = false;
                this._pointerId = null;
            }
        });

        // Prevent default touch behaviors on canvas
        this.canvas.style.touchAction = 'none';
    }

    get isTouchDevice() {
        return this._isTouchDevice;
    }

    update() {
        this.steer = 0;

        if (this._keys['ArrowLeft'] || this._keys['KeyA']) this.steer -= 1;
        if (this._keys['ArrowRight'] || this._keys['KeyD']) this.steer += 1;

        if (this._pointerDown) {
            const dx = this._pointerCurrentX - this._pointerStartX;
            const sensitivity = 40;
            this.steer = clamp(dx / sensitivity, -1, 1);
        }

        this.boosting = this._keys['ShiftLeft'] || this._keys['ShiftRight'] || false;
    }

    consumePowerupActivation() {
        const slot = this.activatePowerup;
        this.activatePowerup = -1;
        return slot;
    }

    consumeBoostTrigger() {
        const v = this.boostTriggered;
        this.boostTriggered = false;
        return v;
    }

    consumeTorpedoTrigger() {
        const v = this.torpedoTriggered;
        this.torpedoTriggered = false;
        return v;
    }
}
