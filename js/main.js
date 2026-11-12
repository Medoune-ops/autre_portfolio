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

        // Découpe du texte AVANT le préloader : le hero est déjà masqué
        // quand le rideau s'ouvre, pas de flash.
        if (window.Choreography) Choreography.prepareText();

        // Scroll fluide + ScrollTrigger
        setupSmoothScroll();
        gsap.registerPlugin(ScrollTrigger);

        // Scène 3D
        const canvas = $('#gl-canvas');
        if (canvas && window.Scene3D && !REDUCED) {
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
    }

    /* =====================================================================
       SCROLL FLUIDE (LENIS) + GSAP
       ===================================================================== */
    function setupSmoothScroll() {
        if (REDUCED || !window.Lenis) {
            document.documentElement.style.scrollBehavior = 'smooth';
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
        gsap.ticker.add(() => {
            if (scene) scene.render();
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
            stopMessages();
            document.body.classList.remove('is-loading');
            document.body.classList.add('scene-ready');

            if (scene) {
                Choreography.init(scene);
                Choreography.playIntro();

                // Axones : le cerveau se connecte aux infos de la page
                const targets = $$('[data-neuron]');
                if (targets.length) scene.registerNeuronTargets(targets);

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
        // ressources tierces. On se base sur la texture 3D + les polices,
        // avec une durée minimale de marque.
        const assetsReady = scene ? scene.photoReady : Promise.resolve(false);
        const brainReady = scene ? scene.buildBrain() : Promise.resolve(false);
        const fontsReady = (document.fonts && document.fonts.ready)
            ? document.fonts.ready.catch(() => {})
            : Promise.resolve();

        Promise.all([assetsReady, brainReady, fontsReady]).then(() => {
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
                ScrollTrigger.refresh();
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
                    ScrollTrigger.refresh();
                    if (window.Choreography) Choreography.refreshAnchors();
                }, 140);
            }, { once: true });
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

        const open = () => {
            menu.classList.add('is-open');
            menu.setAttribute('aria-hidden', 'false');
            btn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll');
            if (lenis) lenis.stop();
        };
        const shut = () => {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
            if (lenis) lenis.start();
        };

        btn.addEventListener('click', open);
        close?.addEventListener('click', shut);
        links.forEach((l) => l.addEventListener('click', shut));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) shut();
        });
    }

    /* =====================================================================
       CURSEUR PERSONNALISÉ
       ===================================================================== */
    function setupCursor() {
        if (!HOVER_OK || REDUCED) return;

        const cursor = $('#cursor');
        const dot = $('.cursor__dot', cursor);
        const ring = $('.cursor__ring', cursor);
        if (!cursor) return;

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
            navbar.classList.toggle('is-scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
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
        gsap.set('[data-reveal]', { opacity: 1, y: 0 });
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
            if (slot) {
                slot.textContent = message;
                slot.classList.add('is-visible');
            }
        };

        const clearError = (name) => {
            const input = form.querySelector(`#${name}`);
            const slot = form.querySelector(`[data-error-for="${name}"]`);
            input?.closest('.form-group')?.classList.remove('is-invalid');
            if (slot) slot.classList.remove('is-visible');
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
                status.className = 'contact-form__note is-error';
                return;
            }

            const subject = encodeURIComponent(`Nouveau message — ${name}`);
            const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
            window.location.href = `mailto:smedoune16@gmail.com?subject=${subject}&body=${body}`;

            status.textContent = 'Votre client mail est ouvert. Répondez directement à smedoune16@gmail.com si besoin.';
            status.className = 'contact-form__note is-success';
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
