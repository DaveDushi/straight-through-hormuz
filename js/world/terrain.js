import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.chunks = [];
        this.chunkLength = CONFIG.TERRAIN_CHUNK_LENGTH;
        this.scrollOffset = 0;

        const matLeft = new THREE.MeshPhongMaterial({ color: 0xB89B72, flatShading: true, emissive: 0x221a0e });
        const matRight = new THREE.MeshPhongMaterial({ color: 0xB89B72, flatShading: true, emissive: 0x221a0e });
        this.materials = [matLeft, matRight];

        for (let i = 0; i < CONFIG.TERRAIN_CHUNKS_VISIBLE; i++) {
            this._createChunkPair(i * this.chunkLength);
        }
    }

    _createChunkPair(zOffset) {
        const pair = { left: null, right: null, z: zOffset };

        const width = 30;
        const height = 6;

        const geoL = new THREE.BoxGeometry(width, height, this.chunkLength);
        const left = new THREE.Mesh(geoL, this.materials[0]);
        left.position.set(-CONFIG.STRAIT_WIDTH_START / 2 - width / 2, height / 2 - 1, zOffset);
        this.scene.add(left);
        pair.left = left;

        const geoR = new THREE.BoxGeometry(width, height, this.chunkLength);
        const right = new THREE.Mesh(geoR, this.materials[1]);
        right.position.set(CONFIG.STRAIT_WIDTH_START / 2 + width / 2, height / 2 - 1, zOffset);
        this.scene.add(right);
        pair.right = right;

        this.chunks.push(pair);
        return pair;
    }

    update(delta, scrollSpeed, straitHalfWidth) {
        const move = scrollSpeed * delta;
        this.scrollOffset += move;

        for (const chunk of this.chunks) {
            chunk.z -= move;
            chunk.left.position.z = chunk.z;
            chunk.right.position.z = chunk.z;

            chunk.left.position.x = -straitHalfWidth - 15;
            chunk.right.position.x = straitHalfWidth + 15;
        }

        for (const chunk of this.chunks) {
            if (chunk.z < -this.chunkLength) {
                const maxZ = Math.max(...this.chunks.map(c => c.z));
                chunk.z = maxZ + this.chunkLength;
                chunk.left.position.z = chunk.z;
                chunk.right.position.z = chunk.z;
            }
        }
    }
}
