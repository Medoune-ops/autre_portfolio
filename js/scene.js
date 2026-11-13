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

    /* --- Routage PCB des axones --- */
    const AXON_SEG = 26;             // points de chemin par axone (2 sommets chacun)
    const AXON_MAX_NODES = 8;        // sommets max d'une route
    const AXON_MAX_CORNERS = 4;      // coudes max par axone (donc vias max)
    const TRACE_HALF_W = 1.9;         // demi-largeur du trait, en pixels CSS
    const VIA_SIZE = 13;              // diametre d'un via, en pixels CSS

    /* =====================================================================
       SHADERS
       ===================================================================== */

    const POINT_VERT = `
        attribute float aSize;
        attribute float aSeed;
        attribute float aHeat;
        attribute float aGyri;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uGlitch;
        varying float vSeed;
        varying float vHeat;
        varying float vGyri;
        void main(){
            vSeed = aSeed;
            vHeat = aHeat;
            vGyri = aGyri;
            vec3 pos = position;

            // Respiration tres legere de la surface
            float breathe = sin(uTime * 0.8 + aSeed * 6.2831) * 0.006;
            pos += normalize(pos + 0.0001) * breathe;

            // Glitch : decalage par bandes quand on scroll vite
            float band = floor(pos.y * 26.0 + uTime * 9.0);
            float g = step(0.86, fract(sin(band * 12.9898) * 43758.5453));
            pos.x += g * uGlitch * 0.055 * (fract(sin(band * 78.233) * 43758.5453) - 0.5);
            pos.z += g * uGlitch * 0.03;

            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * uPixelRatio * (150.0 / max(-mv.z, 0.001)) * (0.75 + aHeat * 0.75);
            gl_Position = projectionMatrix * mv;
        }
    `;

    const POINT_FRAG = `
        uniform vec3 uCold;
        uniform vec3 uHot;
        uniform float uOpacity;
        uniform float uTime;
        varying float vSeed;
        varying float vHeat;
        varying float vGyri;
        void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if(d > 0.5) discard;

            float core = smoothstep(0.5, 0.30, d);
            float a = pow(core, 0.55);

            // La lumiere court dans les sillons entre les plis :
            // gyri bas = creux = sillon incandescent.
            float seam = smoothstep(0.44, 0.14, vGyri);

            // Coeur incandescent + sillons
            float heat = max(pow(vHeat, 2.6), seam * 0.92);
            vec3 col = mix(uCold, uHot, heat);

            float tw = 0.74 + 0.26 * sin(uTime * 1.6 + vSeed * 31.4);
            gl_FragColor = vec4(col, a * uOpacity * tw * (0.6 + heat * 0.4));
        }
    `;

    /* --- Axone : trace de circuit imprime qui pousse du cerveau vers
           une cible. La largeur du ruban est deja cuite dans la geometrie
           (elle est calculee EN ESPACE ECRAN), le shader ne fait plus que
           l'eclairage. --- */

    const AXON_VERT = `
        attribute float aT;
        attribute float aSeed;
        attribute float aSide;
        varying float vT;
        varying float vSeed;
        varying float vSide;
        void main(){
            vT = aT;
            vSeed = aSeed;
            vSide = aSide;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

            // Section du ruban : bords adoucis, coeur lumineux
            float edge = 1.0 - abs(vSide);
            float body = smoothstep(0.0, 0.60, edge);
            float core = smoothstep(0.52, 1.0, edge);

            // Tete du trace : la pointe lumineuse qui pousse.
            // Elle est marquee par un noyau blanc tres court, suivi d'une
            // traine qui s'eteint : on lit ou en est le fil.
            float spark = smoothstep(uProgress - 0.018, uProgress, vT);
            float head = smoothstep(uProgress - 0.085, uProgress, vT);

            // Signal qui circule le long de la trace
            float travel = fract(uTime * 0.22 + vSeed);
            float band = exp(-pow((vT - travel) * 8.0, 2.0)) * step(travel, uProgress);

            float alpha = (0.72 + core * 0.28 + head * 0.40 + band * 0.24) * body;
            vec3 col = mix(uColor, uHot, clamp(head * 0.9 + band * 0.5 + core * 0.34, 0.0, 1.0));
            // Noyau blanc a la pointe : c'est ce qui rend la tete nette
            col = mix(col, vec3(1.0, 0.94, 0.86), spark * 0.85);
            col += uHot * spark * 0.45;
            gl_FragColor = vec4(col, clamp(alpha + spark * 0.35, 0.0, 1.0) * uOpacity);
        }
    `;

    /* --- Via : petit cercle creux pose sur les coudes du routage.
           Tous les vias de la scene tiennent dans UN SEUL objet Points
           (un seul draw call). --- */

    const VIA_VERT = `
        attribute float aT;
        attribute float aProg;
        attribute float aSeed;
        uniform float uPixelRatio;
        uniform float uSize;
        varying float vOn;
        varying float vSeed;
        void main(){
            vSeed = aSeed;
            // Le via n'apparait que lorsque la tete du fil l'a atteint
            vOn = smoothstep(aT - 0.05, aT + 0.01, aProg);
            gl_PointSize = uSize * uPixelRatio;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const VIA_FRAG = `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3  uColor;
        uniform vec3  uHot;
        varying float vOn;
        varying float vSeed;
        void main(){
            if (vOn <= 0.003) discard;
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c) * 2.0;
            if (d > 1.0) discard;

            // Anneau creux : le centre est perce, ce n'est pas un point plein
            float ring = smoothstep(0.40, 0.56, d) * (1.0 - smoothstep(0.82, 0.98, d));

            // Le via s'allume quand la tete du fil vient de le passer
            float fresh = smoothstep(0.0, 0.35, vOn) * (1.0 - smoothstep(0.35, 1.0, vOn));

            float pulse = 0.80 + 0.20 * sin(uTime * 2.2 + vSeed * 6.2831);
            float a = ring * vOn * pulse * 1.15;
            vec3 col = mix(uColor, uHot, ring * 0.95);
            col = mix(col, vec3(1.0, 0.92, 0.82), fresh * 0.6);
            gl_FragColor = vec4(col, clamp(a + fresh * 0.25, 0.0, 1.0) * uOpacity);
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

    /* Bruit « en cretes » : donne des circonvolutions, pas des bosses */
    function fbmRidged(x, y, z, oct) {
        let v = 0, a = 0.5, f = 1;
        for (let i = 0; i < (oct || 3); i++) {
            const n = vnoise3(x * f, y * f, z * f);
            v += a * (1 - Math.abs(2 * n - 1));
            f *= 2.07; a *= 0.5;
        }
        return v;
    }

    /* Circonvolutions sinueuses, style corail / cerveau.
       Le bruit simple donne des bosses. C'est le DOMAIN WARPING (deformation
       du domaine par un premier bruit) qui transforme les bosses en plis
       qui serpettent, comme sur les references. */
    function gyriNoise(x, y, z) {
        const w1 = fbm3(x * 1.7, y * 1.7, z * 1.7, 2);
        const w2 = fbm3(x * 1.7 + 4.7, y * 1.7 - 2.3, z * 1.7 + 1.9, 2);
        const wx = x + w1 * 1.15;
        const wy = y + w2 * 1.15;
        const wz = z + (w1 - w2) * 0.85;
        return fbmRidged(wx * 3.3, wy * 3.3, wz * 3.3, 2);
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

    function smoothstep(a, b, x) {
        const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
    }

    /* Signed distance field du cerveau — anatomique
       Repere : x = lateral, y = haut, z = avant (la camera regarde vers -z)

       Point cle : la masse cerebrale est UN SEUL volume oblong, plus long
       d'avant en arriere, aminci aux deux poles. Les deux hemispheres ne
       sont pas deux ellipsoides separes (cela laissait un vide central et
       donnait l'aspect de deux boules) : ils sont unis, et c'est la
       fissure longitudinale qui les separe par un sillon etroit. */
    function brainSDF(x, y, z) {
        const ax = Math.abs(x);

        const sFront = smoothstep(0.10, 0.92, z);   // 0 arriere, 1 avant
        const sBack  = smoothstep(-0.20, -0.88, z);  // 1 a l'arriere

        /* --- Cervelet, cale sous l'occipital --- */
        const cb = sdEllipsoid(x, y + 0.38, z + 0.56, 0.34, 0.21, 0.23);

        /* --- Tronc cerebral --- */
        const bs = sdEllipsoid(x, y + 0.58, z + 0.08, 0.095, 0.28, 0.09);

        /* --- Masse cerebrale : un seul volume oblong --- */
        const taperF = 1 - 0.30 * sFront;
        const taperB = 1 - 0.24 * sBack;
        const rx = 0.60 * taperF * taperB;
        const ry = 0.46 * (1 - 0.17 * sFront);
        const rz = 0.78;
        const drop = -0.19 * sFront - 0.07 * sBack;   // le pole frontal s'abaisse
        const main = sdEllipsoid(x, y - 0.05 - drop, z, rx, ry, rz);

        /* --- Lobe temporal : lobe distinct, suspendu sous la partie avant.
               Il existe des deux cotes (d'ou |x|). --- */
        const temporal = sdEllipsoid(ax - 0.34, y + 0.24, z - 0.16, 0.28, 0.20, 0.42);

        let cerebrum = smin(main, temporal, 0.11);

        let d = smin(cerebrum, cb, 0.13);
        d = smin(d, bs, 0.10);

        /* --- Fissure longitudinale : un sillon etroit, legerement sinueux --- */
        const wobble = 0.018 * Math.sin(z * 3.2 + 1.2);
        const fx = Math.abs(x - wobble) - 0.05;
        const fz = Math.max(-0.74 - z, z - 0.86);
        const fy = -0.30 - y;
        d = Math.max(d, -Math.max(fx, Math.max(fz, fy)));

        /* --- Sillon de Sylvius : separe le lobe temporal du reste --- */
        const plane = y - (-0.10 + 0.32 * z);
        const gx = Math.max(0.26 - ax, ax - 1.3);
        const gz = Math.max(-0.44 - z, z - 0.46);
        const syl = Math.max(Math.abs(plane) - 0.04, Math.max(gx, gz));
        d = Math.max(d, -syl);

        return d;
    }

    /* Echantillonnage de la surface.
       On part d'un point ALEATOIRE A L'INTERIEUR du cerveau et on le
       projette sur la surface par iterations de Newton (projection le long
       de la normale du SDF). Bien plus rapide que du rejet, et la surface
       est couverte uniformement.
       Retourne aussi la "chaleur" de chaque point (0 au bord, 1 au coeur). */
    function buildBrainSurface(count) {
        const rnd = mulberry32(20261112);
        const pts = [];
        const heat = [];
        const gyri = [];

        const BX = 1.2, BY_MIN = -1.2, BY_MAX = 0.85, BZ = 0.95;
        const e = 0.006;

        let guard = 0;
        const maxGuard = count * 40;

        while (pts.length < count * 3 && guard < maxGuard) {
            guard++;
            const x = (rnd() * 2 - 1) * BX;
            const y = BY_MIN + rnd() * (BY_MAX - BY_MIN);
            const z = (rnd() * 2 - 1) * BZ;

            // Le point de depart doit etre a l'interieur
            if (brainSDF(x, y, z) > 0) continue;

            // Newton : projection sur l'isosurface
            let px = x, py = y, pz = z;
            for (let k = 0; k < 6; k++) {
                const d = brainSDF(px, py, pz);
                if (Math.abs(d) < 0.003) break;
                const gx = brainSDF(px + e, py, pz) - brainSDF(px - e, py, pz);
                const gy = brainSDF(px, py + e, pz) - brainSDF(px, py - e, pz);
                const gz = brainSDF(px, py, pz + e) - brainSDF(px, py, pz - e);
                const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
                const s = d * 0.9;
                px -= s * gx / gl;
                py -= s * gy / gl;
                pz -= s * gz / gl;
            }

            // Normale finale
            const gx = brainSDF(px + e, py, pz) - brainSDF(px - e, py, pz);
            const gy = brainSDF(px, py + e, pz) - brainSDF(px, py - e, pz);
            const gz = brainSDF(px, py, pz + e) - brainSDF(px, py, pz - e);
            const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
            const nx = gx / gl, ny = gy / gl, nz = gz / gl;

            // Cervelet : fines stries (folia). Cerveau : plis sinueux.
            const isCerebellum = py < -0.26 && pz < -0.28;
            let n, amp;
            if (isCerebellum) {
                n = Math.sin(py * 58 + pz * 11) * 0.5 + 0.5;
                amp = 0.014;
            } else {
                n = gyriNoise(px, py, pz);
                amp = 0.075;
            }
            px += nx * (n - 0.5) * amp * 2;
            py += ny * (n - 0.5) * amp * 2;
            pz += nz * (n - 0.5) * amp * 2;

            pts.push(px, py, pz);
            gyri.push(n);

            // Chaleur : distance au coeur du cerveau
            const dx = px, dy = py + 0.05, dz = pz - 0.16;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            heat.push(clamp01(1 - (dist - 0.28) / 0.58));
        }

        // Melange (points et chaleur ensemble)
        const n3 = pts.length / 3;
        for (let i = n3 - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            for (let k = 0; k < 3; k++) {
                const tmp = pts[i * 3 + k];
                pts[i * 3 + k] = pts[j * 3 + k];
                pts[j * 3 + k] = tmp;
            }
            const th = heat[i]; heat[i] = heat[j]; heat[j] = th;
            const tg = gyri[i]; gyri[i] = gyri[j]; gyri[j] = tg;
        }

        return {
            positions: new Float32Array(pts.slice(0, count * 3)),
            heat: new Float32Array(heat.slice(0, count)),
            gyri: new Float32Array(gyri.slice(0, count))
        };
    }

    function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

    /* Voisinage : grille spatiale (le cerveau a des dizaines de milliers
       de points, un balayage O(n^2) serait interminable). */
    function buildLinks(points, count, perNode, threshold, subset) {
        const cell = threshold;
        const grid = new Map();
        const key = (a, b, c) => a + '|' + b + '|' + c;

        const nodes = subset || null;
        const list = nodes || null;
        void list;
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

        // Masque : quels points sont concernes par le maillage
        let mask = null;
        if (subset) {
            mask = new Uint8Array(count);
            for (let i = 0; i < subset.length; i++) mask[subset[i]] = 1;
        }

        for (let a = 0; a < count; a++) {
            if (mask && !mask[a]) continue;

            const xi = points[a * 3], yi = points[a * 3 + 1], zi = points[a * 3 + 2];
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
                            if (j === a) continue;
                            const ddx = points[j * 3] - xi;
                            const ddy = points[j * 3 + 1] - yi;
                            const ddz = points[j * 3 + 2] - zi;
                            const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
                            if (d2 < threshold * threshold) found.push([d2, j]);
                        }
                    }
                }
            }

            if (found.length > 1) found.sort((p, q) => p[0] - q[0]);
            const take = Math.min(perNode, found.length);
            for (let k = 0; k < take; k++) links.push(a, found[k][1]);
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

            /* --- Tampons de travail (aucune allocation par frame) --- */
            this._vp = new THREE.Matrix4();     // view-projection
            this._w = new Float32Array(2);      // point monde temporaire
            this._p2 = new Float32Array(2);     // point ecran temporaire
            this._p3 = new Float32Array(4);     // point ecran + tangente
            this._v3 = new THREE.Vector3();     // point monde temporaire

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
            const count = this.isMobile ? 14000 : 42000;

            const brain = buildBrainSurface(count);
            this.brainSurface = brain.positions;
            this.shapeA = brain.positions;
            this.shapeB = this._buildDissolve(count);

            const n = this.brainSurface.length / 3;
            const positions = new Float32Array(this.brainSurface);
            const sizes = new Float32Array(n);
            const seeds = new Float32Array(n);
            const heats = new Float32Array(n);
            const gyris = new Float32Array(n);
            const rnd = mulberry32(77123);
            for (let i = 0; i < n; i++) {
                // Taille tres homogene : la silhouette doit etre nette,
                // pas poussiereuse.
                sizes[i] = 0.058 + rnd() * 0.06;
                seeds[i] = rnd();
                heats[i] = brain.heat[i] || 0;
                gyris[i] = brain.gyri[i] !== undefined ? brain.gyri[i] : 0.5;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
            geo.setAttribute('aHeat', new THREE.BufferAttribute(heats, 1));
            geo.setAttribute('aGyri', new THREE.BufferAttribute(gyris, 1));

            this.constMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:        { value: 0 },
                    uOpacity:     { value: 0.95 },
                    uPixelRatio:  { value: this.pixelRatio },
                    uGlitch:      { value: 0 },
                    uCold:        { value: new THREE.Color(0x3f5568) },
                    uHot:         { value: new THREE.Color(0xf07c2c) }
                },
                vertexShader: POINT_VERT,
                fragmentShader: POINT_FRAG,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            this.constellation = new THREE.Points(geo, this.constMat);
            this.root.add(this.constellation);

            /* Reseau : un voile de liaisons entre voisins proches.
               On ne lie qu'un sous-ensemble de points : avec 26 000 points,
               la densite fait deja la forme, le maillage ne doit qu'accentuer.
               Il doit rester tres discret, sinon on lit un fil de fer
               plutot qu'un cerveau. */
            const stride = Math.max(1, Math.round(n / 4500));
            const subset = [];
            for (let i = 0; i < n; i += stride) subset.push(i);
            const links = buildLinks(this.brainSurface, n, 2, 0.11, subset);

            const linkCount = links.length / 2;
            // Couleur en RVBA : Three.js n'utilise l'alpha d'une couleur de
            // sommet que si l'attribut est en 4 composantes. Sinon l'alpha
            // encode dans le RGB rend les lignes noires et opaques.
            const linkPos = new Float32Array(linkCount * 6);
            const linkCol = new Float32Array(linkCount * 8);
            const c = new THREE.Color();
            const rnd2 = mulberry32(4242);

            for (let l = 0; l < linkCount; l++) {
                const alpha = 0.1 + rnd2() * 0.13;
                c.setHSL(0.55 + rnd2() * 0.05, 0.34, 0.42);
                linkCol[l * 8 + 0] = c.r;
                linkCol[l * 8 + 1] = c.g;
                linkCol[l * 8 + 2] = c.b;
                linkCol[l * 8 + 3] = alpha;
                linkCol[l * 8 + 4] = c.r;
                linkCol[l * 8 + 5] = c.g;
                linkCol[l * 8 + 6] = c.b;
                linkCol[l * 8 + 7] = alpha * 0.55;
            }

            const linkGeo = new THREE.BufferGeometry();
            linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
            linkGeo.setAttribute('color', new THREE.BufferAttribute(linkCol, 4));

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
            geo.setAttribute('aHeat', new THREE.BufferAttribute(new Float32Array(count), 1));
            geo.setAttribute('aGyri', new THREE.BufferAttribute(new Float32Array(count).fill(0.5), 1));

            this.dustMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:       { value: 0 },
                    uOpacity:    { value: 0.35 },
                    uPixelRatio: { value: this.pixelRatio },
                    uGlitch:     { value: 0 },
                    uCold:       { value: new THREE.Color(0xb9bfc7) },
                    uHot:        { value: new THREE.Color(0xffb27a) }
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
           AXONES — TRACES DE CIRCUIT IMPRIME (ROUTAGE PCB)
           Le chemin est calcule EN ESPACE ECRAN (pixels) : c'est la seule
           facon d'obtenir des angles a 45 deg nets a l'ecran, quelle que
           soit la position de la camera. La conversion ecran -> monde se
           fait par projection homographique inverse sur le plan z = constZ :
           comme la projection est une homographie (elle conserve les
           droites), la polyligne monde se reprojette exactement sur la
           polyligne ecran dessinee. Les coudes portent un via (cercle
           creux) ; tous les vias tiennent dans un seul objet Points.
           ===================================================================== */

        registerNeuronTargets(elements) {
            if (!elements || !elements.length) return;
            if (!this.constellation) return;

            const SEG = AXON_SEG;
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

            /* ---------- VIAS : UN SEUL objet Points pour toute la scene ---------- */
            const maxVias = elements.length * 3 * AXON_MAX_CORNERS;
            const viaGeo = new THREE.BufferGeometry();
            const viaPos = new Float32Array(maxVias * 3);
            const viaT = new Float32Array(maxVias);
            const viaProg = new Float32Array(maxVias);
            const viaSeed = new Float32Array(maxVias);
            for (let i = 0; i < maxVias; i++) viaSeed[i] = rnd();
            viaGeo.setAttribute('position', new THREE.BufferAttribute(viaPos, 3).setUsage(THREE.DynamicDrawUsage));
            viaGeo.setAttribute('aT', new THREE.BufferAttribute(viaT, 1).setUsage(THREE.DynamicDrawUsage));
            viaGeo.setAttribute('aProg', new THREE.BufferAttribute(viaProg, 1).setUsage(THREE.DynamicDrawUsage));
            viaGeo.setAttribute('aSeed', new THREE.BufferAttribute(viaSeed, 1));
            viaGeo.setDrawRange(0, 0);

            const viaMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:       { value: 0 },
                    uOpacity:    { value: 1 },
                    uSize:       { value: VIA_SIZE },
                    uPixelRatio: { value: this.pixelRatio },
                    uColor:      { value: new THREE.Color(0x9c3c0a) },
                    uHot:        { value: new THREE.Color(0xffa25c) }
                },
                vertexShader: VIA_VERT,
                fragmentShader: VIA_FRAG,
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.NormalBlending
            });

            this.viaGeo = viaGeo;
            this.viaMat = viaMat;
            this.vias = new THREE.Points(viaGeo, viaMat);
            this.vias.frustumCulled = false;
            this.vias.renderOrder = 3;
            this.root.add(this.vias);

            this._elems = elements;
            /* Cache des cibles : les 3 axones d'un meme element partagent
               la meme cible. On ne la calcule donc qu'une fois par element
               et par frame (getBoundingClientRect force un reflow : c'est
               le poste le plus cher du frame). */
            this._tgtX = new Float32Array(elements.length);
            this._tgtY = new Float32Array(elements.length);
            this._tgtTX = new Float32Array(elements.length);
            this._tgtTY = new Float32Array(elements.length);
            this._tgtStamp = new Int32Array(elements.length).fill(-1);
            this._frameId = 0;

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
                            uColor:    { value: new THREE.Color(0x8f3206) },
                            uHot:      { value: new THREE.Color(0xff5c0d) }
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
                    line.renderOrder = 2;
                    this.root.add(line);

                    const tip = new THREE.Sprite(new THREE.SpriteMaterial({
                        map: this.axonGlow,
                        color: 0xff7a2e,
                        transparent: true,
                        opacity: 0,
                        depthWrite: false,
                        depthTest: false
                    }));
                    tip.scale.setScalar(0.22);
                    tip.renderOrder = 4;
                    this.root.add(tip);

                    /* --- Donnees de routage PCB (fixees une fois pour toutes,
                           pour que le trace ne tremble pas d'une frame a l'autre) --- */
                    /* schema 0 = « etage » (3 coudes), schema 1 = « croise »
                       (2 coudes). Le choix definitif depend de la
                       geometrie de la cible, voir _routePCB. */
                    const schema = rnd() < 0.34 ? 1 : 0;

                    this.neurons.push({
                        el, line, geo, path,
                        tip, mat,
                        state: { progress: 0 },
                        start: starts[(ei * bundle + k) % starts.length].clone(),
                        jitter: (rnd() - 0.5) * 0.3,
                        /* Ancre dans le DOM (mise en cache : pas de
                           querySelector par frame) */
                        anchor: el.querySelector('h3, h4, strong, .mono, .service-card__icon, .project__idx') || el,
                        /* Index de l'element dans la liste : les 3 axones
                           d'un meme element partagent la meme cible, on ne
                           la calcule donc qu'une fois par frame. */
                        elIdx: ei,
                        /* Decalage le long du bord : les 3 axones d'un
                           bloc arrivent sur 3 points distincts du bord
                           (comme des pastilles de connecteur). */
                        spread: (k - 1) * 22,
                        /* --- Routage --- */
                        schema: schema,
                        frac: new Float32Array([0.30 + rnd() * 0.40, 0.30 + rnd() * 0.60]),
                        axisPref: rnd() < 0.5 ? 0 : 1,
                        rx: new Float32Array(AXON_MAX_NODES),
                        ry: new Float32Array(AXON_MAX_NODES),
                        cum: new Float32Array(AXON_MAX_NODES + 1),
                        m: new Float32Array(AXON_MAX_NODES),
                        nSeg: 0,
                        total: 1,
                        sx: 0, sy: 0, tx: 0, ty: 0
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

        /* Point de contact ECRAN (pixels CSS) : l'axone vise un point precis
           de l'info (son titre) puis se poursuit jusqu'au bord de son
           conteneur, le long du rayon cerveau -> titre.
           Ecrit dans `out` : [px, py, tx, ty] ou (tx, ty) est la tangente
           du bord atteint (pour pouvoir decaler le point d'arrivee le long
           du bord, sans re-mesurer le DOM). */
        _targetScreenBase(el, anchorEl, out) {
            const vw = window.innerWidth, vh = window.innerHeight;

            const bx = (this.state.constX + 1) * 0.5 * vw;
            const by = (1 - this.state.constY) * 0.5 * vh;

            const a = anchorEl.getBoundingClientRect();
            const c = el.getBoundingClientRect();

            const ax = a.left + a.width * 0.5;
            const ay = a.top + a.height * 0.5;

            let dx = ax - bx, dy = ay - by;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            dx /= len; dy /= len;

            let px = ax, py = ay;
            let onVertical = false;
            if (Math.abs(dx) > 1e-5) {
                const tx = dx > 0 ? (c.right - ax) / dx : (c.left - ax) / dx;
                const ty = Math.abs(dy) > 1e-5 ? (dy > 0 ? (c.bottom - ay) / dy : (c.top - ay) / dy) : Infinity;
                if (tx <= ty) {
                    const tt = Math.max(0, tx);
                    px = ax + dx * tt; py = ay + dy * tt;
                    onVertical = true;
                } else {
                    const tt = Math.max(0, ty);
                    px = ax + dx * tt; py = ay + dy * tt;
                }
            }

            out[0] = px;
            out[1] = py;
            /* Tangente du bord atteint : verticale sur un bord vertical,
               horizontale sur un bord horizontal. */
            out[2] = onVertical ? 0 : 1;
            out[3] = onVertical ? 1 : 0;
            return out;
        }

        /* Variante avec decalage le long du bord (point d'arrivee). */
        _targetScreenPos(el, anchorEl, out, spread) {
            this._targetScreenBase(el, anchorEl, this._p3);
            out[0] = this._p3[0] + this._p3[2] * spread;
            out[1] = this._p3[1] + this._p3[3] * spread;
            return out;
        }

        /* Position MONDE de la cible (bord du conteneur de l'info).
           Utilise la meme conversion ecran -> monde que les axones, pour
           que les deux donnent exactement le meme point. */
        _elementWorldPos(el, out) {
            const anchorEl = el.querySelector('h3, h4, strong, .mono, .service-card__icon, .project__idx') || el;
            this._targetScreenPos(el, anchorEl, this._p2, 0);

            /* Projection courante, si elle n'a pas encore ete faite. */
            this.camera.updateMatrixWorld();
            this._vp.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
            this._setupScreenMap(this.state.constZ);

            this._screenToWorld(this._p2[0], this._p2[1]);
            out.set(this._w[0], this._w[1], this.state.constZ);
            return out;
        }

        /* ---------------------------------------------------------------------
           ECRAN -> MONDE
           Projection homographique inverse sur le plan z = constZ.
           Because une projection est une homographie (elle conserve les
           droites), la polyligne monde se reprojette exactement sur la
           polyligne ecran calculee : les angles a 45 deg restent a 45 deg
           a l'ecran, quelle que soit la camera.
           --------------------------------------------------------------------- */
        _setupScreenMap(zp) {
            const e = this._vp.elements;
            const m0 = e[0], m1 = e[4], m2 = e[8], m3 = e[12];
            const m4 = e[1], m5 = e[5], m6 = e[9], m7 = e[13];
            const m12 = e[3], m13 = e[7], m14 = e[11], m15 = e[15];

            const c1 = m2 * zp + m3;
            const c3 = m6 * zp + m7;
            const c4 = m14 * zp + m15;

            this._su = 2 / window.innerWidth;
            this._sv = 2 / window.innerHeight;

            this._d0 = m4 * m13 - m12 * m5;
            this._d1 = m12 * m1 - m0 * m13;
            this._d2 = m0 * m5 - m4 * m1;

            this._x0 = c4 * m5 - c3 * m13;
            this._x1 = c1 * m13 - c4 * m1;
            this._x2 = c3 * m1 - c1 * m5;

            this._y0 = m12 * c3 - m4 * c4;
            this._y1 = m0 * c4 - m12 * c1;
            this._y2 = m4 * c1 - m0 * c3;
        }

        _screenToWorld(px, py) {
            const u = px * this._su - 1;
            const v = 1 - py * this._sv;
            const inv = 1 / (this._d0 * u + this._d1 * v + this._d2);
            const w = this._w;
            w[0] = (this._x0 * u + this._x1 * v + this._x2) * inv;
            w[1] = (this._y0 * u + this._y1 * v + this._y2) * inv;
        }

        /* ---------------------------------------------------------------------
           ROUTAGE PCB
           Trace la polyligne du fil EN PIXELS, comme le ferait un routeur
           de carte electronique :
             - des courses diagonales a 45 deg,
             - des courses droites (horizontales ou verticales),
           en alternance. Comme les deux familles alternent, chaque coude
           est a 45 deg : jamais d'angle droit strict (un plan orthogonal
           ne ressemblerait pas a du routage PCB).
           La construction est exacte : la route atterrit precisement sur
           la cible, et chaque segment garde une longueur minimale.
           Renvoie le nombre de coudes (= nombre de vias).
           --------------------------------------------------------------------- */
        _routePCB(axon) {
            const RX = axon.rx, RY = axon.ry;
            const sx = axon.sx, sy = axon.sy, tx = axon.tx, ty = axon.ty;
            const dx = tx - sx, dy = ty - sy;
            const ax = dx < 0 ? -1 : 1;
            const ay = dy < 0 ? -1 : 1;
            const adx = dx < 0 ? -dx : dx;
            const ady = dy < 0 ? -dy : dy;
            const mn = adx < ady ? adx : ady;   // plus petit ecart
            const mx = adx < ady ? ady : adx;   // plus grand ecart

            const MIN = this._minLen;          // course droite minimale
            const DMIN = this._diagMin;        // diagonale minimale

            let i = 0;
            RX[0] = sx; RY[0] = sy;

            /* --- Cible parfaitement alignee : une seule course droite --- */
            if (mn < 1) {
                RX[1] = tx; RY[1] = ty;
                axon.nSeg = 1;
                this._measure(axon);
                return 0;
            }

            /* --- Schema « etage » : 3 coudes.
                   diagonale / droite / diagonale / droite.
                   D = total des deux diagonales ; on le borne pour qu'il
                   reste une course droite de chaque cote.
                   Exige : adx - D >= MIN et ady - D >= MIN. --- */
            const etageOK = mn >= DMIN * 2 + MIN;
            if (etageOK && axon.schema === 0) {
                const dmin = DMIN * 2;
                const dmax = mn - MIN;
                const D = dmin + (dmax - dmin) * axon.frac[1];
                const d1 = DMIN + (D - DMIN * 2) * axon.frac[0];
                const d2 = D - d1;

                /* La premiere course droite est horizontale ou verticale :
                   c'est ce qui fait varier le dessin des traces. */
                const hFirst = axon.axisPref === 0;
                const L1 = hFirst ? adx - D : ady - D;
                const L2 = hFirst ? ady - D : adx - D;

                let cx = sx + ax * d1, cy = sy + ay * d1;
                RX[++i] = cx; RY[i] = cy;               // coude 1
                if (hFirst) cx += ax * L1; else cy += ay * L1;
                RX[++i] = cx; RY[i] = cy;               // coude 2
                cx += ax * d2; cy += ay * d2;
                RX[++i] = cx; RY[i] = cy;               // coude 3
                if (hFirst) cy += ay * L2; else cx += ax * L2;
                RX[++i] = tx; RY[i] = ty;               // cible

                axon.nSeg = i;
                this._measure(axon);
                return i - 1;
            }

            /* --- Schema « croise » : 2 coudes.
                   diagonale / droite / diagonale. La course droite se fait
                   sur l'axe dominant ; les deux diagonales consomment
                   exactement le petit ecart. --- */
            if (mn >= 14 && mx - mn >= MIN) {
                const d1 = mn * (0.3 + 0.4 * axon.frac[0]);
                const d2 = mn - d1;

                let cx = sx + ax * d1, cy = sy + ay * d1;
                RX[++i] = cx; RY[i] = cy;               // coude 1
                if (adx > ady) cx += ax * (mx - mn); else cy += ay * (mx - mn);
                RX[++i] = cx; RY[i] = cy;               // coude 2
                cx += ax * d2; cy += ay * d2;
                RX[++i] = cx; RY[i] = cy;               // cible

                axon.nSeg = i;
                this._measure(axon);
                return i - 1;
            }

            /* --- Schema « etage » en repli : la cible est proche de la
                   diagonale du cerveau, on repasse par le schema a 3 coudes
                   pour garder des angles francs. --- */
            if (etageOK) {
                const dmin = DMIN * 2;
                const dmax = mn - MIN;
                const D = dmin + (dmax - dmin) * axon.frac[1];
                const d1 = DMIN + (D - DMIN * 2) * axon.frac[0];
                const d2 = D - d1;

                const hFirst = axon.axisPref === 0;
                const L1 = hFirst ? adx - D : ady - D;
                const L2 = hFirst ? ady - D : adx - D;

                let cx = sx + ax * d1, cy = sy + ay * d1;
                RX[++i] = cx; RY[i] = cy;
                if (hFirst) cx += ax * L1; else cy += ay * L1;
                RX[++i] = cx; RY[i] = cy;
                cx += ax * d2; cy += ay * d2;
                RX[++i] = cx; RY[i] = cy;
                if (hFirst) cy += ay * L2; else cx += ax * L2;
                RX[++i] = tx; RY[i] = ty;

                axon.nSeg = i;
                this._measure(axon);
                return i - 1;
            }

            /* --- Secours : une diagonale puis une course droite. --- */
            {
                let cx = sx + ax * mn, cy = sy + ay * mn;
                RX[++i] = cx; RY[i] = cy;
                RX[++i] = tx; RY[i] = ty;
                axon.nSeg = i;
                this._measure(axon);
                return i - 1;
            }
        }

        /* Longueurs cumulees + repartition des intervalles d'echantillonnage.
           Les coudes doivent tomber exactement sur un point echantillonne,
           sinon ils seraient arrondis (le trace resterait « lisse »). */
        _measure(axon) {
            const RX = axon.rx, RY = axon.ry, CUM = axon.cum, M = axon.m;
            const nSeg = axon.nSeg;
            let total = 0;
            CUM[0] = 0;
            for (let k = 1; k <= nSeg; k++) {
                const dx = RX[k] - RX[k - 1], dy = RY[k] - RY[k - 1];
                total += Math.sqrt(dx * dx + dy * dy);
                CUM[k] = total;
            }
            axon.total = total;

            const budget = AXON_SEG - 1;
            let used = 0;
            for (let k = 0; k < nSeg; k++) {
                let m = Math.round(budget * (CUM[k + 1] - CUM[k]) / total);
                if (m < 1) m = 1;
                M[k] = m; used += m;
            }
            while (used > budget) {
                let bi = -1, bl = -1;
                for (let k = 0; k < nSeg; k++) {
                    const l = CUM[k + 1] - CUM[k];
                    if (M[k] > 1 && l > bl) { bl = l; bi = k; }
                }
                if (bi < 0) break;
                M[bi]--; used--;
            }
            while (used < budget) {
                let bi = 0, bl = -1;
                for (let k = 0; k < nSeg; k++) {
                    const l = CUM[k + 1] - CUM[k];
                    if (l > bl) { bl = l; bi = k; }
                }
                M[bi]++; used++;
            }
        }

        _updateNeurons(t) {
            if (!this.neurons.length) return;
            const s = this.state;
            const SEG = AXON_SEG;

            /* --- Camera et matrice de projection a jour --- */
            this.camera.updateMatrixWorld();
            this._vp.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);

            const zp = s.constZ;
            this._setupScreenMap(zp);

            /* Compteur de frame : sert a ne recalculer la cible DOM d'un
               element qu'une seule fois par frame. */
            this._frameId++;

            const vw = window.innerWidth, vh = window.innerHeight;
            /* Longueur minimale d'un segment de routage (adapter a l'ecran) */
            this._minLen = Math.max(18, Math.min(40, Math.min(vw, vh) * 0.035));
            /* Longueur minimale d'une diagonale a 45 deg */
            this._diagMin = Math.max(14, Math.min(30, Math.min(vw, vh) * 0.028));

            /* --- Vias : un seul tampon pour toute la scene --- */
            const viaGeo = this.viaGeo;
            const viaPos = viaGeo.attributes.position.array;
            const viaT = viaGeo.attributes.aT.array;
            const viaProg = viaGeo.attributes.aProg.array;
            const maxVias = viaPos.length / 3;
            let viaN = 0;
            this.viaMat.uniforms.uTime.value = t;

            /* --- Coeffs de l'homographie, copies en local (pas de lookup
                   sur `this` dans la boucle chaude) --- */
            const su = this._su, sv = this._sv;
            const d0 = this._d0, d1 = this._d1, d2 = this._d2;
            const x0 = this._x0, x1 = this._x1, x2 = this._x2;
            const y0 = this._y0, y1 = this._y1, y2 = this._y2;

            /* --- Position ecran du cerveau (partagee par tous les axones) --- */
            const bx = (s.constX + 1) * 0.5 * vw;
            const by = (1 - s.constY) * 0.5 * vh;

            const neurons = this.neurons;
            const nNeurons = neurons.length;

            for (let n = 0; n < nNeurons; n++) {
                const axon = neurons[n];
                const p = axon.state.progress;
                axon.mat.uniforms.uTime.value = t;
                axon.mat.uniforms.uProgress.value = p > 0.002 ? p : -0.05;

                if (p <= 0.002) {
                    axon.tip.material.opacity = 0;
                    continue;
                }

                /* --- Depart : point du cerveau projete a l'ecran --- */
                const c = this.constellation;
                const sc = s.constSpread * this.constScale * this.intro.scale;
                const v = this._v3;
                v.set(axon.start.x * sc, axon.start.y * sc, axon.start.z * sc);
                v.applyAxisAngle(AXIS_Y, c.rotation.y);
                v.applyAxisAngle(AXIS_X, c.rotation.x);
                v.add(c.position);
                const e = this._vp.elements;
                const cw = e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15];
                const cx = e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12];
                const cy = e[1] * v.x + e[5] * v.y + e[9] * v.z + e[13];
                const iw = 1 / cw;
                const sx = (cx * iw * 0.5 + 0.5) * vw;
                const sy = (0.5 - cy * iw * 0.5) * vh;
                axon.sx = sx;
                axon.sy = sy;

                /* --- Cible : bord du conteneur de l'info. Les 3 axones
                       d'un meme element la partagent : on ne mesure le DOM
                       qu'une fois par element et par frame (le reflow
                       force par getBoundingClientRect est le poste le plus
                       cher du frame). --- */
                const ei = axon.elIdx;
                if (this._tgtStamp[ei] !== this._frameId) {
                    this._targetScreenBase(axon.el, axon.anchor, this._p3);
                    this._tgtX[ei] = this._p3[0];
                    this._tgtY[ei] = this._p3[1];
                    this._tgtTX[ei] = this._p3[2];
                    this._tgtTY[ei] = this._p3[3];
                    this._tgtStamp[ei] = this._frameId;
                }
                const sp = axon.spread;
                const tx = this._tgtX[ei] + this._tgtTX[ei] * sp;
                const ty = this._tgtY[ei] + this._tgtTY[ei] * sp;
                axon.tx = tx;
                axon.ty = ty;

                /* --- Route PCB --- */
                this._routePCB(axon);

                /* --- Echantillonnage + ecriture du ruban ---
                   Les 26 points sont repartis sur les segments : chaque coude
                   tombe exactement sur un point echantillonne, ce qui garde
                   l'angle net. Le ruban est elargi aux coudes (jointure en
                   mitre) pour eviter l'encoche que laisserait une largeur
                   constante. */
                const RX = axon.rx, RY = axon.ry, CUM = axon.cum, M = axon.m;
                const arr = axon.path;
                const aTArr = axon.geo.attributes.aT.array;
                const nSeg = axon.nSeg, total = axon.total;
                let si = 0, lnx = 0, lny = 0;
                let pnx = 0, pny = 0, hasPrev = false;

                for (let k = 0; k < nSeg; k++) {
                    const x0s = RX[k], y0s = RY[k];
                    const ex = RX[k + 1] - x0s, ey = RY[k + 1] - y0s;
                    const len = Math.sqrt(ex * ex + ey * ey) || 1e-4;
                    const nx = -ey / len, ny = ex / len;
                    lnx = nx; lny = ny;
                    const m = M[k];
                    const base = CUM[k];

                    /* Normale du segment precedent (pour la mitre). */
                    let mnx = nx, mny = ny, mscale = 1;
                    if (hasPrev) {
                        /* On lisse les deux normales et on allonge le trait
                           juste assez pour que la largeur reste constante
                           apres le coude (cos de l'angle). */
                        const sx2 = pnx + nx, sy2 = pny + ny;
                        const sl = Math.sqrt(sx2 * sx2 + sy2 * sy2) || 1e-4;
                        mnx = sx2 / sl; mny = sy2 / sl;
                        const cosA = mnx * nx + mny * ny;
                        mscale = cosA > 0.2 ? 1 / cosA : 1;
                    }

                    for (let j = 0; j < m; j++) {
                        const f = j / m;
                        const px = x0s + ex * f, py = y0s + ey * f;
                        const o = si * 6;

                        /* Echantillon situe sur le coude (1er point du
                           segment suivant) : on elargit (mitre). */
                        const w = (j === 0 && hasPrev) ? TRACE_HALF_W * mscale : TRACE_HALF_W;
                        const un = (j === 0 && hasPrev) ? mnx : nx;
                        const vn = (j === 0 && hasPrev) ? mny : ny;

                        /* ecran -> monde (homographie inverse, in-linee) */
                        let u = (px + un * w) * su - 1;
                        let vv = 1 - (py + vn * w) * sv;
                        let inv = 1 / (d0 * u + d1 * vv + d2);
                        arr[o] = (x0 * u + x1 * vv + x2) * inv;
                        arr[o + 1] = (y0 * u + y1 * vv + y2) * inv;
                        arr[o + 2] = zp;

                        u = (px - un * w) * su - 1;
                        vv = 1 - (py - vn * w) * sv;
                        inv = 1 / (d0 * u + d1 * vv + d2);
                        arr[o + 3] = (x0 * u + x1 * vv + x2) * inv;
                        arr[o + 4] = (y0 * u + y1 * vv + y2) * inv;
                        arr[o + 5] = zp;

                        aTArr[si * 2] = aTArr[si * 2 + 1] = (base + len * f) / total;
                        si++;
                    }
                    pnx = nx; pny = ny; hasPrev = true;
                }

                /* Dernier point : la cible exacte, largeur pleine */
                {
                    const o = si * 6;
                    let u = (RX[nSeg] + lnx * TRACE_HALF_W) * su - 1;
                    let vv = 1 - (RY[nSeg] + lny * TRACE_HALF_W) * sv;
                    let inv = 1 / (d0 * u + d1 * vv + d2);
                    arr[o] = (x0 * u + x1 * vv + x2) * inv;
                    arr[o + 1] = (y0 * u + y1 * vv + y2) * inv;
                    arr[o + 2] = zp;

                    u = (RX[nSeg] - lnx * TRACE_HALF_W) * su - 1;
                    vv = 1 - (RY[nSeg] - lny * TRACE_HALF_W) * sv;
                    inv = 1 / (d0 * u + d1 * vv + d2);
                    arr[o + 3] = (x0 * u + x1 * vv + x2) * inv;
                    arr[o + 4] = (y0 * u + y1 * vv + y2) * inv;
                    arr[o + 5] = zp;

                    aTArr[si * 2] = aTArr[si * 2 + 1] = 1;
                    si++;
                }
                axon.geo.attributes.position.needsUpdate = true;
                axon.geo.attributes.aT.needsUpdate = true;

                /* --- Vias sur les coudes --- */
                for (let k = 1; k < nSeg && viaN < maxVias; k++) {
                    let u = RX[k] * su - 1;
                    let vv = 1 - RY[k] * sv;
                    let inv = 1 / (d0 * u + d1 * vv + d2);
                    viaPos[viaN * 3] = (x0 * u + x1 * vv + x2) * inv;
                    viaPos[viaN * 3 + 1] = (y0 * u + y1 * vv + y2) * inv;
                    viaPos[viaN * 3 + 2] = zp;
                    viaT[viaN] = CUM[k] / total;
                    viaProg[viaN] = p;
                    viaN++;
                }

                /* --- Tete lumineuse, placee sur le chemin --- */
                const sArc = p * total;
                let k = 0;
                while (k < nSeg - 1 && CUM[k + 1] < sArc) k++;
                const segLen = CUM[k + 1] - CUM[k];
                const f = segLen > 0 ? Math.min(1, Math.max(0, (sArc - CUM[k]) / segLen)) : 0;
                const tpx = RX[k] + (RX[k + 1] - RX[k]) * f;
                const tpy = RY[k] + (RY[k + 1] - RY[k]) * f;
                {
                    let u = tpx * su - 1;
                    let vv = 1 - tpy * sv;
                    let inv = 1 / (d0 * u + d1 * vv + d2);
                    axon.tip.position.set(
                        (x0 * u + x1 * vv + x2) * inv,
                        (y0 * u + y1 * vv + y2) * inv,
                        zp
                    );
                }
                axon.tip.material.opacity = 0.85 * Math.min(1, p * 2);
                axon.tip.scale.setScalar(0.16 + 0.10 * Math.sin(t * 4 + n));
            }

            /* --- Un seul upload pour tous les vias --- */
            viaGeo.setDrawRange(0, viaN);
            viaGeo.attributes.position.needsUpdate = true;
            viaGeo.attributes.aT.needsUpdate = true;
            viaGeo.attributes.aProg.needsUpdate = true;
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
            if (this.viaMat) this.viaMat.uniforms.uPixelRatio.value = this.pixelRatio;

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

                // Vue 3/4 : c'est l'angle qui fait lire un cerveau
                // plutot qu'une forme symetrique de face.
                this.constellation.rotation.y = -0.52 + Math.sin(t * 0.1) * 0.13 + this.pointerSmooth.x * 0.12;
                this.constellation.rotation.x = 0.13 + Math.sin(t * 0.075) * 0.05 + this.pointerSmooth.y * 0.06;

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

            /* --- Camera : elle doit etre a jour AVANT le calcul des
                   axones, dont le routage est calcule en espace ecran. --- */
            this.camera.position.x += (s.camX + this.pointerSmooth.x * 0.32 - this.camera.position.x) * 0.06;
            this.camera.position.y += (s.camY + this.pointerSmooth.y * 0.22 - this.camera.position.y) * 0.06;
            this.camera.position.z += (s.camZ - this.camera.position.z) * 0.06;
            this.camera.lookAt(0, 0, 0);
            this.camera.updateMatrixWorld();

            this._updateNeurons(t);

            this.dustMat.uniforms.uTime.value = t;
            this.dustMat.uniforms.uOpacity.value = s.dustOpacity;
            this.dustMat.uniforms.uGlitch.value = s.glitch * 0.5;
            this.dust.position.x = -this.pointerSmooth.x * 0.7 * this.dustScale;
            this.dust.position.y = -this.pointerSmooth.y * 0.5 * this.dustScale;

            s.glitch += (this.glitchTarget - s.glitch) * 0.25;
            this.glitchTarget *= 0.86;

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
