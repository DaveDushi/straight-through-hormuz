import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { noise2D } from '../utils/math-utils.js';
import { quality } from '../utils/quality-manager.js';

// Arid Iranian/Omani mountain palette (pre-darkened for bright scene lighting)
const COLOR_SHORE = { r: 0.50, g: 0.42, b: 0.22 }; // wet sand at waterline
const COLOR_CLIFF = { r: 0.30, g: 0.18, b: 0.08 }; // dark cliff face
const COLOR_EARTH = { r: 0.42, g: 0.28, b: 0.14 }; // dry arid earth
const COLOR_ROCK  = { r: 0.38, g: 0.34, b: 0.26 }; // gray-brown mountain rock
const COLOR_PEAK  = { r: 0.58, g: 0.54, b: 0.46 }; // light stone caps

function lerpColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return {
        r: a.r + t * (b.r - a.r),
        g: a.g + t * (b.g - a.g),
        b: a.b + t * (b.b - a.b),
    };
}

// Color based on terrain height and position
function heightColor(h, baseH, distFromEdge) {
    if (distFromEdge < 0) return COLOR_SHORE; // underwater overlap

    // Normalize height relative to the full terrain range
    const aboveBase = Math.max(0, h - baseH * 0.4);
    const maxH = CONFIG.TERRAIN_HEIGHT_SCALE + 30; // rough max noise amplitude
    const t = Math.min(1, aboveBase / maxH);

    if (h < baseH * 0.4) {
        // Shore zone — blend shore to cliff
        const s = Math.max(0, h) / (baseH * 0.4);
        return lerpColor(COLOR_SHORE, COLOR_CLIFF, s);
    }
    if (t < 0.15) {
        return lerpColor(COLOR_CLIFF, COLOR_EARTH, t / 0.15);
    }
    if (t < 0.45) {
        return lerpColor(COLOR_EARTH, COLOR_ROCK, (t - 0.15) / 0.30);
    }
    return lerpColor(COLOR_ROCK, COLOR_PEAK, (t - 0.45) / 0.55);
}

// Ridged noise: sharp mountain ridge lines (returns 0..1, peaks at 1)
function ridgedNoise(x, z) {
    const n = noise2D(x, z);
    return 1 - Math.abs(n * 2 - 1);
}

// Terrain intensity ramps up as the player progresses through the strait
function terrainIntensity(worldZ) {
    if (worldZ < 0) return 0.45;
    if (worldZ < 3000) return 0.45 + 0.15 * (worldZ / 3000);
    if (worldZ < 15000) return 0.60 + 0.20 * ((worldZ - 3000) / 12000);
    if (worldZ < 40000) return 0.80 + 0.12 * ((worldZ - 15000) / 25000);
    return Math.min(1.0, 0.92 + 0.08 * ((worldZ - 40000) / 60000));
}

function sampleHeight(wx, wz, octaves, intensity) {
    let h = 0;

    // Major mountain ridges — ridged noise creates sharp spine-like peaks
    h += ridgedNoise(wx * 0.008, wz * 0.006) * CONFIG.TERRAIN_HEIGHT_SCALE * intensity;

    // Broad elevation undulation — regular centered noise
    h += (noise2D(wx * 0.003 + 50, wz * 0.004 + 50) * 2 - 1) * 12 * intensity;

    if (octaves >= 2) {
        // Secondary ridges
        h += ridgedNoise(wx * 0.025 + 100, wz * 0.02 + 100) * 18 * intensity;
        // Hill variation
        h += (noise2D(wx * 0.04 + 200, wz * 0.035 + 200) * 2 - 1) * 8;
    }

    if (octaves >= 3) {
        // Fine rocky texture
        h += (noise2D(wx * 0.10 + 300, wz * 0.10 + 300) * 2 - 1) * 4;
        // Small ridges
        h += ridgedNoise(wx * 0.07 + 400, wz * 0.06 + 400) * 5;
    }

    return h;
}

export class Terrain {
    constructor(scene, difficulty) {
        this.scene = scene;
        this.difficulty = difficulty;
        this.chunks = [];
        this.chunkLength = CONFIG.TERRAIN_CHUNK_LENGTH;
        this.chunkWidth = CONFIG.TERRAIN_CHUNK_WIDTH;
        this.overlap = CONFIG.TERRAIN_OVERLAP;
        this.octaves = quality.settings.terrainOctaves;

        const segX = quality.settings.terrainSegX;
        const segZ = quality.settings.terrainSegZ;

        const mat = new THREE.MeshPhongMaterial({
            vertexColors: true,
            flatShading: true,
            color: new THREE.Color(0.45, 0.42, 0.38),
            emissive: 0x080400,
            shininess: 2,
        });
        this.material = mat;
        this.segX = segX;
        this.segZ = segZ;

        for (let i = 0; i < CONFIG.TERRAIN_CHUNKS_VISIBLE; i++) {
            this._createChunkPair(i * this.chunkLength);
        }
    }

