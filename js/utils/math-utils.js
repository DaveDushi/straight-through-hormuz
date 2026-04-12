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
