/* =========================================================================
   main.js — Bootstrap de l'application
   Préloader · Scroll fluide (Lenis) · Curseur · Menu · Formulaire · Rendu
   ========================================================================= */
(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HOVER_OK = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

    let scene = null;
    let lenis = null;
    let scrollProgressEl = null;

    /* =====================================================================
       BOOTSTRAP
       ===================================================================== */
    function boot() {
        // Icônes
        if (window.lucide) lucide.createIcons();

        // GSAP est optionnel : sans lui (CDN bloque, reseau coupe), le site
        // doit rester parfaitement lisible et utilisable. On retire alors le
        // preloader et on revele tout le contenu.
        const HAS_GSAP = !!window.gsap;
        if (!HAS_GSAP) {
            document.documentElement.classList.add('no-gsap');
            document.body.classList.remove('is-loading');
            const pre = document.getElementById('preloader');
            if (pre) pre.remove();
        }

        // Découpe du texte AVANT le préloader : le hero est déjà masqué
        // quand le rideau s'ouvre, pas de flash.
        if (HAS_GSAP && window.Choreography) Choreography.prepareText();

        // Scroll fluide + ScrollTrigger
        if (HAS_GSAP) {
            setupSmoothScroll();
            gsap.registerPlugin(ScrollTrigger);
        }

        // Scène 3D
        const canvas = $('#gl-canvas');
        if (canvas && window.Scene3D && !REDUCED && HAS_GSAP) {
            try {
                scene = window.Scene3D.create(canvas);
                window.__scene = scene;
                startRenderLoop();
            } catch (err) {
                console.warn('Scène 3D indisponible :', err);
                scene = null;
            }
        }

        setupPreloader();
        setupMobileMenu();
        setupCursor();
        setupNavbar();
        setupScrollProgress();
        setupAnchorLinks();
        setupContactForm();
        setupRevealOnLoad();
        setupLayoutObserver();
        buildSchematics();

        // L'annee courante, pas une valeur codee en dur
        const yearEl = document.getElementById('current-year');
        if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    }

    /* =====================================================================
       SCROLL FLUIDE (LENIS) + GSAP
       ===================================================================== */
    function setupSmoothScroll() {
        if (REDUCED || !window.Lenis) {
            // 'smooth' contredit reduced-motion : on impose 'auto'.
            document.documentElement.style.scrollBehavior = 'auto';
            return;
        }

        lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 1.6,
            wheelMultiplier: 1
        });
        window.__lenis = lenis;

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    function scrollToTarget(target) {
        if (lenis) {
            lenis.scrollTo(target, { offset: -70, duration: 1.3 });
        } else {
            const y = target.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
        }
    }

    /* =====================================================================
       BOUCLE DE RENDU 3D
       ===================================================================== */
    function startRenderLoop() {
        // requestAnimationFrame : meme rendu que gsap.ticker, et le
        // navigateur met la boucle en pause tout seul quand l'onglet passe
        // en arriere-plan (pas de consommation de batterie inutile).
        let raf = 0;
        const loop = () => {
            if (scene && !document.hidden) scene.render();
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        window.addEventListener('pagehide', () => {
            if (raf) cancelAnimationFrame(raf);
            if (scene) scene.dispose();
        });
    }

    /* =====================================================================
       PRÉLOADER
       ===================================================================== */
    function setupPreloader() {
        const preloader = $('#preloader');
        const countEl = $('#loader-count');
        const barEl = $('#loader-bar');
        if (!preloader) return;

        const counter = { v: 0 };
        let done = false;

        /* --- Messages rotatifs (style MDX) --- */
        const msgs = $$('.preloader__msg');
        let msgIndex = 0;
        let msgTimer = null;

        const rotateMessage = () => {
            if (msgs.length < 2) return;
            const current = msgs[msgIndex];
            msgIndex = (msgIndex + 1) % msgs.length;
            const next = msgs[msgIndex];

            current.classList.remove('is-active');
            current.classList.add('is-out');
            setTimeout(() => current.classList.remove('is-out'), 800);

            next.classList.remove('is-out');
            // Relance l'animation d'entrée
            void next.offsetWidth;
            next.classList.add('is-active');
        };

        const startMessages = () => {
            if (msgs.length < 2) return;
            msgTimer = setInterval(rotateMessage, 1500);
        };
        const stopMessages = () => { if (msgTimer) clearInterval(msgTimer); msgTimer = null; };

        const finish = () => {
            if (done) return;
            done = true;
            try {
                finishWork();
            } catch (err) {
                // Filet de securite : le rideau doit se lever quoi qu'il
                // arrive, sinon la page reste bloquee derriere le preloader.
                console.warn('Finalisation partielle :', err);
                if (window.gsap) gsap.set(preloader, { display: 'none' });
                else preloader.style.display = 'none';
                document.body.classList.remove('is-loading');
                document.body.classList.add('loaded');
            }
        };

        const finishWork = () => {
            stopMessages();
            document.body.classList.remove('is-loading');
            document.body.classList.add('scene-ready');

            if (window.Choreography) {
                Choreography.init(scene);
                Choreography.playIntro();
            }

            if (scene) {

                // Axones : le cerveau se connecte aux infos de la page.
                // On attend la construction :.registerNeuronTargets ignore
                // silencieusement un cerveau pas encore pret.
                scene.buildBrain().then(() => {
                    const targets = $$('[data-neuron]');
                    if (targets.length) scene.registerNeuronTargets(targets);
                });

                // Recalcule la scène quand la mise en page est stabilisée
                setTimeout(() => { ScrollTrigger.refresh(); scene.resize(); }, 260);
            } else {
                // Sans WebGL : on révèle quand même le contenu
                gsap.set('[data-reveal]', { opacity: 1, y: 0 });
                gsap.set('.split-word__inner, .split-line__inner', { yPercent: 0 });
            }

            // Rideau : le préloader se lève, la page apparaît
            const tl = gsap.timeline();
            tl.to(counter, {
                v: 100,
                duration: 0.45,
                ease: 'power2.out',
                onUpdate: () => {
                    const v = Math.round(counter.v);
                    if (countEl) countEl.textContent = String(v).padStart(2, '0');
                    if (barEl) barEl.style.width = v + '%';
                }
            });
            tl.to('.preloader__top, .preloader__bottom', {
                opacity: 0,
                y: (i) => (i === 0 ? -24 : 24),
                duration: 0.45,
                ease: 'power2.in'
            }, '-=0.15');
            tl.to('.preloader__curtain', {
                scaleY: 1,
                duration: 0.5,
                ease: 'power2.inOut'
            }, '-=0.35');
            tl.to(preloader, {
                yPercent: -100,
                duration: 0.95,
                ease: 'expo.inOut'
            }, '-=0.25');
            tl.set(preloader, { display: 'none' });
            tl.to({}, { duration: 0.01, onComplete: () => {
                document.body.classList.add('loaded');
            } });
        };

        // Progression simulée pendant le chargement réel des assets
        const fake = { v: 0 };
        gsap.to(fake, {
            v: 92,
            duration: 1.4,
            ease: 'power1.out',
            onUpdate: () => {
                const v = Math.round(fake.v);
                if (countEl) countEl.textContent = String(v).padStart(2, '0');
                if (barEl) barEl.style.width = v + '%';
            }
        });

        // La ligne d'accent balaie l'écran pendant le chargement
        gsap.fromTo('.preloader__curtain',
            { scaleY: 0, transformOrigin: 'top center' },
            { scaleY: 1, duration: 1.1, ease: 'power2.inOut' });

        startMessages();

        // On n'attend PAS l'événement `load` : il peut tarder à cause des
        // ressources tierces. On se base sur le cerveau 3D + les polices,
        // avec une durée minimale de marque.
        const assetsReady = scene ? scene.buildBrain() : Promise.resolve(false);
        const fontsReady = (document.fonts && document.fonts.ready)
            ? document.fonts.ready.catch(() => {})
            : Promise.resolve();

        Promise.all([assetsReady, fontsReady]).then(() => {
            const elapsed = performance.now();
            const wait = Math.max(0, 1200 - elapsed) / 1000;
            gsap.delayedCall(wait, finish);
        });

        // Filet de sécurité
        setTimeout(() => {
            if (document.body.classList.contains('is-loading')) finish();
        }, 5000);
    }

    /* =====================================================================
       OBSERVATEUR DE LAYOUT
       Les images en lazy-load modifient la hauteur de la page après coup :
       sans ce recalcul, les déclencheurs (lien de nav actif, frise,
       anchres de la scène 3D) restent décalés.
       ===================================================================== */
    function setupLayoutObserver() {
        if (!window.ResizeObserver) return;
        let lastHeight = document.documentElement.scrollHeight;
        let timer = null;

        const observer = new ResizeObserver(() => {
            const h = document.documentElement.scrollHeight;
            if (Math.abs(h - lastHeight) < 4) return;
            lastHeight = h;
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (window.ScrollTrigger) ScrollTrigger.refresh();
                if (window.Choreography) Choreography.refreshAnchors();
            }, 140);
        });

        observer.observe(document.body);

        // Filet supplémentaire : les images lazy chargées au scroll
        $$('img').forEach((img) => {
            if (img.complete) return;
            img.addEventListener('load', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    if (window.ScrollTrigger) ScrollTrigger.refresh();
                    if (window.Choreography) Choreography.refreshAnchors();
                }, 140);
            }, { once: true });
        });
    }

    /* =====================================================================
       SCHEMAS NEURONAUX
       Aucun visuel photographique : les visuels des projets sont des
       schemas de reseau neuronal generes a la volee.
       ===================================================================== */
    function buildSchematics() {
        const panels = $$('[data-schematic]');
        if (!panels.length) return;

        const SVG_NS = 'http://www.w3.org/2000/svg';

        panels.forEach((panel, pi) => {
            const seed = parseInt(panel.dataset.schematic || '1', 10);
            const W = 1200, H = 675;

            const svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            svg.setAttribute('aria-hidden', 'true');
            svg.classList.add('schematic');

            const rnd = (function (a) {
                return function () {
                    a |= 0; a = (a + 0x6D2B79F5) | 0;
                    let t = Math.imul(a ^ (a >>> 15), 1 | a);
                    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                };
            })(seed * 7919 + 13);

            // Trois lobes : meme silhouette que le cerveau 3D
            const lobes = [
                { cx: 425, cy: 305, rx: 215, ry: 235, n: 260 },
                { cx: 775, cy: 305, rx: 215, ry: 235, n: 260 },
                { cx: 600, cy: 470, rx: 132, ry: 96, n: 120 }
            ];

            // Points repartis uniformement dans chaque lobe
            const pts = [];
            lobes.forEach((lobe) => {
                for (let i = 0; i < lobe.n; i++) {
                    const t = rnd();
                    const th = t * Math.PI * 2;
                    const r = Math.sqrt(rnd());
                    // leger retrait de l'axe central : on suggere la fissure
                    const inset = (lobe.cx < 600 ? -1 : 1) * 14 * (1 - Math.abs(Math.cos(th)) * 0.35);
                    pts.push([
                        lobe.cx + Math.cos(th) * r * lobe.rx + inset,
                        lobe.cy + Math.sin(th) * r * lobe.ry,
                        rnd()
                    ]);
                }
            });

            const dots = document.createElementNS(SVG_NS, 'g');
            dots.setAttribute('class', 'schematic__dots');
            pts.forEach((p) => {
                const c = document.createElementNS(SVG_NS, 'circle');
                c.setAttribute('cx', p[0].toFixed(1));
                c.setAttribute('cy', p[1].toFixed(1));
                c.setAttribute('r', (1 + p[2] * 1.7).toFixed(2));
                c.setAttribute('opacity', (0.22 + p[2] * 0.5).toFixed(2));
                dots.appendChild(c);
            });
            svg.appendChild(dots);

            // Connexions denses entre points proches : le maillage doit
            // dessiner des plis, pas un graphe aleatoire.
            const lines = document.createElementNS(SVG_NS, 'g');
            lines.setAttribute('class', 'schematic__links');
            const MAXD = 52;
            const near = [];
            for (let i = 0; i < pts.length; i++) {
                near.length = 0;
                for (let k = 0; k < 14; k++) {
                    const j = Math.floor(rnd() * pts.length);
                    if (j === i) continue;
                    const dx = pts[j][0] - pts[i][0];
                    const dy = pts[j][1] - pts[i][1];
                    const d = dx * dx + dy * dy;
                    if (d < MAXD * MAXD) near.push([d, j]);
                }
                near.sort((a, b) => a[0] - b[0]);
                for (let k = 0; k < Math.min(2, near.length); k++) {
                    const j = near[k][1];
                    const l = document.createElementNS(SVG_NS, 'line');
                    l.setAttribute('x1', pts[i][0].toFixed(1));
                    l.setAttribute('y1', pts[i][1].toFixed(1));
                    l.setAttribute('x2', pts[j][0].toFixed(1));
                    l.setAttribute('y2', pts[j][1].toFixed(1));
                    lines.appendChild(l);
                }
            }
            svg.appendChild(lines);

            // Halo chaud derriere
            const halo = document.createElementNS(SVG_NS, 'ellipse');
            halo.setAttribute('cx', '600');
            halo.setAttribute('cy', '330');
            halo.setAttribute('rx', '360');
            halo.setAttribute('ry', '250');
            halo.setAttribute('class', 'schematic__halo');
            svg.insertBefore(halo, svg.firstChild);

            panel.insertBefore(svg, panel.firstChild);
            panel.classList.add('is-schematic');
        });
    }

    /* =====================================================================
       MENU MOBILE
       ===================================================================== */
    function setupMobileMenu() {
        const btn = $('#mobile-menu-btn');
        const menu = $('#mobile-menu');
        const close = $('#close-menu');
        if (!btn || !menu) return;

        const links = $$('.mobile-nav-links a');
        links.forEach((l, i) => l.style.setProperty('--i', i));

        // Le fond est rendu inerte quand le menu est ouvert : il ne doit
        // plus etre atteignable au clavier ni lu par un lecteur d'ecran.
        const BACKDROP = ['main', '.navbar', '.footer'];
        const setBackdropInert = (on) => {
            BACKDROP.forEach((sel) => {
                const el = sel === 'main' ? document.querySelector('main') : document.querySelector(sel);
                if (!el) return;
                if (on) el.setAttribute('inert', '');
                else el.removeAttribute('inert');
            });
        };

        const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
        let lastFocus = null;

        const open = () => {
            lastFocus = document.activeElement;
            menu.classList.add('is-open');
            menu.setAttribute('aria-hidden', 'false');
            btn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll');
            setBackdropInert(true);
            if (lenis) lenis.stop();
            // Le focus entre dans le menu
            setTimeout(() => close?.focus(), 60);
        };
        const shut = () => {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
            setBackdropInert(false);
            if (lenis) lenis.start();
            // Le focus revient a l'element d'origine
            if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
            else btn.focus();
        };

        btn.addEventListener('click', open);
        close?.addEventListener('click', shut);
        links.forEach((l) => l.addEventListener('click', shut));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) shut();
        });

        // Piege de focus : Tab ne doit jamais sortir du menu ouvert
        menu.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const items = Array.from(menu.querySelectorAll(FOCUSABLE))
                .filter((el) => el.offsetParent !== null);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    /* =====================================================================
       CURSEUR PERSONNALISÉ
       ===================================================================== */
    function setupCursor() {
        if (!HOVER_OK || REDUCED || !window.gsap) return;

        const cursor = $('#cursor');
        if (!cursor) return;
        const dot = $('.cursor__dot', cursor);
        const ring = $('.cursor__ring', cursor);
        if (!dot || !ring) return;

        document.body.classList.add('has-cursor');

        const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const fast = { x: target.x, y: target.y };
        const soft = { x: target.x, y: target.y };

        window.addEventListener('pointermove', (e) => {
            target.x = e.clientX;
            target.y = e.clientY;
        }, { passive: true });

        gsap.ticker.add(() => {
            fast.x += (target.x - fast.x) * 0.55;
            fast.y += (target.y - fast.y) * 0.55;
            soft.x += (target.x - soft.x) * 0.14;
            soft.y += (target.y - soft.y) * 0.14;
            dot.style.transform = `translate(${fast.x}px, ${fast.y}px) translate(-50%, -50%)`;
            ring.style.transform = `translate(${soft.x}px, ${soft.y}px) translate(-50%, -50%)`;
        });

        const interactive = 'a, button, input, textarea, .service-card, .project__link, .stack__list li';
        document.addEventListener('pointerover', (e) => {
            if (e.target.closest(interactive)) document.body.classList.add('cursor-hover');
        });
        document.addEventListener('pointerout', (e) => {
            if (e.target.closest(interactive)) document.body.classList.remove('cursor-hover');
        });
    }

    /* =====================================================================
       NAVBAR
       ===================================================================== */
    function setupNavbar() {
        const navbar = $('#navbar');
        if (!navbar) return;
        const onScroll = () => {
            const y = window.scrollY;
            navbar.classList.toggle('is-scrolled', y > 40);
            // Le hero a un fond sombre : la navbar y reste claire.
            // Au-dela, on repasse a la version editorial creme.
            const hero = document.querySelector('#accueil');
            const heroH = hero ? hero.offsetHeight : window.innerHeight;
            navbar.classList.toggle('is-dark', y < heroH * 0.62);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        onScroll();
    }

    /* =====================================================================
       PROGRESSION DE SCROLL + IMPULSION DE GLITCH
       ===================================================================== */
    function setupScrollProgress() {
        scrollProgressEl = $('#scroll-progress-bar');
        let last = window.scrollY;
        let ticking = false;

        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? window.scrollY / max : 0;
            if (scrollProgressEl) scrollProgressEl.style.width = (p * 100).toFixed(2) + '%';

            const delta = Math.abs(window.scrollY - last);
            last = window.scrollY;
            if (scene && delta > 28) {
                scene.glitchTarget = Math.min(1, (delta - 28) / 70);
            }
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });

        update();
    }

    /* =====================================================================
       ANCRES
       ===================================================================== */
    function setupAnchorLinks() {
        $$('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                const id = a.getAttribute('href');
                if (!id || id === '#') return;
                const target = document.querySelector(id);
                if (!target) return;
                e.preventDefault();
                scrollToTarget(target);
            });
        });
    }

    /* =====================================================================
       RÉVÉLATION SANS WEBGL / CONTENU STATIQUE
       ===================================================================== */
    function setupRevealOnLoad() {
        if (scene) return;
        if (window.gsap) gsap.set('[data-reveal]', { opacity: 1, y: 0 });
        else document.querySelectorAll('[data-reveal]')
            .forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    }

    /* =====================================================================
       FORMULAIRE DE CONTACT
       ===================================================================== */
    function setupContactForm() {
        const form = $('#contact-form');
        if (!form) return;
        const status = $('#form-status');

        const showError = (name, message) => {
            const input = form.querySelector(`#${name}`);
            const slot = form.querySelector(`[data-error-for="${name}"]`);
            const group = input?.closest('.form-group');
            group?.classList.add('is-invalid');
            input?.setAttribute('aria-invalid', 'true');
            if (slot) {
                slot.textContent = message;
                slot.classList.add('is-visible');
            }
        };

        const clearError = (name) => {
            const input = form.querySelector(`#${name}`);
            const slot = form.querySelector(`[data-error-for="${name}"]`);
            input?.closest('.form-group')?.classList.remove('is-invalid');
            input?.removeAttribute('aria-invalid');
            if (slot) {
                slot.textContent = '';
                slot.classList.remove('is-visible');
            }
        };

        ['name', 'email', 'message'].forEach((n) => {
            form.querySelector(`#${n}`)?.addEventListener('input', () => clearError(n));
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const message = form.querySelector('#message').value.trim();

            let ok = true;
            if (name.length < 2) { showError('name', 'Indiquez votre nom.'); ok = false; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showError('email', 'Email invalide.'); ok = false; }
            if (message.length < 10) { showError('message', 'Un peu plus de détails (10 caractères min).'); ok = false; }

            if (!ok) {
                status.textContent = 'Merci de corriger les champs signalés.';
                status.classList.remove('is-success', 'is-error');
                status.classList.add('is-error');
                // Le focus va directement au premier champ fautif
                const firstBad = form.querySelector('[aria-invalid="true"]');
                if (firstBad) firstBad.focus();
                return;
            }

            const subject = encodeURIComponent(`Nouveau message — ${name}`);
            const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
            window.location.href = `mailto:smedoune16@gmail.com?subject=${subject}&body=${body}`;

            status.textContent = 'Votre application de messagerie est ouverte. Répondez directement à smedoune16@gmail.com si besoin.';
            status.classList.remove('is-success', 'is-error');
            status.classList.add('is-success');
            form.reset();
        });
    }

    /* =====================================================================
       DÉMARRAGE
       ===================================================================== */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