    _createGeometry() {
        const geo = new THREE.PlaneGeometry(
            this.chunkWidth, this.chunkLength, this.segX, this.segZ
        );
        geo.rotateX(-Math.PI / 2);
        const count = geo.attributes.position.count;
        geo.setAttribute(
            'color',
            new THREE.BufferAttribute(new Float32Array(count * 3), 3)
        );
        return geo;
    }

    _createChunkPair(zOffset) {
        const pair = {
            left: null, right: null,
            worldZ: zOffset,
        };

        const geoL = this._createGeometry();
        pair.left = new THREE.Mesh(geoL, this.material);
        this.scene.add(pair.left);

        const geoR = this._createGeometry();
        pair.right = new THREE.Mesh(geoR, this.material);
        this.scene.add(pair.right);

        this.chunks.push(pair);

        this._positionChunk(pair);
        this._updateChunkHeights(pair);
        return pair;
    }

    _updateChunkHeights(chunk) {
        this._applyHeightmap(chunk.left, chunk.worldZ, -1);
        this._applyHeightmap(chunk.right, chunk.worldZ, 1);
    }

    _applyHeightmap(mesh, worldZ, side) {
        const pos = mesh.geometry.attributes.position;
        const col = mesh.geometry.attributes.color;
        const baseH = CONFIG.TERRAIN_BASE_HEIGHT;
        const coastW = CONFIG.TERRAIN_COAST_FADE;
        const meshX = mesh.position.x;

        for (let i = 0; i < pos.count; i++) {
            const localX = pos.getX(i);
            const localZ = pos.getZ(i);

            const wx = meshX + localX;
            const wz = worldZ + localZ;

            // Shore position per side from fBm noise — all coastline detail
            // (regional narrowing + side-specific bays/peninsulas) comes from here,
            // so the visible land exactly matches the tanker's collision walls.
            const shoreDist = this.difficulty.getShoreDistance(wz, side);
            const distFromEdge = side * wx - shoreDist;

            const intensity = terrainIntensity(wz);
            const noiseH = sampleHeight(wx, wz, this.octaves, intensity);

            let h;
            if (distFromEdge < 0) {
                // Submerged seabed — gentle slope below water plane
                h = Math.max(-3, distFromEdge * 0.6);
            } else if (distFromEdge < coastW) {
                const t = distFromEdge / coastW;
                const cliff = t * t;
                h = baseH * cliff + Math.max(0, noiseH) * t * 0.3;
            } else {
                const inlandT = Math.min(1, (distFromEdge - coastW) / 15);
                h = baseH + Math.max(0, noiseH) * (0.3 + 0.7 * inlandT);
            }

            pos.setY(i, h);

            const c = heightColor(Math.max(0, h), baseH, distFromEdge);
            const colorVar = (noise2D(wx * 0.05 + 500, wz * 0.05 + 500) - 0.5) * 0.08;
            col.setXYZ(i,
                Math.max(0, c.r + colorVar),
                Math.max(0, c.g + colorVar * 0.8),
                Math.max(0, c.b + colorVar * 0.5)
            );
        }

        pos.needsUpdate = true;
        col.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    }

    // Chunks sit at a fixed lateral position — inner edge at the narrowest possible
    // shore so that shoreline variation (wide→narrow) is expressed entirely through
    // the heightmap, not by sliding chunks. The land itself bends; the camera flies
    // past stationary geography.
    _positionChunk(chunk) {
        const ov = this.overlap;
        const hw = this.chunkWidth / 2;
        const innerEdge = CONFIG.STRAIT_WIDTH_MIN / 2 - ov;
        chunk.left.position.set(-(innerEdge + hw), 0, chunk.worldZ);
        chunk.right.position.set(innerEdge + hw, 0, chunk.worldZ);
    }

    reset() {
        for (let i = 0; i < this.chunks.length; i++) {
            this.chunks[i].worldZ = i * this.chunkLength;
            this._positionChunk(this.chunks[i]);
            this._updateChunkHeights(this.chunks[i]);
        }
    }

    update(delta, tankerZ) {
        // Recycle chunks that fell behind the camera — reposition only along Z,
        // lateral position stays fixed so shores don't slide.
        for (const chunk of this.chunks) {
            if (chunk.worldZ < tankerZ - this.chunkLength) {
                const maxWorldZ = Math.max(...this.chunks.map(c => c.worldZ));
                chunk.worldZ = maxWorldZ + this.chunkLength;
                chunk.left.position.z = chunk.worldZ;
                chunk.right.position.z = chunk.worldZ;
                this._updateChunkHeights(chunk);
            }
        }
    }
}
