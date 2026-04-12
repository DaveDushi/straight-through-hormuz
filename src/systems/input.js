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
        this._pointerId = null;

        // Double-tap detection for mobile boost
        this._lastTapTime = 0;
        this._doubleTapThreshold = 300; // ms

        this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Tilt controls
        this._tiltAvailable = false;
        this._tiltEnabled = false;
        this._tiltGamma = 0;
        this._tiltDeadZone = 3;    // degrees
        this._tiltMaxAngle = 30;   // degrees for full steer

        this._bindEvents();
    }

    _bindEvents() {
        // Keyboard
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

        // Unified Pointer Events (replaces separate mouse + touch)
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this._pointerId !== null) return; // already tracking a pointer
            this._pointerId = e.pointerId;
            this._pointerDown = true;
            this._pointerStartX = e.clientX;
            this._pointerCurrentX = e.clientX;

            // Double-tap detection for boost (touch devices)
            if (e.pointerType === 'touch') {
                const now = performance.now();
                if (now - this._lastTapTime < this._doubleTapThreshold) {
                    this.boostTriggered = true;
                    // Haptic feedback for boost
                    if (navigator.vibrate) navigator.vibrate(15);
                }
                this._lastTapTime = now;
            }

            // Capture to receive events even if pointer leaves canvas
            this.canvas.setPointerCapture(e.pointerId);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (e.pointerId === this._pointerId && this._pointerDown) {
                this._pointerCurrentX = e.clientX;
            }
        });

        this.canvas.addEventListener('pointerup', (e) => {
            if (e.pointerId === this._pointerId) {
                this._pointerDown = false;
                this._pointerId = null;
            }
        });

        this.canvas.addEventListener('pointercancel', (e) => {
            if (e.pointerId === this._pointerId) {
                this._pointerDown = false;
                this._pointerId = null;
            }
        });

        // Prevent default touch behaviors on canvas
        this.canvas.style.touchAction = 'none';
    }

    async enableTilt() {
        // iOS requires permission
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    return false;
                }
            } catch (e) {
                return false;
            }
        }

        if (!('DeviceOrientationEvent' in window)) {
            return false;
        }

        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null) {
                this._tiltGamma = e.gamma;
                this._tiltAvailable = true;
            }
        });

        this._tiltEnabled = true;
        return true;
    }

    get isTouchDevice() {
        return this._isTouchDevice;
    }

    get tiltEnabled() {
        return this._tiltEnabled;
    }

    update() {
        this.steer = 0;

        if (this._keys['ArrowLeft'] || this._keys['KeyA']) this.steer -= 1;
        if (this._keys['ArrowRight'] || this._keys['KeyD']) this.steer += 1;

        // Tilt controls (mobile) — takes priority over drag when available
        if (this._tiltEnabled && this._tiltAvailable) {
            let gamma = this._tiltGamma;
            if (Math.abs(gamma) < this._tiltDeadZone) {
                gamma = 0;
            } else {
                gamma = gamma - Math.sign(gamma) * this._tiltDeadZone;
            }
            const effectiveMax = this._tiltMaxAngle - this._tiltDeadZone;
            this.steer = clamp(gamma / effectiveMax, -1, 1);
        } else if (this._pointerDown) {
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
