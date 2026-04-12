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
        terrainSegX: 24,
        terrainSegZ: 48,
        terrainOctaves: 3,
    },
    medium: {
        pixelRatioCap: 1.5,
        waterSegments: 40,
        maxParticles: 60,
        maxPointLights: 4,
        postProcessing: true,
        bloomEnabled: false,
        fogNear: 110,
        fogFar: 220,
        terrainSegX: 14,
        terrainSegZ: 28,
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
        terrainSegX: 8,
        terrainSegZ: 16,
        terrainOctaves: 1,
    },
};

class QualityManager {
    constructor() {
        this.tier = detectTier();
        this.settings = { ...TIER_SETTINGS[this.tier] };
    }
}

export const quality = new QualityManager();
