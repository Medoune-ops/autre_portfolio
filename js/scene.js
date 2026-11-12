/* =========================================================================
   scene.js — Scène Three.js
   · Cerveau géant formé de milliers de points (surface implicite échantillonnée)
   · Réseau neuronal : axones qui partent du cerveau vers les infos
   · Aucun visuel photographique — tout est généré
   Expose : window.Scene3D.create(canvas) -> instance
   ========================================================================= */
(function () {
    'use strict';

    const IS_TOUCH = window.matchMedia('(hover: none)').matches;
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const AXIS_X = new THREE.Vector3(1, 0, 0);
    const AXIS_Y = new THREE.Vector3(0, 1, 0);

    /* =====================================================================
       SHADERS
       ===================================================================== */

    const POINT_VERT = `
        attribute float aSize;
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uGlitch;
        varying float vSeed;
        varying float vDepth;
        void main(){
            vSeed = aSeed;
            vec3 pos = position;

            // Respiration tres legere de la surface
            float breathe = sin(uTime * 0.8 + aSeed * 6.2831) * 0.006;
            pos += normalize(pos + 0.0001) * breathe;

            // Glitch : le cerveau se decale par bandes quand on scroll vite
            float band = floor(pos.y * 26.0 + uTime * 9.0);
            float g = step(0.86, fract(sin(band * 12.9898) * 43758.5453));
            pos.x += g * uGlitch * 0.055 * (fract(sin(band * 78.233) * 43758.5453) - 0.5);
            pos.z += g * uGlitch * 0.03;

            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            vDepth = -mv.z;
            gl_PointSize = aSize * uPixelRatio * (150.0 / max(-mv.z, 0.001));
            gl_Position = projectionMatrix * mv;
        }
    `;

    const POINT_FRAG = `
        uniform vec3 uColor;
        uniform vec3 uHot;
        uniform float uOpacity;
        uniform float uTime;
        varying float vSeed;
        varying float vDepth;
        void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if(d > 0.5) discard;

            float core = smoothstep(0.5, 0.08, d);
            float a = pow(core, 1.6);

            // Les points proches de l'axe (centre du cerveau) sont plus chauds
            float heat = 1.0 - smoothstep(0.2, 1.4, abs(vDepth - 6.0));
            vec3 col = mix(uColor, uHot, heat * 0.35);

            float tw = 0.62 + 0.38 * sin(uTime * 1.6 + vSeed * 31.4);
            gl_FragColor = vec4(col, a * uOpacity * tw);
        }
    `;

    /* --- Axone : ruban qui pousse du cerveau vers une cible --- */

    const AXON_VERT = `
        attribute float aT;
        attribute float aSeed;
        attribute float aSide;
        uniform float uWidth;
        varying float vT;
        varying float vSeed;
        varying float vSide;
        void main(){
            vT = aT;
            vSeed = aSeed;
            vSide = aSide;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            mv.xy += vec2(0.0, aSide) * uWidth;
            gl_Position = projectionMatrix * mv;
        }
    `;

    const AXON_FRAG = `
        uniform float uProgress;
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3  uColor;
        uniform vec3  uHot;
        varying float vT;
        varying float vSeed;
        varying float vSide;
        void main(){
            if (vT > uProgress) discard;

            float edge = 1.0 - abs(vSide);
            float body = smoothstep(0.0, 0.55, edge);

            float tip = smoothstep(uProgress - 0.09, uProgress, vT);

            float travel = fract(uTime * 0.22 + vSeed);
            float band = exp(-pow((vT - travel) * 9.0, 2.0)) * step(travel, uProgress);

            float alpha = (0.45 + tip * 0.5 + band * 0.3) * body;
            vec3 col = mix(uColor, uHot, clamp(tip * 0.75 + band * 0.55, 0.0, 1.0));
            gl_FragColor = vec4(col, alpha * uOpacity);
        }
    `;

    /* =====================================================================
       FABRIQUE DE TEXTURES
       ===================================================================== */

    function makeGlowTexture() {
        const size = 256;
        const cv = document.createElement('canvas');
        cv.width = cv.height = size;
        const ctx = cv.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0.00, 'rgba(255, 176, 120, 0.75)');
        g.addColorStop(0.26, 'rgba(255, 150, 90, 0.30)');
        g.addColorStop(0.60, 'rgba(210, 190, 220, 0.10)');
        g.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /* =====================================================================
       CERVEAU — surface implicite
       ===================================================================== */

    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hash3(x, y, z) {
        let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }

    function vnoise3(x, y, z) {
        const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        const fx = x - ix, fy = y - iy, fz = z - iz;
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const uz = fz * fz * (3 - 2 * fz);
        const c00 = hash3(ix, iy, iz) * (1 - ux) + hash3(ix + 1, iy, iz) * ux;
        const c10 = hash3(ix, iy + 1, iz) * (1 - ux) + hash3(ix + 1, iy + 1, iz) * ux;
        const c01 = hash3(ix, iy, iz + 1) * (1 - ux) + hash3(ix + 1, iy, iz + 1) * ux;
        const c11 = hash3(ix, iy + 1, iz + 1) * (1 - ux) + hash3(ix + 1, iy + 1, iz + 1) * ux;
        const c0 = c00 * (1 - uy) + c10 * uy;
        const c1 = c01 * (1 - uy) + c11 * uy;
        return c0 * (1 - uz) + c1 * uz;
    }

    function fbm3(x, y, z, oct) {
        let v = 0, a = 0.5, f = 1;
        for (let i = 0; i < (oct || 3); i++) {
            v += a * vnoise3(x * f, y * f, z * f);
            f *= 2.07; a *= 0.5;
        }
        return v;
    }

    function sdEllipsoid(px, py, pz, rx, ry, rz) {
        const ax = px / rx, ay = py / ry, az = pz / rz;
        const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
        const bx = px / (rx * rx), by = py / (ry * ry), bz = pz / (rz * rz);
        const k1 = Math.sqrt(bx * bx + by * by + bz * bz) || 1e-6;
        return k0 * (k0 - 1) / k1;
    }

    function smin(a, b, k) {
        const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k));
        return b * (1 - h) + a * h - k * h * (1 - h);
    }

    /* Signed distance field du cerveau (forme de base) */
    function brainSDF(x, y, z) {
        const l = sdEllipsoid(x - 0.54, y - 0.08, z, 0.66, 0.84, 0.76);
        const r = sdEllipsoid(x + 0.54, y - 0.08, z, 0.66, 0.84, 0.76);
        const cb = sdEllipsoid(x, y + 0.62, z + 0.34, 0.58, 0.32, 0.38);
        const bs = sdEllipsoid(x, y + 0.98, z + 0.04, 0.14, 0.32, 0.13);

        let d = smin(l, r, 0.24);
        d = smin(d, cb, 0.30);
        d = smin(d, bs, 0.18);

        // Fissure longitudinale
        const fx = Math.abs(x) - 0.09;
        const fz = Math.max(-0.20 - z, z - 1.1);
        const fy = -0.30 - y;
        d = Math.max(d, -Math.max(fx, Math.max(fz, fy)));

        return d;
    }

    /* Échantillonnage : rejet sur le SDF de base (rapide), puis projection
       sur la surface via le gradient, puis plis par bruit fractal. */
    function buildBrainSurface(count) {
        const rnd = mulberry32(20261112);
        const pts = [];

        const BX = 1.45, BY_MIN = -1.7, BY_MAX = 1.05, BZ = 1.05;
        const BAND = 0.035;
        const e = 0.010;

        let guard = 0;
        const maxGuard = count * 260;

        while (pts.length < count * 3 && guard < maxGuard) {
            guard++;
            const x = (rnd() * 2 - 1) * BX;
            const y = BY_MIN + rnd() * (BY_MAX - BY_MIN);
            const z = (rnd() * 2 - 1) * BZ;

            const d = brainSDF(x, y, z);
            if (d > BAND || d < -BAND) continue;

            // Gradient -> normale
            const gx = brainSDF(x + e, y, z) - brainSDF(x - e, y, z);
            const gy = brainSDF(x, y + e, z) - brainSDF(x, y - e, z);
            const gz = brainSDF(x, y, z + e) - brainSDF(x, y, z - e);
            const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
            const nx = gx / gl, ny = gy / gl, nz = gz / gl;

            // Point sur la surface
            let px = x - d * nx;
            let py = y - d * ny;
            let pz = z - d * nz;

            // Circonvolutions : deplacement le long de la normale
            const n = (fbm3(px * 5.2, py * 5.2, pz * 5.2, 3) - 0.5) * 2;
            const amp = 0.042;
            px += nx * n * amp;
            py += ny * n * amp;
            pz += nz * n * amp;

            pts.push(px, py, pz);
        }

        // Melange
        const n3 = pts.length / 3;
        for (let i = n3 - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            for (let k = 0; k < 3; k++) {
                const tmp = pts[i * 3 + k];
                pts[i * 3 + k] = pts[j * 3 + k];
                pts[j * 3 + k] = tmp;
            }
        }

        return new Float32Array(pts.slice(0, count * 3));
    }

    /* Voisinage : grille spatiale (le cerveau a des milliers de points) */
    function buildLinks(points, count, perNode, threshold) {
        const cell = threshold;
        const grid = new Map();
        const key = (a, b, c) => a + '|' + b + '|' + c;

        for (let i = 0; i < count; i++) {
            const cx = Math.floor(points[i * 3] / cell);
            const cy = Math.floor(points[i * 3 + 1] / cell);
            const cz = Math.floor(points[i * 3 + 2] / cell);
            const k = key(cx, cy, cz);
            let bucket = grid.get(k);
            if (!bucket) { bucket = []; grid.set(k, bucket); }
            bucket.push(i);
        }

        const links = [];
        const found = [];

        for (let i = 0; i < count; i++) {
            const xi = points[i * 3], yi = points[i * 3 + 1], zi = points[i * 3 + 2];
            const cx = Math.floor(xi / cell);
            const cy = Math.floor(yi / cell);
            const cz = Math.floor(zi / cell);

            found.length = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const bucket = grid.get(key(cx + dx, cy + dy, cz + dz));
                        if (!bucket) continue;
                        for (let b = 0; b < bucket.length; b++) {
                            const j = bucket[b];
                            if (j === i) continue;
                            const ddx = points[j * 3] - xi;
                            const ddy = points[j * 3 + 1] - yi;
                            const ddz = points[j * 3 + 2] - zi;
                            const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
                            if (d2 < threshold * threshold) found.push([d2, j]);
                        }
                    }
                }
            }

            if (found.length > 1) found.sort((a, b) => a[0] - b[0]);
            const take = Math.min(perNode, found.length);
            for (let k = 0; k < take; k++) links.push(i, found[k][1]);
        }

        return links;
    }

    /* =====================================================================
       SCENE
       ===================================================================== */

    class PortfolioScene {
        constructor(canvas) {
            this.canvas = canvas;
            this.clock = new THREE.Clock();
            this.pointer = { x: 0, y: 0 };
            this.pointerSmooth = { x: 0, y: 0 };
            this.isMobile = IS_TOUCH || window.innerWidth < 860;
            this.constScale = 1;
            this.dustScale = 1;
            this.intro = { scale: 1, opacity: 1 };
            this.glitchTarget = 0;
            this.disposed = false;
            this.neurons = [];
            this.neuronObserver = null;

            /* --- Etat anime (pilote par GSAP) ---
               constX / constY normalises : 0 = centre ecran, +-1 = bord */
            this.state = {
                constOpacity: 0.95, constSpread: 1,
                constX: 0, constY: 0.12, constZ: -1.2,
                morphB: 0,
                dustOpacity: 0.35, glowOpacity: 1, glowScale: 1,
                camX: 0, camY: 0, camZ: 8,
                glitch: 0
            };

            this._initRenderer();
            this._initScene();
            this._initDust();
            this._initGlow();
            this._bindEvents();
        }

        /* ---------- Renderer ---------- */
        _initRenderer() {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: !this.isMobile,
                alpha: true,
                powerPreference: 'high-performance'
            });
            this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
            this.renderer.setPixelRatio(this.pixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight, false);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.setClearColor(0x000000, 0);
        }

        _initScene() {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
            this.camera.position.set(0, 0, this.state.camZ);
            this.root = new THREE.Group();
            this.scene.add(this.root);
        }

        /* ---------- Cerveau ---------- */
        buildBrain() {
            if (this.brainReady) return this.brainReady;
            this.brainReady = new Promise((resolve) => {
                setTimeout(() => {
                    this._initBrain();
                    resolve(true);
                }, 0);
            });
            return this.brainReady;
        }

        _initBrain() {
            const count = this.isMobile ? 2200 : 6000;

            this.brainSurface = buildBrainSurface(count);
            this.shapeA = this.brainSurface;
            this.shapeB = this._buildDissolve(count);

            const n = this.brainSurface.length / 3;
            const positions = new Float32Array(this.brainSurface);
            const sizes = new Float32Array(n);
            const seeds = new Float32Array(n);
            const rnd = mulberry32(77123);
            for (let i = 0; i < n; i++) {
                sizes[i] = 0.055 + rnd() * 0.13;
                seeds[i] = rnd();
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

            this.constMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:        { value: 0 },
                    uOpacity:     { value: 0.95 },
                    uPixelRatio:  { value: this.pixelRatio },
                    uGlitch:      { value: 0 },
                    uColor:       { value: new THREE.Color(0x2b4055) },
                    uHot:         { value: new THREE.Color(0xff7a2e) }
                },
                vertexShader: POINT_VERT,
                fragmentShader: POINT_FRAG,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            this.constellation = new THREE.Points(geo, this.constMat);
            this.root.add(this.constellation);

            /* Reseau : liaisons entre voisins proches (grille spatiale) */
            const links = buildLinks(this.brainSurface, n, 2, 0.13);
            const linkCount = links.length / 2;
            const linkPos = new Float32Array(linkCount * 6);
            const linkCol = new Float32Array(linkCount * 6);
            const c = new THREE.Color();
            const rnd2 = mulberry32(4242);

            for (let l = 0; l < linkCount; l++) {
                const alpha = 0.1 + rnd2() * 0.16;
                c.setHSL(0.56 + rnd2() * 0.06, 0.26, 0.40);
                linkCol[l * 6 + 0] = c.r * alpha;
                linkCol[l * 6 + 1] = c.g * alpha;
                linkCol[l * 6 + 2] = c.b * alpha;
                linkCol[l * 6 + 3] = c.r * alpha * 0.55;
                linkCol[l * 6 + 4] = c.g * alpha * 0.55;
                linkCol[l * 6 + 5] = c.b * alpha * 0.55;
            }

            const linkGeo = new THREE.BufferGeometry();
            linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
            linkGeo.setAttribute('color', new THREE.BufferAttribute(linkCol, 3));

            this.links = new THREE.LineSegments(
                linkGeo,
                new THREE.LineBasicMaterial({
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.NormalBlending,
                    depthWrite: false
                })
            );
            this.constellation.add(this.links);
            this.linkIndices = links;
        }

        _buildDissolve(count) {
            const arr = new Float32Array(count * 3);
            const rnd = mulberry32(555);
            for (let i = 0; i < count; i++) {
                const x = this.shapeA[i * 3], y = this.shapeA[i * 3 + 1], z = this.shapeA[i * 3 + 2];
                const k = 1.08 + rnd() * 0.55;
                arr[i * 3 + 0] = x * k + (rnd() - 0.5) * 0.12;
                arr[i * 3 + 1] = y * k + (rnd() - 0.5) * 0.12;
                arr[i * 3 + 2] = z * k + (rnd() - 0.5) * 0.12;
            }
            return arr;
        }

        /* ---------- Poussiere ---------- */
        _initDust() {
            const count = this.isMobile ? 600 : 1800;
            const pos = new Float32Array(count * 3);
            const sizes = new Float32Array(count);
            const seeds = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                pos[i * 3 + 0] = (Math.random() - 0.5) * 26;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 6;
                sizes[i] = 0.04 + Math.random() * 0.12;
                seeds[i] = Math.random();
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

            this.dustMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:       { value: 0 },
                    uOpacity:    { value: 0.35 },
                    uPixelRatio: { value: this.pixelRatio },
                    uGlitch:     { value: 0 },
                    uColor:      { value: new THREE.Color(0x8a9bad) },
                    uHot:        { value: new THREE.Color(0xff9a5c) }
                },
                vertexShader: POINT_VERT,
                fragmentShader: POINT_FRAG,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            this.dust = new THREE.Points(geo, this.dustMat);
            this.root.add(this.dust);
        }

        /* ---------- Halo derriere le cerveau ---------- */
        _initGlow() {
            this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
                map: makeGlowTexture(),
                color: 0xff9a5c,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
                depthTest: false,
                blending: THREE.NormalBlending
            }));
            this.glow.scale.setScalar(9);
            this.root.add(this.glow);
        }

        /* =====================================================================
           AXONES
           ===================================================================== */

        registerNeuronTargets(elements) {
            if (!elements || !elements.length) return;
            if (!this.constellation) return;

            const SEG = 26;
            const rnd = mulberry32(9182);
            const n = this.brainSurface.length / 3;

            const starts = [];
            for (let k = 0; k < 24; k++) {
                const idx = Math.floor(rnd() * n) * 3;
                starts.push(new THREE.Vector3(
                    this.brainSurface[idx],
                    this.brainSurface[idx + 1],
                    this.brainSurface[idx + 2]
                ));
            }
            this.axonStarts = starts;

            if (!this.axonGlow) this.axonGlow = makeGlowTexture();

            elements.forEach((el, ei) => {
                const bundle = 3;
                for (let k = 0; k < bundle; k++) {
                    const vertCount = SEG * 2;
                    const path = new Float32Array(vertCount * 3);
                    const aT = new Float32Array(vertCount);
                    const aSeed = new Float32Array(vertCount);
                    const aSide = new Float32Array(vertCount);
                    const seed = rnd();

                    const index = [];
                    for (let i = 0; i < SEG; i++) {
                        aT[i * 2] = aT[i * 2 + 1] = i / (SEG - 1);
                        aSeed[i * 2] = aSeed[i * 2 + 1] = seed;
                        aSide[i * 2] = -1;
                        aSide[i * 2 + 1] = 1;
                        if (i < SEG - 1) {
                            const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
                            index.push(a, b, c, b, d, c);
                        }
                    }

                    const geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.BufferAttribute(path, 3));
                    geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
                    geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
                    geo.setAttribute('aSide', new THREE.BufferAttribute(aSide, 1));
                    geo.setIndex(index);

                    const mat = new THREE.ShaderMaterial({
                        uniforms: {
                            uProgress: { value: 0 },
                            uTime:     { value: 0 },
                            uOpacity:  { value: 1 },
                            uWidth:    { value: 0.0032 },
                            uColor:    { value: new THREE.Color(0x7d3008) },
                            uHot:      { value: new THREE.Color(0xff6711) }
                        },
                        vertexShader: AXON_VERT,
                        fragmentShader: AXON_FRAG,
                        transparent: true,
                        depthWrite: false,
                        side: THREE.DoubleSide,
                        blending: THREE.NormalBlending
                    });

                    const line = new THREE.Mesh(geo, mat);
                    line.frustumCulled = false;
                    this.root.add(line);

                    const tip = new THREE.Sprite(new THREE.SpriteMaterial({
                        map: this.axonGlow,
                        color: 0xff7a2e,
                        transparent: true,
                        opacity: 0,
                        depthWrite: false,
                        depthTest: false
                    }));
                    tip.scale.setScalar(0.34);
                    this.root.add(tip);

                    this.neurons.push({
                        el, line, geo, path,
                        pts: new Float32Array(SEG * 3),
                        tip, mat,
                        state: { progress: 0 },
                        start: starts[(ei * bundle + k) % starts.length].clone(),
                        origin: new THREE.Vector3(),
                        ctrl: new THREE.Vector3(),
                        target: new THREE.Vector3(),
                        jitter: (rnd() - 0.5) * 0.3
                    });
                }
            });

            if (window.IntersectionObserver) {
                this.neuronObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        const set = this.neurons.filter((a) => a.el === entry.target);
                        const on = entry.isIntersecting;
                        set.forEach((a) => {
                            if (on) {
                                gsap.to(a.state, { progress: 1, duration: 0.85, ease: 'power3.out', overwrite: 'auto' });
                            } else {
                                gsap.to(a.state, { progress: 0, duration: 0.45, ease: 'power2.in', overwrite: 'auto' });
                            }
                        });
                    });
                }, { threshold: 0.3, rootMargin: '-8% 0px -8% 0px' });

                elements.forEach((el) => this.neuronObserver.observe(el));
            }
        }

        /* Position ecran -> monde. L'axone vise un point precis de l'info
           (son titre) puis se poursuit jusqu'au bord de son conteneur. */
        _elementWorldPos(el, out) {
            const vw = window.innerWidth, vh = window.innerHeight;

            const bx = (this.state.constX + 1) * 0.5 * vw;
            const by = (1 - this.state.constY) * 0.5 * vh;

            const anchorEl = el.querySelector('h3, h4, strong, .mono, .service-card__icon, .project__idx') || el;
            const a = anchorEl.getBoundingClientRect();
            const c = el.getBoundingClientRect();

            const ax = a.left + a.width * 0.5;
            const ay = a.top + a.height * 0.5;

            let dx = ax - bx, dy = ay - by;
            const len = Math.hypot(dx, dy) || 1;
            dx /= len; dy /= len;

            let px = ax, py = ay;
            if (Math.abs(dx) > 1e-5) {
                const tx = dx > 0 ? (c.right - ax) / dx : (c.left - ax) / dx;
                const ty = Math.abs(dy) > 1e-5 ? (dy > 0 ? (c.bottom - ay) / dy : (c.top - ay) / dy) : Infinity;
                const tt = Math.max(0, Math.min(tx, ty));
                px = ax + dx * tt;
                py = ay + dy * tt;
            }

            const sx = px / vw;
            const sy = py / vh;
            const dist = Math.max(0.5, this.camera.position.z - this.state.constZ);
            const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5) * dist;
            const halfW = halfH * this.camera.aspect;
            out.set((sx * 2 - 1) * halfW, -(sy * 2 - 1) * halfH, this.state.constZ);
            return out;
        }

        _updateNeurons(t) {
            if (!this.neurons.length) return;
            const s = this.state;
            const SEG = 26;

            for (let n = 0; n < this.neurons.length; n++) {
                const axon = this.neurons[n];
                const p = axon.state.progress;
                axon.mat.uniforms.uTime.value = t;
                axon.mat.uniforms.uProgress.value = p;

                if (p <= 0.001) {
                    axon.tip.material.opacity = 0;
                    continue;
                }

                this._elementWorldPos(axon.el, axon.target);

                const scale = s.constSpread * this.constScale;
                const origin = axon.origin.copy(axon.start).multiplyScalar(scale);
                origin.applyAxisAngle(AXIS_Y, this.constellation.rotation.y);
                origin.applyAxisAngle(AXIS_X, this.constellation.rotation.x);
                origin.add(this.constellation.position);

                const mid = axon.ctrl.copy(origin).add(axon.target).multiplyScalar(0.5);
                const dist = origin.distanceTo(axon.target);
                const outward = mid.clone().normalize();
                mid.addScaledVector(outward, dist * 0.2 + axon.jitter);
                mid.z += axon.jitter * 0.4;

                const arr = axon.path;
                const pts = axon.pts;
                for (let i = 0; i < SEG; i++) {
                    const u = i / (SEG - 1);
                    const iu = 1 - u;
                    const bx = iu * iu * origin.x + 2 * iu * u * mid.x + u * u * axon.target.x;
                    const by = iu * iu * origin.y + 2 * iu * u * mid.y + u * u * axon.target.y;
                    const bz = iu * iu * origin.z + 2 * iu * u * mid.z + u * u * axon.target.z;
                    const wob = Math.sin(u * 9 + axon.jitter * 20) * 0.03 * dist;
                    pts[i * 3 + 0] = bx + wob * 0.4;
                    pts[i * 3 + 1] = by + wob;
                    pts[i * 3 + 2] = bz;
                }

                const w = 0.0095;
                for (let i = 0; i < SEG; i++) {
                    const ip = Math.max(0, i - 1) * 3;
                    const inx = Math.min(SEG - 1, i + 1) * 3;
                    let tx = pts[inx] - pts[ip];
                    let ty = pts[inx + 1] - pts[ip + 1];
                    const tl = Math.hypot(tx, ty) || 1;
                    tx /= tl; ty /= tl;
                    const nx = -ty, ny = tx;

                    arr[(i * 2) * 3 + 0] = pts[i * 3 + 0] + nx * w;
                    arr[(i * 2) * 3 + 1] = pts[i * 3 + 1] + ny * w;
                    arr[(i * 2) * 3 + 2] = pts[i * 3 + 2];
                    arr[(i * 2 + 1) * 3 + 0] = pts[i * 3 + 0] - nx * w;
                    arr[(i * 2 + 1) * 3 + 1] = pts[i * 3 + 1] - ny * w;
                    arr[(i * 2 + 1) * 3 + 2] = pts[i * 3 + 2];
                }
                axon.geo.attributes.position.needsUpdate = true;

                const hi = Math.min(SEG - 1, Math.max(0, Math.floor(p * (SEG - 1))));
                axon.tip.position.set(axon.pts[hi * 3], axon.pts[hi * 3 + 1], axon.pts[hi * 3 + 2]);
                axon.tip.material.opacity = 0.85 * Math.min(1, p * 2);
                axon.tip.scale.setScalar(0.22 + 0.14 * Math.sin(t * 4 + n));
            }
        }

        /* ---------- Evenements ---------- */
        _bindEvents() {
            this._onPointerMove = (e) => {
                this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
                this.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
            };
            window.addEventListener('pointermove', this._onPointerMove, { passive: true });
            this._onResize = () => this.resize();
            window.addEventListener('resize', this._onResize);
        }

        resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h, false);
            this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
            this.renderer.setPixelRatio(this.pixelRatio);
            this.constMat.uniforms.uPixelRatio.value = this.pixelRatio;
            this.dustMat.uniforms.uPixelRatio.value = this.pixelRatio;

            const aspect = w / h;
            this.constScale = Math.min(1.15, Math.max(0.55, aspect / 1.6));
            this.dustScale = Math.min(0.9, Math.max(0.5, aspect / 1.9));
        }

        /* ---------- Positions du cerveau ---------- */
        _updateConstellation() {
            const s = this.state;
            const pos = this.constellation.geometry.attributes.position.array;
            const A = this.shapeA, B = this.shapeB;
            const mB = Math.pow(s.morphB, 1.9);
            const spread = s.constSpread * this.constScale;

            for (let i = 0; i < pos.length; i += 3) {
                pos[i]     = (A[i]     + (B[i]     - A[i])     * mB) * spread;
                pos[i + 1] = (A[i + 1] + (B[i + 1] - A[i + 1]) * mB) * spread;
                pos[i + 2] = (A[i + 2] + (B[i + 2] - A[i + 2]) * mB) * spread;
            }
            this.constellation.geometry.attributes.position.needsUpdate = true;

            const lp = this.links.geometry.attributes.position.array;
            const idx = this.linkIndices;
            for (let l = 0; l < idx.length; l += 2) {
                const a = idx[l] * 3, b = idx[l + 1] * 3;
                lp[l * 3 + 0] = pos[a];     lp[l * 3 + 1] = pos[a + 1]; lp[l * 3 + 2] = pos[a + 2];
                lp[l * 3 + 3] = pos[b];     lp[l * 3 + 4] = pos[b + 1]; lp[l * 3 + 5] = pos[b + 2];
            }
            this.links.geometry.attributes.position.needsUpdate = true;
        }

        /* ---------- Boucle ---------- */
        render() {
            if (this.disposed) return;
            const t = this.clock.elapsedTime;
            const s = this.state;

            this.pointerSmooth.x += (this.pointer.x - this.pointerSmooth.x) * 0.055;
            this.pointerSmooth.y += (this.pointer.y - this.pointerSmooth.y) * 0.055;

            if (this.constellation) {
                this.constMat.uniforms.uTime.value = t;
                this.constMat.uniforms.uOpacity.value = s.constOpacity * this.intro.opacity;
                this.constMat.uniforms.uGlitch.value = s.glitch;
                this.links.material.opacity = s.constOpacity * this.intro.opacity;

                this.constellation.rotation.y = Math.sin(t * 0.1) * 0.16 + this.pointerSmooth.x * 0.12;
                this.constellation.rotation.x = Math.sin(t * 0.075) * 0.06 + this.pointerSmooth.y * 0.06;

                const brainDist = Math.max(0.5, this.camera.position.z - s.constZ);
                const bHalfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5) * brainDist;
                const bHalfW = bHalfH * this.camera.aspect;
                this.constellation.position.x = s.constX * bHalfW;
                this.constellation.position.y = s.constY * bHalfH;
                this.constellation.position.z = s.constZ;
                // L'echelle est deja cuite dans les positions (voir
                // _updateConstellation) : le groupe ne porte que l'intro.
                this.constellation.scale.setScalar(this.intro.scale);
                this._updateConstellation();

                this.glow.position.set(this.constellation.position.x, this.constellation.position.y, s.constZ - 0.6);
                this.glow.scale.setScalar(9 * s.glowScale * this.intro.scale);
                this.glow.material.opacity = 0.5 * s.glowOpacity * this.intro.opacity;
            }

            this._updateNeurons(t);

            this.dustMat.uniforms.uTime.value = t;
            this.dustMat.uniforms.uOpacity.value = s.dustOpacity;
            this.dustMat.uniforms.uGlitch.value = s.glitch * 0.5;
            this.dust.position.x = -this.pointerSmooth.x * 0.7 * this.dustScale;
            this.dust.position.y = -this.pointerSmooth.y * 0.5 * this.dustScale;

            s.glitch += (this.glitchTarget - s.glitch) * 0.25;
            this.glitchTarget *= 0.86;

            this.camera.position.x += (s.camX + this.pointerSmooth.x * 0.32 - this.camera.position.x) * 0.06;
            this.camera.position.y += (s.camY + this.pointerSmooth.y * 0.22 - this.camera.position.y) * 0.06;
            this.camera.position.z += (s.camZ - this.camera.position.z) * 0.06;
            this.camera.lookAt(0, 0, 0);

            this.renderer.render(this.scene, this.camera);
        }

        dispose() {
            this.disposed = true;
            window.removeEventListener('pointermove', this._onPointerMove);
            window.removeEventListener('resize', this._onResize);
            if (this.neuronObserver) this.neuronObserver.disconnect();
            this.renderer.dispose();
        }
    }

    window.Scene3D = {
        create(canvas) { return new PortfolioScene(canvas); },
        REDUCED: REDUCED
    };
})();
