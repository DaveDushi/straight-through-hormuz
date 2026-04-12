import * as THREE from 'three';
import { CONFIG } from '../config.js';

const WATER_VERTEX = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    varying vec3 vWorldPos;

    void main() {
        vUv = uv;
        vec3 pos = position;
        float wave1 = sin(pos.x * 0.4 + uTime * 0.7) * 0.3;
        float wave2 = sin(pos.z * 0.3 + uTime * 0.5 + 1.5) * 0.25;
        float wave3 = sin((pos.x * 0.7 + pos.z * 0.5) * 0.2 + uTime * 1.1) * 0.15;
        pos.y += wave1 + wave2 + wave3;
        vWave = (wave1 + wave2 + wave3) * 0.5;
        vWorldPos = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const WATER_FRAGMENT = `
    uniform float uTime;
    uniform float uScrollOffset;
    varying vec2 vUv;
    varying float vWave;
    varying vec3 vWorldPos;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
        vec2 worldUV = vWorldPos.xz * 0.02;
        float scroll = uScrollOffset * 0.003;

        vec2 uv1 = worldUV + vec2(uTime * 0.02, -scroll + uTime * 0.01);
        vec2 uv2 = worldUV * 1.4 + vec2(-uTime * 0.015, -scroll * 1.1 + uTime * 0.008);
        vec2 uv3 = worldUV * 2.8 + vec2(uTime * 0.01, -scroll * 0.9 - uTime * 0.012);

        float n1 = noise(uv1 * 8.0);
        float n2 = noise(uv2 * 12.0);
        float n3 = noise(uv3 * 20.0);
        float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        vec3 deep = vec3(0.04, 0.12, 0.28);
        vec3 mid = vec3(0.06, 0.22, 0.42);
        vec3 surface = vec3(0.10, 0.35, 0.55);
        vec3 highlight = vec3(0.20, 0.50, 0.70);

        vec3 color = mix(deep, mid, combined);
        color = mix(color, surface, smoothstep(0.3, 0.7, combined + vWave * 0.4));

        float specular = pow(max(0.0, combined * 2.0 - 0.8), 3.0) * 0.4;
        color += highlight * specular;

        float foam = smoothstep(0.72, 0.85, n1 * 0.6 + n3 * 0.4 + vWave * 0.3);
        vec3 foamColor = vec3(0.45, 0.55, 0.65);
        color = mix(color, foamColor, foam * 0.2);

        gl_FragColor = vec4(color, 1.0);
    }
`;

export class Water {
    constructor(scene) {
        this.uniforms = {
            uTime: { value: 0 },
            uScrollOffset: { value: 0 },
        };

        const geo = new THREE.PlaneGeometry(CONFIG.WATER_PLANE_SIZE, CONFIG.WATER_PLANE_SIZE, 80, 80);
        geo.rotateX(-Math.PI / 2);

        const mat = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: WATER_VERTEX,
            fragmentShader: WATER_FRAGMENT,
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = -0.5;
        scene.add(this.mesh);
    }

    update(delta, distance) {
        this.uniforms.uTime.value += delta;
        this.uniforms.uScrollOffset.value = distance;
    }
}
