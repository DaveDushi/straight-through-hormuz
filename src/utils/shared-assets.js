import * as THREE from 'three';

/**
 * Singleton cache for shared geometries and materials.
 * Prevents duplicate GPU allocations across pooled entities.
 */
const geometryCache = new Map();
const materialCache = new Map();

export function getGeometry(key, factory) {
    if (!geometryCache.has(key)) {
        geometryCache.set(key, factory());
    }
    return geometryCache.get(key);
}

export function getMaterial(key, factory) {
    if (!materialCache.has(key)) {
        materialCache.set(key, factory());
    }
    return materialCache.get(key);
}

// Pre-cached powerup label textures (fixes texture leak)
const labelTextureCache = new Map();

export function getLabelSprite(text, colorHex) {
    const key = text + '_' + colorHex;
    if (!labelTextureCache.has(key)) {
        const canvas = document.createElement('canvas');
        canvas.width = 768;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 72px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText(text, 384, 96);
        ctx.fillStyle = colorHex;
        ctx.fillText(text, 384, 96);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        labelTextureCache.set(key, mat);
    }
    // Each sprite needs its own Sprite instance (they share material)
    const sprite = new THREE.Sprite(labelTextureCache.get(key));
    sprite.scale.set(16, 4, 1);
    return sprite;
}
