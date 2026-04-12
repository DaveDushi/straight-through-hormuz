/**
 * Camera effects: ocean sway + damage shake.
 * Zero GPU cost (CPU math only).
 */
export class CameraController {
    constructor(camera, basePosition) {
        this.camera = camera;
        this.baseX = basePosition.x;
        this.baseY = basePosition.y;
        this.baseZ = basePosition.z;

        this.shakeIntensity = 0;
        this._time = 0;

        // Sway parameters
        this._swayAmplitudeX = 0.12;
        this._swayAmplitudeY = 0.08;
        this._swayFreq = 0.3;
    }

    triggerShake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    update(delta) {
        this._time += delta;

        // Gentle ocean sway
        const swayX = Math.sin(this._time * this._swayFreq * Math.PI * 2) * this._swayAmplitudeX;
        const swayY = Math.cos(this._time * this._swayFreq * 0.7 * Math.PI * 2) * this._swayAmplitudeY;

        // Shake: random offset, exponential decay
        let shakeX = 0, shakeY = 0;
        if (this.shakeIntensity > 0.01) {
            shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeIntensity *= Math.exp(-5 * delta);
        } else {
            this.shakeIntensity = 0;
        }

        this.camera.position.x = this.baseX + swayX + shakeX;
        this.camera.position.y = this.baseY + swayY + shakeY;
        this.camera.position.z = this.baseZ;
    }
}
