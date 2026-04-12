import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { noise2D } from '../utils/math-utils.js';
import { quality } from '../utils/quality-manager.js';

// Height color palette (natural colors; material.color darkens to compensate for scene lighting)
const COLOR_COAST  = { r: 0.82, g: 0.70, b: 0.42 }; // sandy shore
const COLOR_LOW    = { r: 0.48, g: 0.30, b: 0.12 }; // dark arid earth
const COLOR_MID    = { r: 0.58, g: 0.52, b: 0.38 }; // rocky gray-brown
const COLOR_HIGH   = { r: 0.72, g: 0.68, b: 0.56 }; // lighter stone
const COLOR_PEAK   = { r: 0.92, g: 0.88, b: 0.78 }; // bright stone caps

function heightColor(normalizedH) {
    // normalizedH: 0 = coast, 1 = peak
    const t = Math.max(0, Math.min(1, normalizedH));
    let c;
    if (t < 0.08) {
        c = COLOR_COAST;
    } else if (t < 0.25) {
        const s = (t - 0.08) / 0.17;
        c = lerpColor(COLOR_COAST, COLOR_LOW, s);
    } else if (t < 0.50) {
        const s = (t - 0.25) / 0.25;
        c = lerpColor(COLOR_LOW, COLOR_MID, s);
    } else if (t < 0.75) {
        const s = (t - 0.50) / 0.25;
        c = lerpColor(COLOR_MID, COLOR_HIGH, s);
    } else {
        const s = (t - 0.75) / 0.25;
        c = lerpColor(COLOR_HIGH, COLOR_PEAK, s);
    }
    return c;
}

function lerpColor(a, b, t) {
    return { r: a.r + t * (b.r - a.r), g: a.g + t * (b.g - a.g), b: a.b + t * (b.b - a.b) };
}

function sampleHeight(wx, wz, octaves) {
    // Centered noise: returns roughly -scale to +scale
    let h = 0;
    // Octave 1: broad ridges
    h += (noise2D(wx * 0.012, wz * 0.010) * 2 - 1) * CONFIG.TERRAIN_HEIGHT_SCALE;
    if (octaves >= 2) {
        // Octave 2: distinct peaks/valleys
        h += (noise2D(wx * 0.035 + 100, wz * 0.030 + 100) * 2 - 1) * 15;
    }
    if (octaves >= 3) {
        // Octave 3: rocky detail
        h += (noise2D(wx * 0.08 + 200, wz * 0.08 + 200) * 2 - 1) * 6;
    }
    return h;
}

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.chunks = [];
        this.chunkLength = CONFIG.TERRAIN_CHUNK_LENGTH;
        this.chunkWidth = CONFIG.TERRAIN_CHUNK_WIDTH;
        this.scrollOffset = 0;
        this.octaves = quality.settings.terrainOctaves;

        const segX = quality.settings.terrainSegX;
        const segZ = quality.settings.terrainSegZ;

        const mat = new THREE.MeshPhongMaterial({
            vertexColors: true,
            flatShading: true,
            color: new THREE.Color(0.40, 0.40, 0.40),
            emissive: 0x060300,
            shininess: 0,
        });
        this.material = mat;
        this.segX = segX;
        this.segZ = segZ;

        for (let i = 0; i < CONFIG.TERRAIN_CHUNKS_VISIBLE; i++) {
            this._createChunkPair(i * this.chunkLength);
        }
    }

    _createGeometry() {
        const geo = new THREE.PlaneGeometry(this.chunkWidth, this.chunkLength, this.segX, this.segZ);
        // Rotate from XY to XZ (lying flat, Y is up)
        geo.rotateX(-Math.PI / 2);
        // Add vertex color attribute
        const count = geo.attributes.position.count;
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        return geo;
    }

    _createChunkPair(zOffset) {
        const pair = { left: null, right: null, z: zOffset, worldZ: this.scrollOffset + zOffset };

        const geoL = this._createGeometry();
        const left = new THREE.Mesh(geoL, this.material);
        this.scene.add(left);
        pair.left = left;

        const geoR = this._createGeometry();
        const right = new THREE.Mesh(geoR, this.material);
        this.scene.add(right);
        pair.right = right;

        this.chunks.push(pair);

        // Initial heightmap generation
        this._updateChunkHeights(pair, CONFIG.STRAIT_WIDTH_START / 2);
        this._positionChunk(pair, CONFIG.STRAIT_WIDTH_START / 2);

        return pair;
    }

    _updateChunkHeights(chunk, straitHalfWidth) {
        this._applyHeightmap(chunk.left, chunk.worldZ, -1, straitHalfWidth);
        this._applyHeightmap(chunk.right, chunk.worldZ, 1, straitHalfWidth);
    }

    _applyHeightmap(mesh, worldZ, side, straitHalfWidth) {
        const pos = mesh.geometry.attributes.position;
        const col = mesh.geometry.attributes.color;
        const coastFade = CONFIG.TERRAIN_COAST_FADE;
        const baseH = CONFIG.TERRAIN_BASE_HEIGHT;
        // Max possible height for color normalization
        const maxNoiseH = CONFIG.TERRAIN_HEIGHT_SCALE + (this.octaves >= 2 ? 15 : 0) + (this.octaves >= 3 ? 6 : 0);

        for (let i = 0; i < pos.count; i++) {
            const localX = pos.getX(i);
            const localZ = pos.getZ(i);

            // World coords for noise
            const wx = (side > 0 ? straitHalfWidth + this.chunkWidth / 2 : -straitHalfWidth - this.chunkWidth / 2) + localX;
            const wz = worldZ + localZ;

            let noiseH = sampleHeight(wx, wz, this.octaves);

            // Coast fade: ramp down near water edge
            const halfW = this.chunkWidth / 2;
            const distFromWaterEdge = side > 0 ? (localX + halfW) : (halfW - localX);
            const fade = Math.min(1, distFromWaterEdge / coastFade);

            // Base height creates the coastal cliff, noise adds mountains on top
            // fade applies to both base and noise so terrain slopes down to water
            let h = (baseH + Math.max(0, noiseH)) * fade;

            if (h < 0.3) h = 0.3;

            pos.setY(i, h);

            // Vertex color — normalize noise portion against max possible
            // Use noiseH (before clamping) to determine color
            const colorT = Math.max(0, noiseH) / maxNoiseH;
            const c = heightColor(colorT);
            col.setXYZ(i, c.r, c.g, c.b);
        }

        pos.needsUpdate = true;
        col.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    }

    _positionChunk(chunk, straitHalfWidth) {
        chunk.left.position.set(-straitHalfWidth - this.chunkWidth / 2, 0, chunk.z);
        chunk.right.position.set(straitHalfWidth + this.chunkWidth / 2, 0, chunk.z);
    }

    update(delta, scrollSpeed, straitHalfWidth) {
        const move = scrollSpeed * delta;
        this.scrollOffset += move;

        for (const chunk of this.chunks) {
            chunk.z -= move;
            this._positionChunk(chunk, straitHalfWidth);
        }

        // Recycle chunks that scrolled behind camera
        for (const chunk of this.chunks) {
            if (chunk.z < -this.chunkLength) {
                const maxZ = Math.max(...this.chunks.map(c => c.z));
                chunk.z = maxZ + this.chunkLength;
                chunk.worldZ = this.scrollOffset + chunk.z;
                this._updateChunkHeights(chunk, straitHalfWidth);
                this._positionChunk(chunk, straitHalfWidth);
            }
        }
    }
}
