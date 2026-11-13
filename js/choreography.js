/* =========================================================================
   choreography.js — Mise en scène
   1. Actes : la scène 3D se métamorphose au fil du scroll (scrollytelling)
   2. Animations d'entrée / parallax / tilt / magnétisme
   ========================================================================= */
(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    /* ---------------------------------------------------------------------
       LES ACTES
       Chaque section du site correspond à un état de la scène 3D.
       photoX / photoY : position normalisée de la photo (-1..1)
       --------------------------------------------------------------------- */

    const ACTS_DESKTOP = [
        { // 0 — ACCUEIL : le cerveau occupe l'écran, texte en bas (style MDX)
            constOpacity: 1, constSpread: 2.6,
            constX: 0.02, constY: 0.42, constZ: -0.8,
            morphB: 0,
            dustOpacity: 0.3, glowOpacity: 1, glowScale: 1.2,
            camX: 0, camY: 0, camZ: 8
        },
        { // 1 — À PROPOS : le cerveau descend, il se connecte aux piliers
            constOpacity: 0.42, constSpread: 1.7,
            constX: 0.06, constY: -0.22, constZ: -3,
            morphB: 0,
            dustOpacity: 0.12, glowOpacity: 0.5, glowScale: 0.9,
            camX: 0, camY: 0, camZ: 9
        },
        { // 2 — SERVICES : le cerveau s'ouvre, les axones montent vers les cartes
            constOpacity: 0.34, constSpread: 1.6,
            constX: 0.06, constY: -0.4, constZ: -4,
            morphB: 0,
            dustOpacity: 0.15, glowOpacity: 0.45, glowScale: 0.8,
            camX: 0, camY: 0, camZ: 9.6
        },
        { // 3 — STACK : le cerveau se resserre, une pensée qui boucle
            constOpacity: 0.36, constSpread: 1.5,
            constX: 0.08, constY: -0.36, constZ: -4,
            morphB: 0,
            dustOpacity: 0.14, glowOpacity: 0.42, glowScale: 0.75,
            camX: 0, camY: 0, camZ: 8.8
        },
        { // 4 — PROJETS : le cerveau se dilue en champ de points
            constOpacity: 0.3, constSpread: 1.8,
            constX: 0.22, constY: 0.06, constZ: -4,
            morphB: 0,
            dustOpacity: 0.12, glowOpacity: 0.35, glowScale: 0.9,
            camX: 0, camY: 0, camZ: 10.5
        },
        { // 5 — PARCOURS : le cerveau se place à droite, il relie les étapes
            constOpacity: 0.38, constSpread: 1.7,
            constX: 0.46, constY: 0.04, constZ: -4,
            morphB: 0,
            dustOpacity: 0.13, glowOpacity: 0.4, glowScale: 0.85,
            camX: 0, camY: 0, camZ: 9
        },
        { // 6 — CONTACT : le cerveau s'illumine et se délite en axones
            constOpacity: 0.5, constSpread: 2,
            constX: 0.04, constY: -0.3, constZ: -3,
            morphB: 0.55,
            dustOpacity: 0.15, glowOpacity: 0.6, glowScale: 1,
            camX: 0, camY: 0, camZ: 7.6
        }
    ];

    const ACTS_MOBILE = [
        { constOpacity: 0.55, constSpread: 1.9,
          constX: 0, constY: 0.62, constZ: -2.4, morphB: 0,
          dustOpacity: 0.16, glowOpacity: 0.5, glowScale: 0.7, camX: 0, camY: 0, camZ: 8 },
        { constOpacity: 0.46, constSpread: 1.8,
          constX: 0.1, constY: -0.25, constZ: -3, morphB: 0,
          dustOpacity: 0.18, glowOpacity: 0.45, glowScale: 0.7, camX: 0, camY: 0, camZ: 9 },
        { constOpacity: 0.42, constSpread: 1.8,
          constX: 0, constY: -0.5, constZ: -4, morphB: 0,
          dustOpacity: 0.2, glowOpacity: 0.4, glowScale: 0.6, camX: 0, camY: 0, camZ: 9.4 },
        { constOpacity: 0.42, constSpread: 1.7,
          constX: 0, constY: -0.45, constZ: -4, morphB: 0,
          dustOpacity: 0.18, glowOpacity: 0.35, glowScale: 0.6, camX: 0, camY: 0, camZ: 8.6 },
        { constOpacity: 0.36, constSpread: 2,
          constX: 0.2, constY: 0, constZ: -4, morphB: 0,
          dustOpacity: 0.14, glowOpacity: 0.3, glowScale: 0.7, camX: 0, camY: 0, camZ: 10.2 },
        { constOpacity: 0.46, constSpread: 1.9,
          constX: 0.32, constY: 0, constZ: -4, morphB: 0,
          dustOpacity: 0.16, glowOpacity: 0.35, glowScale: 0.7, camX: 0, camY: 0, camZ: 8.8 },
        { constOpacity: 0.52, constSpread: 2.2,
          constX: 0, constY: -0.4, constZ: -3, morphB: 0.55,
          dustOpacity: 0.18, glowOpacity: 0.5, glowScale: 0.9, camX: 0, camY: 0, camZ: 7.8 }
    ];

    /* ---------------------------------------------------------------------
       OUTILS DE DÉCOUPE DE TEXTE
       --------------------------------------------------------------------- */

    /* Normalise les espaces : évite les doubles espaces et les espaces
       parasites autour des <br> une fois le texte découpé. */
    function normalizeWhitespace(el) {
        const nodes = Array.from(el.childNodes);
        nodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
                n.textContent = n.textContent.replace(/\s+/g, ' ');
            }
        });
        nodes.forEach((n, i) => {
            if (n.nodeName === 'BR') {
                const prev = nodes[i - 1];
                const next = nodes[i + 1];
                if (prev && prev.nodeType === Node.TEXT_NODE) {
                    prev.textContent = prev.textContent.replace(/\s+$/, '');
                    if (!prev.textContent) prev.remove();
                }
                if (next && next.nodeType === Node.TEXT_NODE) {
                    next.textContent = next.textContent.replace(/^\s+/, '');
                    if (!next.textContent) next.remove();
                }
            }
        });
    }

    function wrapWords(node) {
        const children = Array.from(node.childNodes);
        children.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent;
                if (!text.trim()) return;
                const frag = document.createDocumentFragment();
                text.split(/(\s+)/).forEach((part) => {
                    if (part === '') return;
                    if (!part.trim()) {
                        frag.appendChild(document.createTextNode(' '));
                        return;
                    }
                    const outer = document.createElement('span');
                    outer.className = 'split-word';
                    const inner = document.createElement('span');
                    inner.className = 'split-word__inner';
                    inner.textContent = part;
                    outer.appendChild(inner);
                    frag.appendChild(outer);
                });
                child.parentNode.replaceChild(frag, child);
            } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('split-word')) {
                wrapWords(child);
            }
        });
    }

    function buildWords(el) {
        normalizeWhitespace(el);
        wrapWords(el);
    }

    function buildLines(el) {
        normalizeWhitespace(el);
        const raw = [];
        let current = '';
        Array.from(el.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                current += node.textContent;
            } else if (node.nodeName === 'BR') {
                raw.push(current);
                current = '';
            } else {
                current += node.outerHTML;
            }
        });
        raw.push(current);

        el.innerHTML = '';
        raw.forEach((html) => {
            const line = document.createElement('span');
            line.className = 'split-line';
            const inner = document.createElement('span');
            inner.className = 'split-line__inner';
            inner.innerHTML = html;
            line.appendChild(inner);
            el.appendChild(line);
            wrapWords(inner);
        });
    }

    /* ---------------------------------------------------------------------
       CHORÉGRAPHIE
       --------------------------------------------------------------------- */

    const Choreography = {
        scene: null,
        sections: [],
        anchors: [],
        acts: ACTS_DESKTOP,
        proxy: { p: 0 },

        init(scene) {
            this.scene = scene;
            this.sections = Array.from(document.querySelectorAll('main section[data-act]'));
            this.acts = window.innerWidth < 860 ? ACTS_MOBILE : ACTS_DESKTOP;

            this.prepareText();
            this._setupReveals();
            this._setupParallax();
            this._setupTimelineFill();
            this._setupNavActive();
            this._setupMagnetic();
            this._setupTilt();
            this._setupActs();

            window.addEventListener('resize', () => {
                this.acts = window.innerWidth < 860 ? ACTS_MOBILE : ACTS_DESKTOP;
                this._computeAnchors();
                this._applyProgress(this._currentProgress());
                ScrollTrigger.refresh();
            });

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => ScrollTrigger.refresh());
            }
        },

        /* --- Découpe du texte (fait une seule fois, avant le préloader) --- */
        prepareText() {
            if (this.textPrepared) return;
            this.textPrepared = true;

            document.querySelectorAll('[data-split]').forEach((el) => buildWords(el));
            document.querySelectorAll('[data-split-words]').forEach((el) => buildWords(el));
            document.querySelectorAll('[data-split-lines]').forEach((el) => buildLines(el));

            if (REDUCED) {
                gsap.set('.split-word__inner, .split-line__inner', { yPercent: 0 });
                return;
            }
            gsap.set('.split-word__inner', { yPercent: 112 });
            gsap.set('.split-line__inner', { yPercent: 108 });
        },

        /* --- Révélations au scroll --- */
        _setupReveals() {
            const items = Array.from(document.querySelectorAll('[data-reveal]'))
                .filter((el) => !el.closest('.hero'));

            if (REDUCED) {
                gsap.set(items, { opacity: 1, y: 0 });
                return;
            }

            items.forEach((el) => {
                const delay = parseFloat(el.dataset.delay || 0);
                gsap.set(el, { opacity: 0, y: 26 });
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 88%',
                    onEnter: () => gsap.to(el, {
                        opacity: 1, y: 0, duration: 0.9, delay, ease: 'expo.out', overwrite: 'auto'
                    }),
                    onLeaveBack: () => gsap.to(el, {
                        opacity: 0, y: 26, duration: 0.45, ease: 'power2.in', overwrite: 'auto'
                    })
                });
            });

            // Titres de sections : cascade de mots
            document.querySelectorAll('[data-split-words]').forEach((el) => {
                const words = el.querySelectorAll('.split-word__inner');
                if (!words.length) return;
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    onEnter: () => gsap.to(words, {
                        yPercent: 0, duration: 1, stagger: 0.045, ease: 'expo.out', overwrite: 'auto'
                    }),
                    onLeaveBack: () => gsap.set(words, { yPercent: 108 })
                });
            });

            // Manifeste : lignes
            document.querySelectorAll('[data-split-lines]').forEach((el) => {
                const lines = el.querySelectorAll('.split-line__inner');
                if (!lines.length) return;
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 84%',
                    onEnter: () => gsap.to(lines, {
                        yPercent: 0, duration: 1.15, stagger: 0.1, ease: 'expo.out', overwrite: 'auto'
                    }),
                    onLeaveBack: () => gsap.set(lines, { yPercent: 108 })
                });
            });
        },

        /* --- Parallaxe --- */
        _setupParallax() {
            if (REDUCED) return;
            document.querySelectorAll('[data-parallax]').forEach((el) => {
                const f = parseFloat(el.dataset.parallax || 0.12);
                const section = el.closest('section') || el;
                gsap.fromTo(el,
                    { yPercent: -f * 26 },
                    {
                        yPercent: f * 26,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: section,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true
                        }
                    }
                );
            });
        },

        /* --- Remplissage de la frise chronologique --- */
        _setupTimelineFill() {
            const fill = document.getElementById('timeline-fill');
            const rail = document.querySelector('.timeline');
            if (!fill || !rail) return;

            if (REDUCED) {
                fill.style.height = '100%';
                return;
            }
            gsap.fromTo(fill,
                { height: '0%' },
                {
                    height: '100%',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: rail,
                        start: 'top 78%',
                        end: 'bottom 62%',
                        scrub: 0.6
                    }
                }
            );
        },

        /* --- Lien de navigation actif --- */
        _setupNavActive() {
            document.querySelectorAll('[data-nav]').forEach((link) => {
                const sel = link.getAttribute('href');
                const sec = document.querySelector(sel);
                if (!sec) return;
                ScrollTrigger.create({
                    trigger: sec,
                    start: 'top 48%',
                    end: 'bottom 48%',
                    onToggle: (self) => link.classList.toggle('is-active', self.isActive)
                });
            });
        },

        /* --- Boutons magnétiques --- */
        _setupMagnetic() {
            if (IS_TOUCH_DEVICE()) return;
            document.querySelectorAll('[data-magnetic]').forEach((el) => {
                el.addEventListener('pointerenter', () => {
                    gsap.to(el, { scale: 1.04, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
                });
                el.addEventListener('pointermove', (e) => {
                    const r = el.getBoundingClientRect();
                    const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
                    const dy = (e.clientY - (r.top + r.height / 2)) * 0.45;
                    gsap.to(el, { x: dx, y: dy, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
                });
                el.addEventListener('pointerleave', () => {
                    gsap.to(el, {
                        x: 0, y: 0, scale: 1, duration: 0.85, ease: 'elastic.out(1, 0.45)', overwrite: 'auto'
                    });
                });
            });
        },

        /* --- Cartes en 3D au survol --- */
        _setupTilt() {
            if (IS_TOUCH_DEVICE()) return;
            document.querySelectorAll('[data-tilt]').forEach((card) => {
                card.addEventListener('pointermove', (e) => {
                    const r = card.getBoundingClientRect();
                    const px = (e.clientX - r.left) / r.width - 0.5;
                    const py = (e.clientY - r.top) / r.height - 0.5;
                    gsap.to(card, {
                        rotateY: px * 8,
                        rotateX: -py * 8,
                        transformPerspective: 900,
                        duration: 0.7,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                    card.style.setProperty('--mx', (px * 100 + 50) + '%');
                    card.style.setProperty('--my', (py * 100 + 50) + '%');
                });
                card.addEventListener('pointerleave', () => {
                    gsap.to(card, {
                        rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power3.out', overwrite: 'auto'
                    });
                });
            });
        },

        /* --- Le fil du scrollytelling : la 3D suit le scroll ---
           La progression est lue directement sur la position de scroll et
           lissée à chaque frame. Indépendant du mécanisme de scroll
           (Lenis, natif, clavier, ancres) : jamais de désynchronisation. */
        _setupActs() {
            this._computeAnchors();
            this._applyProgress(0);

            if (REDUCED) return;

            this._smooth = this._currentProgress();
            gsap.ticker.add((time, deltaTime) => {
                // Lissage en temps réel : indépendant du framerate.
                const dt = Math.min(deltaTime || 16.7, 100) / 1000;
                const alpha = 1 - Math.exp(-dt / 0.16);
                const target = this._currentProgress();
                this._smooth += (target - this._smooth) * alpha;
                if (Math.abs(target - this._smooth) < 0.0004) this._smooth = target;
                this._applyProgress(this._smooth);
            });
        },

        _currentProgress() {
            const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            return clamp(window.scrollY / range, 0, 1);
        },

        /* Recalcule les ancres après un changement de hauteur de page
           (images lazy qui se chargent, polices, etc.) */
        refreshAnchors() {
            this._computeAnchors();
            this._applyProgress(this._currentProgress());
        },

        _computeAnchors() {
            const vh = window.innerHeight;
            const range = Math.max(1, document.documentElement.scrollHeight - vh);
            this.anchors = this.sections.map((sec) => {
                const top = sec.getBoundingClientRect().top + window.scrollY;
                return clamp((top - vh * 0.55) / range, 0, 1);
            });
            // Garantir la monotonie croissante
            for (let i = 1; i < this.anchors.length; i++) {
                if (this.anchors[i] < this.anchors[i - 1]) this.anchors[i] = this.anchors[i - 1];
            }
        },

        _applyProgress(p) {
            if (!this.scene) return;
            const acts = this.acts;
            const a = this.anchors;
            if (!a.length) return;

            let i = 0;
            while (i < a.length - 2 && p > a[i + 1]) i++;

            const from = acts[Math.min(i, acts.length - 1)];
            const to = acts[Math.min(i + 1, acts.length - 1)];
            const span = a[Math.min(i + 1, a.length - 1)] - a[i];
            let t = span > 0 ? (p - a[i]) / span : 0;
            t = easeInOutCubic(clamp(t, 0, 1));

            const state = this.scene.state;
            for (const key in from) {
                if (typeof from[key] === 'number' && typeof to[key] === 'number') {
                    state[key] = from[key] + (to[key] - from[key]) * t;
                }
            }
        },

        /* --- Ouverture : le hero se met en scène --- */
        playIntro() {
            // Sans scene 3D (reduced-motion, WebGL indisponible), on se
            // contente de rendre le texte visible.
            if (REDUCED || !this.scene) {
                gsap.set('.split-word__inner, .split-line__inner', { yPercent: 0 });
                gsap.set('[data-reveal]', { opacity: 1, y: 0 });
                if (this.scene) {
                    this.scene.intro.scale = 1;
                    this.scene.intro.opacity = 1;
                }
                return;
            }

            const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

            tl.from(this.scene.intro, { opacity: 0, duration: 1.6 }, 0);
            tl.from(this.scene.intro, { scale: 0.55, duration: 1.9 }, 0);
            tl.to('.hero .split-word__inner', { yPercent: 0, duration: 1.25, stagger: 0.055 }, 0.15);
            tl.to('.hero [data-reveal]', {
                opacity: 1, y: 0, duration: 1, stagger: 0.07
            }, 0.3);
            tl.from('.hero__scroll-hint', { opacity: 0, y: 18, duration: 0.9 }, 1);
            tl.from('.navbar', { y: -30, opacity: 0, duration: 1 }, 0.4);

            return tl;
        }
    };

    function IS_TOUCH_DEVICE() {
        return window.matchMedia('(hover: none)').matches;
    }

    window.Choreography = Choreography;
})();
