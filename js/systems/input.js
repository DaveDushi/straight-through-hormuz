import { clamp } from '../utils/math-utils.js';

export class InputSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.steer = 0;
        this.boosting = false;
        this.boostTriggered = false;
        this.activatePowerup = -1;

        this._pointerDown = false;
        this._pointerStartX = 0;
        this._pointerCurrentX = 0;
        this._keys = {};
        this._touchId = null;

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            this._keys[e.code] = true;
            if (e.code === 'Digit1') this.activatePowerup = 0;
            if (e.code === 'Digit2') this.activatePowerup = 1;
            if (e.code === 'Digit3') this.activatePowerup = 2;
            if (e.code === 'Space') this.boostTriggered = true;
        });
        window.addEventListener('keyup', (e) => {
            this._keys[e.code] = false;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this._pointerDown = true;
            this._pointerStartX = e.clientX;
            this._pointerCurrentX = e.clientX;
        });
        window.addEventListener('mousemove', (e) => {
            if (this._pointerDown) {
                this._pointerCurrentX = e.clientX;
            }
        });
        window.addEventListener('mouseup', () => {
            this._pointerDown = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this._touchId = touch.identifier;
            this._pointerDown = true;
            this._pointerStartX = touch.clientX;
            this._pointerCurrentX = touch.clientX;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this._touchId) {
                    this._pointerCurrentX = e.changedTouches[i].clientX;
                }
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this._touchId) {
                    this._pointerDown = false;
                    this._touchId = null;
                }
            }
        });
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
}
