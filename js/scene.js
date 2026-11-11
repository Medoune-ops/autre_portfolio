/* =========================================================================
   scene.js — Scène Three.js : volume de photo 3D + constellation neurale
   Expose : window.Scene3D.create(canvas) -> instance
   L'instance expose .state, un objet de valeurs numériques animées par
   GSAP (choreography.js) et appliquées à chaque frame.
   ========================================================================= */
(function () {
    'use strict';

    const IS_TOUCH = window.matchMedia('(hover: none)').matches;
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Shader GLSL ---------- */

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

            // Traces de glitch lors des scroll rapides
            float g = step(0.985 - uGlitch * 0.12, hash21(vec2(floor(uv.y * 42.0), floor(uTime * 22.0))));
            uv.x += g * uGlitch * 0.035 * (hash21(vec2(floor(uv.y * 42.0), 3.0)) - 0.5);

            vec2 dir = uv - 0.5;
            float d2 = dot(dir, dir);
            float ab = uAberration * (0.25 + d2 * 3.0);

            float r = texture2D(uTexture, uv + dir * ab).r;
            float gch = texture2D(uTexture, uv).g;
            float b = texture2D(uTexture, uv - dir * ab).b;
            vec3 col = vec3(r, gch, b);

            // Reflet spéculaire glissant sur le volume
            float sheen = smoothstep(0.55, 1.0, sin((uv.x * 1.4 + uv.y * 0.8 - uTime * 0.18) * 3.14159) * 0.5 + 0.5);
            col += sheen * 0.16 * vec3(0.55, 0.78, 1.0);

            // Liseré lumineux sur les bords
            float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
            float rim = 1.0 - smoothstep(0.0, 0.028, edge);
            col = mix(col, uAccent, rim * 0.55);

            // Ombrage des bords
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
            pos.z += sin(uTime * 0.75 + aSeed * 24.0) * 0.11;
            pos.x += cos(uTime * 0.45 + aSeed * 11.0) * 0.07;
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
            // Noyau net + halo doux : évite les taches floues
            float core = smoothstep(0.5, 0.06, d);
            float a = pow(core, 1.7) * 0.9 + core * 0.1;
            float tw = 0.6 + 0.4 * sin(uTime * 1.7 + vSeed * 31.4);
            gl_FragColor = vec4(uColor, a * uOpacity * (0.55 + 0.45 * tw));
        }
    `;

    /* ---------- Fabrique de textures ---------- */

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
        ctx.fillStyle = 'rgba(120,200,255,.5)';
        ctx.font = '600 26px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEDOUNE SECK', 256, 340);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /* ---------- Géométries de la constellation ---------- */

    function shapeSphere(count) {
        const arr = new Float32Array(count * 3);
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2;
            const radius = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = golden * i;
            const r = 2.55 + (Math.random() - 0.5) * 0.55;
            arr[i * 3 + 0] = Math.cos(theta) * radius * r;
            arr[i * 3 + 1] = y * r * 0.82;
            arr[i * 3 + 2] = Math.sin(theta) * radius * r * 0.55;
        }
        return arr;
    }

    function shapeRing(count) {
        const arr = new Float32Array(count * 3);
        const major = 3.15;
        const tube = 0.42;
        for (let i = 0; i < count; i++) {
            const u = (i / count) * Math.PI * 2 * 7;
            const v = (i % 13) / 13 * Math.PI * 2;
            const cx = Math.cos(u) * major;
            const cy = Math.sin(u) * major * 0.62;
            arr[i * 3 + 0] = cx + Math.cos(v) * tube;
            arr[i * 3 + 1] = cy + Math.sin(v) * tube * 0.7;
            arr[i * 3 + 2] = Math.sin(u) * major * 0.34 + Math.cos(v) * tube;
        }
        return arr;
    }

    function shapeSpiral(count) {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const angle = t * Math.PI * 2 * 11;
            const radius = 0.35 + t * 2.6;
            arr[i * 3 + 0] = Math.cos(angle) * radius * 0.78;
            arr[i * 3 + 1] = (t - 0.5) * 5.6;
            arr[i * 3 + 2] = Math.sin(angle) * radius * 0.6 - 1.2;
        }
        return arr;
    }

    /* ---------- Scène ---------- */

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

            /* --- État animé (piloté par GSAP) ---
               photoX / photoY sont NORMALISÉS : 0 = centre de l'écran,
               ±1 = bord de l'écran. Le placement reste donc identique
               sur mobile, tablette et desktop. */
            this.state = {
                photoX: 0.56, photoY: 0.0, photoZ: 0,
                photoRotX: 0, photoRotY: -0.16, photoRotZ: 0,
                photoScale: 1, photoOpacity: 1,
                echoOpacity: 0.34, echoSpread: 1,
                constOpacity: 0.85, constSpread: 1,
                constX: 0.36, constY: 0, constZ: -1.5,
                morphA: 0, morphB: 0,
                dustOpacity: 0.4, haloOpacity: 0.9, haloScale: 1,
                camX: 0, camY: 0, camZ: 8,
                amp: 0.16, aberration: 0.006, glitch: 0
            };

            this._initRenderer();
            this._initScene();
            this._initPhoto();
            this._initConstellation();
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
                mesh.position.x = -0.05 * i;
                mesh.position.y = -0.04 * i;
                this.photoGroup.add(mesh);
                this.echoes.push(mesh);
            }

            /* Contour lumineux (wireframe) */
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

        /* ---------- Constellation ---------- */
        _initConstellation() {
            this._buildConstellation();
        }

        _buildConstellation() {
            // Nettoyage de l'ancienne constellation
            if (this.constellation) {
                this.root.remove(this.constellation);
                this.constellation.geometry.dispose();
                this.constMat.dispose();
                this.root.remove(this.links);
                this.links.geometry.dispose();
                this.links.material.dispose();
            }

            const count = this.isMobile ? 340 : 720;

            this.shapeA = shapeSphere(count);
            this.shapeB = shapeRing(count);
            this.shapeC = shapeSpiral(count);

            const positions = new Float32Array(this.shapeA);
            const sizes = new Float32Array(count);
            const seeds = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                // Sur fond clair les points doivent rester de fins nœuds :
                // c'est le réseau de lignes qui porte la forme.
                sizes[i] = 0.06 + Math.random() * 0.17;
                seeds[i] = Math.random();
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

            /* Liaisons : topologie figée sur la forme A, les points se déplacent */
            const links = this._buildLinks(count, 3);
            const linkCount = links.length / 2;
            const linkPos = new Float32Array(linkCount * 6);
            const linkCol = new Float32Array(linkCount * 6);
            const c = new THREE.Color();

            for (let l = 0; l < linkCount; l++) {
                const a = links[l * 2], b = links[l * 2 + 1];
                const alpha = 0.1 + Math.random() * 0.14;
                c.setHSL(0.56 + Math.random() * 0.06, 0.28, 0.42);
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
            this.root.add(this.links);
            this.linkIndices = links;
            this._built = true;
        }

        _buildLinks(count, perNode) {
            const links = [];
            const threshold = 1.05;
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
            const wasMobile = this.isMobile;
            this.isMobile = w < 860;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h, false);
            this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
            this.renderer.setPixelRatio(this.pixelRatio);
            this.constMat.uniforms.uPixelRatio.value = this.pixelRatio;
            this.dustMat.uniforms.uPixelRatio.value = this.pixelRatio;

            // La constellation s'adapte au format : elle respire sur desktop,
            // s'intègre dans l'étroit sur mobile. Facteur volontairement
            // faible — le réseau doit rester un fond, pas un sujet.
            const aspect = w / h;
            this.constScale = Math.min(0.62, Math.max(0.4, aspect / 2.5));
            this.dustScale = Math.min(0.9, Math.max(0.5, aspect / 1.9));

            // Changement de format : la densité de particules doit suivre
            if (wasMobile !== this.isMobile) {
                this._buildConstellation();
            }
        }

        /* ---------- Mise à jour des positions de la constellation ---------- */
        _updateConstellation() {
            const s = this.state;
            const pos = this.constellation.geometry.attributes.position.array;
            const A = this.shapeA, B = this.shapeB, C = this.shapeC;
            const mA = s.morphA, mB = s.morphB;
            const spread = s.constSpread * this.constScale;

            for (let i = 0; i < pos.length; i += 3) {
                // A -> B (mA), puis (A->B) -> C (mB)
                const abx = A[i] + (B[i] - A[i]) * mA;
                const aby = A[i + 1] + (B[i + 1] - A[i + 1]) * mA;
                const abz = A[i + 2] + (B[i + 2] - A[i + 2]) * mA;
                pos[i]     = (abx + (C[i] - abx) * mB) * spread;
                pos[i + 1] = (aby + (C[i + 1] - aby) * mB) * spread;
                pos[i + 2] = (abz + (C[i + 2] - abz) * mB) * spread;
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

            /* Photo — position normalisée : photoX/photoY valent -1..1 */
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

            /* Constellation — décalée à droite pour ne pas concurrencer le texte */
            this.constMat.uniforms.uTime.value = t;
            this.constMat.uniforms.uOpacity.value = s.constOpacity;
            this.links.material.opacity = s.constOpacity;
            this.constellation.rotation.y = t * 0.035 + this.pointerSmooth.x * 0.08;
            this.constellation.rotation.x = this.pointerSmooth.y * 0.05;
            this.constellation.position.x = s.constX * halfW;
            this.constellation.position.y = s.constY * halfH;
            this.constellation.position.z = s.constZ;
            this._updateConstellation();

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
            this.renderer.dispose();
        }
    }

    window.Scene3D = {
        create(canvas) { return new PortfolioScene(canvas); },
        REDUCED: REDUCED
    };
})();
