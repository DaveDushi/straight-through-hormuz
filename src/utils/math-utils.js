export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

export function distance2D(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
}

export function angle2D(x1, z1, x2, z2) {
    return Math.atan2(x2 - x1, z2 - z1);
}

export function aabbOverlap(ax, az, ahw, ahh, bx, bz, bhw, bhh) {
    return Math.abs(ax - bx) < (ahw + bhw) && Math.abs(az - bz) < (ahh + bhh);
}

// Simple 2D value noise (deterministic, hash-based)
function _hash(x, z) {
    let n = Math.imul(x, 374761393) + Math.imul(z, 668265263);
    n = (n + 1013904223) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = n ^ (n >>> 16);
    return (n >>> 0) / 4294967296;
}

export function noise2D(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;

    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);

    const v00 = _hash(ix, iz);
    const v10 = _hash(ix + 1, iz);
    const v01 = _hash(ix, iz + 1);
    const v11 = _hash(ix + 1, iz + 1);

    const a = v00 + sx * (v10 - v00);
    const b = v01 + sx * (v11 - v01);
    return a + sz * (b - a);
}
