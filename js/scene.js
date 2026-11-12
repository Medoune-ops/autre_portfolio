/* =========================================================================
   scene.js — Scène Three.js
   · Cerveau formé de points (surface implicite échantillonnée par rayons)
   · Réseau neuronal : axones qui partent du cerveau vers les infos
   · Volume de photo 3D (déformation par bruit, aberration chromatique)
   Expose : window.Scene3D.create(canvas) -> instance
   L'instance expose .state, objet de valeurs numériques animées par GSAP
   (choreography.js) et appliquées à chaque frame.
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

    const NOISE_GLSL = `
        float hash21(vec2 p){
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float vnoise(vec2 p){
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash21(i + vec2(0.0,0.0)), hash21(i + vec2(1.0,0.0)), u.x),
                mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0,1.0)), u.x),
                u.y
            );
        }
        float fbm(vec2 p){
            float v = 0.0;
            float a = 0.5;
            for(int i = 0; i < 4; i++){
                v += a * vnoise(p);
                p *= 2.03;
                a *= 0.5;
            }
            return v;
        }
    `;

    const PHOTO_VERT = `
        uniform float uTime;
        uniform float uAmp;
        varying vec2 vUv;
        varying float vDepth;
        ${NOISE_GLSL}
        void main(){
            vUv = uv;
            vec3 pos = position;
            vec2 p = uv * vec2(2.2, 2.9);
            float n = fbm(p + vec2(uTime * 0.09, uTime * -0.07));
            float bulge = sin(uv.x * 3.14159) * sin(uv.y * 3.14159);
            pos.z += (n - 0.5) * uAmp * (0.35 + 0.65 * bulge);
            pos.z += bulge * 0.22;
            vDepth = pos.z;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    const PHOTO_FRAG = `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uAberration;
        uniform float uGlitch;
        uniform vec3  uAccent;
        varying vec2 vUv;
        varying float vDepth;
        ${NOISE_GLSL}
        void main(){
            vec2 uv = vUv;

            float g = step(0.985 - uGlitch * 0.12, hash21(vec2(floor(uv.y * 42.0), floor(uTime * 22.0))));
            uv.x += g * uGlitch * 0.035 * (hash21(vec2(floor(uv.y * 42.0), 3.0)) - 0.5);

            vec2 dir = uv - 0.5;
            float d2 = dot(dir, dir);
            float ab = uAberration * (0.25 + d2 * 3.0);

            float r = texture2D(uTexture, uv + dir * ab).r;
            float gch = texture2D(uTexture, uv).g;
            float b = texture2D(uTexture, uv - dir * ab).b;
            vec3 col = vec3(r, gch, b);

            float sheen = smoothstep(0.55, 1.0, sin((uv.x * 1.4 + uv.y * 0.8 - uTime * 0.18) * 3.14159) * 0.5 + 0.5);
            col += sheen * 0.16 * vec3(0.55, 0.78, 1.0);

            float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
            float rim = 1.0 - smoothstep(0.0, 0.028, edge);
            col = mix(col, uAccent, rim * 0.55);

            float vign = smoothstep(0.78, 0.22, d2 * 2.4);
            col *= mix(0.62, 1.0, vign);

            gl_FragColor = vec4(col, uOpacity);
        }
    `;

    const POINT_VERT = `
        attribute float aSize;
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vSeed;
        void main(){
            vSeed = aSeed;
            vec3 pos = position;
            pos.z += sin(uTime * 0.75 + aSeed * 24.0) * 0.05;
            pos.x += cos(uTime * 0.45 + aSeed * 11.0) * 0.035;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * uPixelRatio * (140.0 / max(-mv.z, 0.001));
            gl_Position = projectionMatrix * mv;
        }
    `;

    const POINT_FRAG = `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying float vSeed;
        void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if(d > 0.5) discard;
            float core = smoothstep(0.5, 0.06, d);
            float a = pow(core, 1.7) * 0.9 + core * 0.1;
            float tw = 0.6 + 0.4 * sin(uTime * 1.7 + vSeed * 31.4);
            gl_FragColor = vec4(uColor, a * uOpacity * (0.55 + 0.45 * tw));
        }
    `;

    /* --- Axone : ligne qui pousse du cerveau vers une cible --- */

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

            // Épaisseur du ruban, orientée face à la caméra
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

            // Bord du ruban plus doux
            float edge = 1.0 - abs(vSide);
            float body = smoothstep(0.0, 0.55, edge);

            // Pointe lumineuse qui avance le long du fil
            float tip = smoothstep(uProgress - 0.09, uProgress, vT);

            // Signal qui circule en boucle sur le fil déployé
            float travel = fract(uTime * 0.22 + vSeed);
            float band = exp(-pow((vT - travel) * 9.0, 2.0)) * step(travel, uProgress);

            float alpha = (0.42 + tip * 0.5 + band * 0.3) * body;
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
        g.addColorStop(0.00, 'rgba(255, 168, 110, 0.85)');
        g.addColorStop(0.24, 'rgba(255, 138, 70, 0.34)');
        g.addColorStop(0.58, 'rgba(215, 190, 220, 0.12)');
        g.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    function makeFallbackTexture() {
        const cv = document.createElement('canvas');
        cv.width = 512; cv.height = 683;
        const ctx = cv.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 512, 683);
        g.addColorStop(0, '#101a2c');
        g.addColorStop(1, '#1b1030');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 683);
        ctx.fillStyle = 'rgba(255,140,60,.75)';
        ctx.font = '600 26px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEDOUNE SECK', 256, 340);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /* =====================================================================
       CERVEAU — surface implicite échantillonnée par lancer de rayons
       ===================================================================== */

    /* PRNG déterministe : le cerveau est identique à chaque chargement */
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

    /* Signed distance field du cerveau — version de base (sans bruit) */
    function brainSDFBase(x, y, z) {
        // Deux hémisphères
        const l = sdEllipsoid(x - 0.54, y - 0.08, z, 0.66, 0.84, 0.76);
        const r = sdEllipsoid(x + 0.54, y - 0.08, z, 0.66, 0.84, 0.76);
        // Cervelet : calé sous les lobes pour rester lisible de face
        const cb = sdEllipsoid(x, y + 0.62, z + 0.34, 0.58, 0.32, 0.38);
        // Tronc cérébral
        const bs = sdEllipsoid(x, y + 0.98, z + 0.04, 0.14, 0.32, 0.13);

        let d = smin(l, r, 0.24);
        d = smin(d, cb, 0.30);
        d = smin(d, bs, 0.18);

        // Fissure longitudinale : fente verticale au centre
        const fx = Math.abs(x) - 0.09;
        const fz = Math.max(-0.20 - z, z - 1.1);
        const fy = -0.30 - y;
        d = Math.max(d, -Math.max(fx, Math.max(fz, fy)));

        return d;
    }

    /* Version bruitée : les circonvolutions sont creusées dans la surface */
    function brainSDF(x, y, z) {
        const d = brainSDFBase(x, y, z);
        const n = (fbm3(x * 4.4, y * 4.4, z * 4.4, 3) - 0.5) * 2;
        // Le bruit ne s'applique qu'à proximité de la surface
        const w = Math.max(0, 1 - Math.abs(d) / 0.25);
        return d + 0.055 * n * w;
    }

    /* Échantillonnage de la surface : rejet par bande autour de l'isosurface,
       puis projection sur la surface via le gradient du SDF. */
    function buildBrainSurface(count) {
        const rnd = mulberry32(20261112);
        const points = [];

        const BX = 1.45, BY_MIN = -1.7, BY_MAX = 1.05, BZ = 1.05;
        const BAND = 0.055;

        let guard = 0;
        while (points.length < count * 3 && guard < count * 400) {
            guard++;
            const x = (rnd() * 2 - 1) * BX;
            const y = BY_MIN + rnd() * (BY_MAX - BY_MIN);
            const z = (rnd() * 2 - 1) * BZ;

            const d = brainSDF(x, y, z);
            if (Math.abs(d) > BAND) continue;

            // Filtre de sécurité : on rejette les points trop loin de la
            // forme (l'approximation du SDF n'est fiable que près de la surface)
            const dBase = brainSDFBase(x, y, z);
            if (Math.abs(dBase) > 0.16) continue;

            // Projection sur la surface (gradient par différences finies)
            const e = 0.012;
            const gx = brainSDF(x + e, y, z) - brainSDF(x - e, y, z);
            const gy = brainSDF(x, y + e, z) - brainSDF(x, y - e, z);
            const gz = brainSDF(x, y, z + e) - brainSDF(x, y, z - e);
            const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;

            let px = x - d * (gx / gl);
            let py = y - d * (gy / gl);
            let pz = z - d * (gz / gl);

            // Seconde passe : plus propre sur les plis
            const d2 = brainSDF(px, py, pz);
            const g2x = brainSDF(px + e, py, pz) - brainSDF(px - e, py, pz);
            const g2y = brainSDF(px, py + e, pz) - brainSDF(px, py - e, pz);
            const g2z = brainSDF(px, py, pz + e) - brainSDF(px, py, pz - e);
            const g2l = Math.sqrt(g2x * g2x + g2y * g2y + g2z * g2z) || 1;
            px -= d2 * (g2x / g2l);
            py -= d2 * (g2y / g2l);
            pz -= d2 * (g2z / g2l);

            points.push(px, py, pz);
        }

        // Mélange pour homogénéiser la distribution
        const count3 = points.length / 3;
        for (let i = count3 - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            for (let k = 0; k < 3; k++) {
                const tmp = points[i * 3 + k];
                points[i * 3 + k] = points[j * 3 + k];
                points[j * 3 + k] = tmp;
            }
        }

        // On garde exactement le nombre voulu
        return new Float32Array(points.slice(0, count * 3));
    }

    /* =====================================================================
       SCÈNE
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
            this.ready = false;
            this.disposed = false;
            this.neurons = [];
            this.neuronObserver = null;

            /* --- État animé (piloté par GSAP) ---
               photoX / photoY sont NORMALISÉS : 0 = centre de l'écran,
               ±1 = bord de l'écran. Le placement reste donc identique
               sur mobile, tablette et desktop. */
            this.state = {
                photoX: 0.68, photoY: 0.16, photoZ: -0.6,
                photoRotX: 0.02, photoRotY: -0.18, photoRotZ: 0.012,
                photoScale: 0.92, photoOpacity: 1,
                echoOpacity: 0.34, echoSpread: 1,
                constOpacity: 0.85, constSpread: 1,
                constX: 0.1, constY: -0.05, constZ: -2,
                morphA: 0, morphB: 0,
                dustOpacity: 0.4, haloOpacity: 0.9, haloScale: 1,
                camX: 0, camY: 0, camZ: 8,
                amp: 0.16, aberration: 0.006, glitch: 0
            };

            this._initRenderer();
            this._initScene();
            this._initPhoto();
            this._initDust();
            this._initHalo();
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

        /* ---------- Volume de photo ---------- */
        _initPhoto() {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous');

            this.photoGroup = new THREE.Group();
            this.root.add(this.photoGroup);

            const portrait = new THREE.PlaneGeometry(2.55, 3.4, 44, 58);

            this.photoMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTexture:    { value: makeFallbackTexture() },
                    uTime:       { value: 0 },
                    uOpacity:    { value: 1 },
                    uAmp:        { value: 0.16 },
                    uAberration: { value: 0.006 },
                    uGlitch:     { value: 0 },
                    uAccent:     { value: new THREE.Color(0xff6711) }
                },
                vertexShader: PHOTO_VERT,
                fragmentShader: PHOTO_FRAG,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            this.photoMesh = new THREE.Mesh(portrait, this.photoMat);
            this.photoGroup.add(this.photoMesh);

            /* Échos : copies en profondeur qui créent le volume */
            this.echoes = [];
            for (let i = 1; i <= 3; i++) {
                const mat = new THREE.MeshBasicMaterial({
                    map: null,
                    transparent: true,
                    opacity: 0.16 / i,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.NormalBlending
                });
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 3.4, 1, 1), mat);
                mesh.position.z = -0.35 * i;
                this.photoGroup.add(mesh);
                this.echoes.push(mesh);
            }

            /* Contour lumineux */
            const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.72, 3.57));
            this.frame = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({ color: 0xff6711, transparent: true, opacity: 0.55 })
            );
            this.photoGroup.add(this.frame);

            /* Halo derrière la photo */
            this.halo = new THREE.Mesh(
                new THREE.PlaneGeometry(5.2, 6.1),
                new THREE.MeshBasicMaterial({
                    map: makeGlowTexture(),
                    transparent: true,
                    opacity: 0.22,
                    blending: THREE.NormalBlending,
                    depthWrite: false
                })
            );
            this.halo.position.z = -1.4;
            this.photoGroup.add(this.halo);

            this.photoReady = new Promise((resolve) => {
                loader.load(
                    'assets/portrait.jpg',
                    (tex) => {
                        tex.colorSpace = THREE.SRGBColorSpace;
                        tex.minFilter = THREE.LinearFilter;
                        tex.generateMipmaps = true;
                        this.photoMat.uniforms.uTexture.value = tex;
                        this.echoes.forEach((e) => { e.material.map = tex; e.material.needsUpdate = true; });
                        resolve(true);
                    },
                    undefined,
                    () => resolve(false)
                );
            });
        }

        /* ---------- Cerveau en points ---------- */
        buildBrain() {
            if (this.brainReady) return this.brainReady;
            this.brainReady = new Promise((resolve) => {
                // Laisse le navigateur peindre le préloader avant le calcul
                setTimeout(() => {
                    this._initBrain();
                    resolve(true);
                }, 0);
            });
            return this.brainReady;
        }

        _initBrain() {
            const count = this.isMobile ? 380 : 760;

            this.brainSurface = buildBrainSurface(count);
            this.shapeA = this.brainSurface;
            // Forme de repli : le cerveau se dilue dans son propre nuage
            this.shapeB = this._buildDissolve(count);

            const n = this.brainSurface.length / 3;
            const positions = new Float32Array(this.brainSurface);
            const sizes = new Float32Array(n);
            const seeds = new Float32Array(n);
            const rnd = mulberry32(77123);
            for (let i = 0; i < n; i++) {
                sizes[i] = 0.09 + rnd() * 0.22;
                seeds[i] = rnd();
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

            this.constMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:        { value: 0 },
                    uOpacity:     { value: 0.85 },
                    uPixelRatio:  { value: this.pixelRatio },
                    uColor:       { value: new THREE.Color(0x2f4a63) }
                },
                vertexShader: POINT_VERT,
                fragmentShader: POINT_FRAG,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            this.constellation = new THREE.Points(geo, this.constMat);
            this.root.add(this.constellation);

            /* Liaisons : topologie figée, les points se déplacent ensuite */
            const links = this._buildLinks(n, 2);
            const linkCount = links.length / 2;
            const linkPos = new Float32Array(linkCount * 6);
            const linkCol = new Float32Array(linkCount * 6);
            const c = new THREE.Color();
            const rnd2 = mulberry32(4242);

            for (let l = 0; l < linkCount; l++) {
                const alpha = 0.1 + rnd2() * 0.14;
                c.setHSL(0.56 + rnd2() * 0.06, 0.28, 0.42);
                linkCol[l * 6 + 0] = c.r * alpha;
                linkCol[l * 6 + 1] = c.g * alpha;
                linkCol[l * 6 + 2] = c.b * alpha;
                linkCol[l * 6 + 3] = c.r * alpha * 0.6;
                linkCol[l * 6 + 4] = c.g * alpha * 0.6;
                linkCol[l * 6 + 5] = c.b * alpha * 0.6;
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
            // Enfant du groupe : les liaisons suivent exactement les points
            this.constellation.add(this.links);
            this.linkIndices = links;
        }

        /* Dissolution : chaque point s'éloigne du cerveau en conservant sa
           direction — le cerveau se délie dans un nuage, pas dans une
           forme sans rapport. */
        _buildDissolve(count) {
            const arr = new Float32Array(count * 3);
            const rnd = mulberry32(555);
            for (let i = 0; i < count; i++) {
                const x = this.shapeA[i * 3], y = this.shapeA[i * 3 + 1], z = this.shapeA[i * 3 + 2];
                const len = Math.hypot(x, y, z) || 1;
                const k = 1.08 + rnd() * 0.55;
                arr[i * 3 + 0] = x * k + (rnd() - 0.5) * 0.12;
                arr[i * 3 + 1] = y * k + (rnd() - 0.5) * 0.12;
                arr[i * 3 + 2] = z * k + (rnd() - 0.5) * 0.12;
            }
            return arr;
        }

        _buildLinks(count, perNode) {
            const links = [];
            const threshold = 0.4;
            for (let i = 0; i < count; i++) {
                const xi = this.shapeA[i * 3], yi = this.shapeA[i * 3 + 1], zi = this.shapeA[i * 3 + 2];
                const found = [];
                for (let j = 0; j < count; j++) {
                    if (i === j) continue;
                    const dx = this.shapeA[j * 3] - xi;
                    const dy = this.shapeA[j * 3 + 1] - yi;
                    const dz = this.shapeA[j * 3 + 2] - zi;
                    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (d < threshold) found.push({ j, d });
                }
                found.sort((a, b) => a.d - b.d);
                for (let k = 0; k < Math.min(perNode, found.length); k++) {
                    links.push(i, found[k].j);
                }
            }
            return links;
        }

        /* ---------- Poussière ---------- */
        _initDust() {
            const count = this.isMobile ? 700 : 2200;
            const pos = new Float32Array(count * 3);
            const sizes = new Float32Array(count);
            const seeds = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                pos[i * 3 + 0] = (Math.random() - 0.5) * 26;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 6;
                sizes[i] = 0.04 + Math.random() * 0.14;
                seeds[i] = Math.random();
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

            this.dustMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:       { value: 0 },
                    uOpacity:    { value: 0.55 },
                    uPixelRatio: { value: this.pixelRatio },
                    uColor:      { value: new THREE.Color(0x7d8fa3) }
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

        /* ---------- Noyau lumineux ---------- */
        _initHalo() {
            this.core = new THREE.Mesh(
                new THREE.PlaneGeometry(2.6, 2.6),
                new THREE.MeshBasicMaterial({
                    map: makeGlowTexture(),
                    transparent: true,
                    opacity: 0.14,
                    blending: THREE.NormalBlending,
                    depthWrite: false
                })
            );
            this.core.position.z = -2.2;
            this.root.add(this.core);
        }

        /* =====================================================================
           AXONES — les fils qui partent du cerveau vers les infos
           ===================================================================== */

        /**
         * Déclare les éléments « info » du DOM. Chaque élément reçoit
         * des axones qui iront du cerveau jusqu'à lui.
         */
        registerNeuronTargets(elements) {
            if (!elements || !elements.length) return;
            if (!this.constellation) return;

            const SEG = 26;
            const rnd = mulberry32(9182);
            const n = this.brainSurface.length / 3;

            // Une seule texture de halo pour tous les axones
            if (!this.axonGlow) this.axonGlow = makeGlowTexture();

            // Points de départ sur le cerveau (réparties sur toute la surface)
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

            elements.forEach((el, ei) => {
                const bundle = 3;
                for (let k = 0; k < bundle; k++) {
                    /* Ruban : 2 sommets par point -> vraie épaisseur */
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

                    /* Tête lumineuse qui avance sur le fil
                       (texture partagée : 1 seule pour tous les axones) */
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
                        el,
                        line,
                        geo,
                        path,
                        pts: new Float32Array(SEG * 3),
                        tip,
                        mat,
                        state: { progress: 0 },
                        start: starts[(ei * bundle + k) % starts.length].clone(),
                        origin: new THREE.Vector3(),
                        ctrl: new THREE.Vector3(),
                        target: new THREE.Vector3(),
                        jitter: (rnd() - 0.5) * 0.3
                    });
                }
            });

            /* Les axones se déclenchent quand l'info entre dans l'écran */
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

        /* Position écran -> monde, à la profondeur du cerveau.
           L'axone vise un point précis de l'info (son titre), puis se
           poursuit jusqu'au bord de son conteneur : le fil reste visible
           au lieu de disparaître sous la carte. */
        _elementWorldPos(el, out) {
            const vw = window.innerWidth, vh = window.innerHeight;

            // Position écran du cerveau
            const bx = (this.state.constX + 1) * 0.5 * vw;
            const by = (1 - this.state.constY) * 0.5 * vh;

            // Ancre : le titre / label significatif de l'info
            const anchorEl = el.querySelector('h3, h4, strong, .mono, .service-card__icon, .project__idx') || el;
            const a = anchorEl.getBoundingClientRect();
            const c = el.getBoundingClientRect();

            const ax = a.left + a.width * 0.5;
            const ay = a.top + a.height * 0.5;

            // Rayon cerveau -> ancre, prolongé jusqu'au bord du conteneur
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

        /* Rebuild des paths d'axones + animation */
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

                // Cible = bord le plus proche de l'info dans le DOM
                this._elementWorldPos(axon.el, axon.target);

                // Point de départ : surface du cerveau, côté cible.
                // On repasse des coordonnées locales du groupe vers le monde.
                const scale = s.constSpread * this.constScale;
                const origin = axon.origin.copy(axon.start).multiplyScalar(scale);
                origin.applyAxisAngle(AXIS_Y, this.constellation.rotation.y);
                origin.applyAxisAngle(AXIS_X, this.constellation.rotation.x);
                origin.add(this.constellation.position);

                // Point de contrôle : le fil gonfle vers l'extérieur du cerveau
                const mid = axon.ctrl.copy(origin).add(axon.target).multiplyScalar(0.5);
                const dist = origin.distanceTo(axon.target);
                const outward = mid.clone().normalize();
                mid.addScaledVector(outward, dist * 0.2 + axon.jitter);
                mid.z += axon.jitter * 0.4;

                // Courbe de Bézier quadratique, légèrement bruitée
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

                // Dérive du ruban : 2 sommets par point, décalés perpendiculairement
                for (let i = 0; i < SEG; i++) {
                    const ip = Math.max(0, i - 1) * 3;
                    const inx = Math.min(SEG - 1, i + 1) * 3;
                    let tx = pts[inx] - pts[ip];
                    let ty = pts[inx + 1] - pts[ip + 1];
                    const tl = Math.hypot(tx, ty) || 1;
                    tx /= tl; ty /= tl;
                    const nx = -ty, ny = tx;

                    const w = 0.0095;
                    arr[(i * 2) * 3 + 0] = pts[i * 3 + 0] + nx * w;
                    arr[(i * 2) * 3 + 1] = pts[i * 3 + 1] + ny * w;
                    arr[(i * 2) * 3 + 2] = pts[i * 3 + 2];
                    arr[(i * 2 + 1) * 3 + 0] = pts[i * 3 + 0] - nx * w;
                    arr[(i * 2 + 1) * 3 + 1] = pts[i * 3 + 1] - ny * w;
                    arr[(i * 2 + 1) * 3 + 2] = pts[i * 3 + 2];
                }
                axon.geo.attributes.position.needsUpdate = true;

                // Tête lumineuse
                const hi = Math.min(SEG - 1, Math.max(0, Math.floor(p * (SEG - 1))));
                axon.tip.position.set(axon.pts[hi * 3], axon.pts[hi * 3 + 1], axon.pts[hi * 3 + 2]);
                axon.tip.material.opacity = 0.85 * Math.min(1, p * 2);
                axon.tip.scale.setScalar(0.22 + 0.14 * Math.sin(t * 4 + n));
            }
        }

        /* ---------- Événements ---------- */
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

            // La constellation s'adapte au format : elle respire sur desktop,
            // s'intègre dans l'étroit sur mobile.
            const aspect = w / h;
            this.constScale = Math.min(0.66, Math.max(0.42, aspect / 2.4));
            this.dustScale = Math.min(0.9, Math.max(0.5, aspect / 1.9));
        }

        /* ---------- Mise à jour des positions du cerveau ---------- */
        _updateConstellation() {
            const s = this.state;
            const pos = this.constellation.geometry.attributes.position.array;
            const A = this.shapeA, B = this.shapeB;
            // Courbe non linéaire : le cerveau reste intact longtemps,
            // puis se délite d'un coup au contact.
            const mB = Math.pow(s.morphB, 1.9);
            const spread = s.constSpread * this.constScale;

            for (let i = 0; i < pos.length; i += 3) {
                pos[i]     = (A[i]     + (B[i]     - A[i])     * mB) * spread;
                pos[i + 1] = (A[i + 1] + (B[i + 1] - A[i + 1]) * mB) * spread;
                pos[i + 2] = (A[i + 2] + (B[i + 2] - A[i + 2]) * mB) * spread;
            }
            this.constellation.geometry.attributes.position.needsUpdate = true;

            // Les liaisons suivent les points
            const lp = this.links.geometry.attributes.position.array;
            const idx = this.linkIndices;
            for (let l = 0; l < idx.length; l += 2) {
                const a = idx[l] * 3, b = idx[l + 1] * 3;
                lp[l * 3 + 0] = pos[a];     lp[l * 3 + 1] = pos[a + 1]; lp[l * 3 + 2] = pos[a + 2];
                lp[l * 3 + 3] = pos[b];     lp[l * 3 + 4] = pos[b + 1]; lp[l * 3 + 5] = pos[b + 2];
            }
            this.links.geometry.attributes.position.needsUpdate = true;
        }

        /* ---------- Boucle de rendu ---------- */
        render() {
            if (this.disposed) return;
            const dt = Math.min(this.clock.getDelta(), 0.05);
            const t = this.clock.elapsedTime;
            const s = this.state;

            this.pointerSmooth.x += (this.pointer.x - this.pointerSmooth.x) * 0.055;
            this.pointerSmooth.y += (this.pointer.y - this.pointerSmooth.y) * 0.055;

            /* Photo */
            const photoDist = Math.max(0.5, this.camera.position.z - s.photoZ);
            const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5) * photoDist;
            const halfW = halfH * this.camera.aspect;

            this.photoGroup.position.x = s.photoX * halfW + this.pointerSmooth.x * 0.22;
            this.photoGroup.position.y = s.photoY * halfH + this.pointerSmooth.y * 0.14;
            this.photoGroup.position.z = s.photoZ;
            this.photoGroup.rotation.x = s.photoRotX + this.pointerSmooth.y * 0.1;
            this.photoGroup.rotation.y = s.photoRotY + this.pointerSmooth.x * 0.14;
            this.photoGroup.rotation.z = s.photoRotZ;
            this.photoGroup.scale.setScalar(s.photoScale * this.intro.scale);

            this.photoMat.uniforms.uTime.value = t;
            this.photoMat.uniforms.uOpacity.value = s.photoOpacity * this.intro.opacity;
            this.photoMat.uniforms.uAmp.value = s.amp;
            this.photoMat.uniforms.uAberration.value = s.aberration;
            this.photoMat.uniforms.uGlitch.value = s.glitch;

            this.frame.material.opacity = 0.55 * s.photoOpacity * this.intro.opacity;
            this.frame.rotation.z = Math.sin(t * 0.35) * 0.012;

            this.echoes.forEach((e, i) => {
                e.material.opacity = (0.2 / (i + 1)) * s.echoOpacity * s.photoOpacity * this.intro.opacity;
                e.position.z = -0.35 * (i + 1) * s.echoSpread;
                e.position.x = -0.05 * (i + 1) * s.echoSpread;
                e.position.y = -0.04 * (i + 1) * s.echoSpread;
            });

            this.halo.material.opacity = 0.22 * s.haloOpacity * s.photoOpacity * this.intro.opacity;
            this.halo.scale.setScalar(s.haloScale);
            this.core.material.opacity = 0.14 * s.haloOpacity;
            this.core.scale.setScalar(s.haloScale * (1 + Math.sin(t * 0.9) * 0.045));

            /* Cerveau */
            if (this.constellation) {
                this.constMat.uniforms.uTime.value = t;
                this.constMat.uniforms.uOpacity.value = s.constOpacity;
                this.links.material.opacity = s.constOpacity;
                this.constellation.rotation.y = Math.sin(t * 0.1) * 0.13 + this.pointerSmooth.x * 0.1;
                this.constellation.rotation.x = Math.sin(t * 0.08) * 0.05 + this.pointerSmooth.y * 0.05;

                const brainDist = Math.max(0.5, this.camera.position.z - s.constZ);
                const bHalfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5) * brainDist;
                const bHalfW = bHalfH * this.camera.aspect;
                this.constellation.position.x = s.constX * bHalfW;
                this.constellation.position.y = s.constY * bHalfH;
                this.constellation.position.z = s.constZ;
                this._updateConstellation();
            }

            /* Axones */
            this._updateNeurons(t);

            /* Poussière */
            this.dustMat.uniforms.uTime.value = t;
            this.dustMat.uniforms.uOpacity.value = s.dustOpacity;
            this.dust.position.x = -this.pointerSmooth.x * 0.7 * this.dustScale;
            this.dust.position.y = -this.pointerSmooth.y * 0.5 * this.dustScale;

            /* Glitch : impulsion sur scroll rapide, puis décroissance */
            s.glitch += (this.glitchTarget - s.glitch) * 0.25;
            this.glitchTarget *= 0.86;

            /* Caméra */
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
