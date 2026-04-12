/**
 * Adaptive quality system. Detects device tier and exposes settings.
 */

function detectTier() {
    const isTouch = navigator.maxTouchPoints > 0;
    const screenW = Math.max(screen.width, screen.height);
    const dpr = window.devicePixelRatio || 1;

    // Try to get GPU name for heuristic
    let gpuName = '';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) gpuName = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL).toLowerCase();
        }
    } catch (_) { /* ignore */ }

    // Low-end mobile heuristics
    const isLowGPU = gpuName.includes('mali-4') || gpuName.includes('adreno 3') || gpuName.includes('powervr sgx');
    const isSmallScreen = screenW <= 480;

    if (isTouch && (isLowGPU || isSmallScreen || dpr < 2)) return 'low';
    if (isTouch) return 'medium';
    return 'high';
}

const TIER_SETTINGS = {
    high: {
        pixelRatioCap: 2,
        waterSegments: 80,
        maxParticles: 120,
        maxPointLights: 8,
        postProcessing: true,
        bloomEnabled: true,
        fogNear: 130,
        fogFar: 260,
        terrainSegX: 32,
        terrainSegZ: 48,
        terrainOctaves: 3,
    },
    medium: {
        pixelRatioCap: 1,
        waterSegments: 30,
        maxParticles: 40,
        maxPointLights: 2,
        postProcessing: false,
        bloomEnabled: false,
        fogNear: 100,
        fogFar: 200,
        terrainSegX: 16,
        terrainSegZ: 24,
        terrainOctaves: 2,
    },
    low: {
        pixelRatioCap: 1,
        waterSegments: 20,
        maxParticles: 30,
        maxPointLights: 0,
        postProcessing: false,
        bloomEnabled: false,
        fogNear: 90,
        fogFar: 180,
        terrainSegX: 12,
        terrainSegZ: 16,
        terrainOctaves: 1,
    },
};

const FPS_TARGET = 48;
const FPS_RECOVER = 55;
const SAMPLE_INTERVAL = 2;
const PIXEL_RATIO_STEPS = [0.5, 0.75, 1, 1.5, 2];

class QualityManager {
    constructor() {
        this.tier = detectTier();
        this.settings = { ...TIER_SETTINGS[this.tier] };
        this._renderer = null;
        this._frameCount = 0;
        this._elapsed = 0;
        this._prIdx = PIXEL_RATIO_STEPS.indexOf(this.settings.pixelRatioCap);
        if (this._prIdx === -1) this._prIdx = PIXEL_RATIO_STEPS.length - 1;
        this._maxIdx = this._prIdx;
    }

    bindRenderer(renderer) {
        this._renderer = renderer;
    }

    sampleFrame(delta) {
        if (!this._renderer) return;
        this._frameCount++;
        this._elapsed += delta;
        if (this._elapsed < SAMPLE_INTERVAL) return;

        const fps = this._frameCount / this._elapsed;
        this._frameCount = 0;
        this._elapsed = 0;

        if (fps < FPS_TARGET && this._prIdx > 0) {
            this._prIdx--;
            this._applyPixelRatio();
        } else if (fps > FPS_RECOVER && this._prIdx < this._maxIdx) {
            this._prIdx++;
            this._applyPixelRatio();
        }
    }

    _applyPixelRatio() {
        const ratio = PIXEL_RATIO_STEPS[this._prIdx];
        this.settings.pixelRatioCap = ratio;
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratio));
    }
}

export const quality = new QualityManager();
