"use client";

import { NAV_LINKS, PROFILE, SKILL_GROUPS, SPLINE_SCENE, STATS } from "@/data/portfolio";
import { SplineScene } from "@/components/ui/splite";
import BiteMark from "@/components/ui/BiteMark";
import { ParticleText } from "@/components/ui/particle-text";
import { ToolWheel } from "@/components/ui/tool-wheel";
import { FerrisWheelGallery } from "@/components/ui/ferris-wheel-gallery";

const PROJECT_GALLERY_ITEMS = [
  {
    id: "portfolio-3d",
    title: "Portfolio 3D immersif",
    discipline: "Expérience 3D / WebGL",
    year: "2026",
    alt: "Formes abstraites 3D aux tons cyan et violet",
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "hero-spline",
    title: "Hero Spline interactive",
    discipline: "Scène 3D temps réel",
    year: "2026",
    alt: "Écran affichant du code dans une ambiance sombre",
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "systeme-neon",
    title: "Système visuel néon",
    discipline: "Design system & Motion",
    year: "2025",
    alt: "Lumières néon cyan dans un environnement sombre",
    src: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80",
  },
];

const SKILL_WHEEL_BASE = [
  {
    label: "Langages",
    path: "M8.5 6.5 3.5 12l5 5.5 1.5-1.4L6.4 12 10 7.9Zm7 0-1.5 1.4L17.6 12 14 16.1l1.5 1.4 5-5.5Z",
  },
  {
    label: "Frameworks & bibliothèques",
    path: "M12 2 3 7v10l9 5 9-5V7Zm0 2.2 6.8 3.8L12 11.8 5.2 8ZM5 9.7l6 3.3v6.6l-6-3.3Zm8 9.9v-6.6l6-3.3v6.6Z",
  },
  {
    label: "Backend & API",
    path: "M4 4h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 9h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Zm2-6.5v1.8h1.8V6.5Zm3 0v1.8h1.8V6.5ZM6 15.5v1.8h1.8v-1.8Zm3 0v1.8h1.8v-1.8Z",
  },
  {
    label: "Mobile",
    path: "M8 2.5h8A2.5 2.5 0 0 1 18.5 5v14A2.5 2.5 0 0 1 16 21.5H8A2.5 2.5 0 0 1 5.5 19V5A2.5 2.5 0 0 1 8 2.5Zm0 2.5v14h8V5Zm2.8 11.8h2.4v1.8h-2.4Z",
  },
  {
    label: "Bases de données",
    path: "M12 2c-4.97 0-9 1.57-9 3.5v13c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5v-13C21 3.57 16.97 2 12 2Zm0 2c4.2 0 7 .99 7 1.5S16.2 7 12 7s-7-.99-7-1.5S7.8 4 12 4Zm0 15c-4.2 0-7-.99-7-1.5v-3.2c1.64 1 4.58 1.7 7 1.7s5.36-.7 7-1.7v3.2c0 .51-2.8 1.5-7 1.5Zm0-5c-4.2 0-7-.99-7-1.5v-3.2c1.64 1 4.58 1.7 7 1.7s5.36-.7 7-1.7v3.2c0 .51-2.8 1.5-7 1.5Z",
  },
  {
    label: "Infra / DevOps & outils",
    path: "M12 2.2c2.8 2 4.8 4.6 5.8 7.8l3.2 1.6-3.2 1.6c-1 3.2-3 5.8-5.8 7.8-2.8-2-4.8-4.6-5.8-7.8L3 11.6l3.2-1.6c1-3.2 3-5.8 5.8-7.8Zm0 6.3a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2ZM7 15.8l2 2-3.4 1.4Z",
  },
  {
    label: "Design",
    path: "M4 20.5 16.5 8 20 11.5 7.5 24H4Zm11.2-13.8 1.8-1.8a1.8 1.8 0 0 1 2.6 0l1 1a1.8 1.8 0 0 1 0 2.6l-1.8 1.8Z",
  },
  {
    label: "IA",
    path: "M12 1.5Q13.3 10.7 22.5 12Q13.3 13.3 12 22.5Q10.7 13.3 1.5 12Q10.7 10.7 12 1.5Z",
  },
];

// Neuf éléments ou plus pour que chaque emplacement visible soit unique.
const SKILL_WHEEL_ITEMS = [...SKILL_WHEEL_BASE, SKILL_WHEEL_BASE[0]];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const CONTAINER = "mx-auto w-full max-w-6xl px-6 lg:px-8";

export function PortfolioContent({ active = true }: { active?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent font-sans text-ice antialiased selection:bg-neon/30">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/70 backdrop-blur-xl">
        <div className={`${CONTAINER} flex items-center justify-between gap-4 py-4`}>
          <a
            href="#accueil"
            className={`flex items-center gap-2 text-sm font-semibold tracking-tight ${FOCUS}`}
            aria-label={`Retour à l'accueil — ${PROFILE.name}`}
          >
            <span className="h-2 w-2 rounded-full bg-neon shadow-[0_0_12px_2px_rgba(0,229,255,0.65)]" aria-hidden="true" />
            {PROFILE.name}
          </a>
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-3 text-[11px] sm:gap-7 sm:text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={`rounded-md text-muted-foreground transition-colors hover:text-ice ${FOCUS}`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section
          id="accueil"
          aria-labelledby="accueil-titre"
          className="relative flex min-h-screen items-center overflow-hidden py-24"
        >
          {/* Scène 3D : occupe toute la hauteur du héro, cadrée à droite sur grand écran. */}
          <div
            className="absolute inset-x-0 bottom-0 h-[54%] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-auto lg:aspect-[5/6]"
            role="img"
            aria-label="Scène 3D interactive présentant le travail de Medoune"
          >
            <SplineScene scene={SPLINE_SCENE} className="h-full w-full" active={active} />
          </div>

          {/* Voiles de lisibilité : denses à gauche sous le texte, transparents à droite. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/95 via-bg/80 to-bg/40 lg:bg-gradient-to-r lg:from-bg/95 lg:via-bg/70 lg:to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent"
          />

          <div className={`${CONTAINER} pointer-events-none relative z-10`}>
            <div className="pointer-events-auto max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
                </span>
                {PROFILE.availability}
              </p>

              <h1 id="accueil-titre" className="mt-6">
                <ParticleText
                  text={PROFILE.name}
                  className="h-[64px] w-full max-w-[520px] sm:h-[88px] lg:h-[112px]"
                  font='700 120px system-ui, -apple-system, "Segoe UI", sans-serif'
                  color="#020617"
                  particleColor="#020617"
                  maxDimension={420}
                  size={1.3}
                  randomness={1.2}
                  depth={2.0}
                />
              </h1>
              <p className="mt-3">
                <ParticleText
                  text={"Développeur front-end &\nexpériences 3D"}
                  className="h-[56px] w-full max-w-[520px] sm:h-[72px]"
                  font='600 56px system-ui, -apple-system, "Segoe UI", sans-serif'
                  color="#020617"
                  particleColor="#020617"
                  maxDimension={520}
                  size={1.25}
                  randomness={1.0}
                  depth={1.8}
                />
              </p>
              <p className="mt-6 text-base leading-relaxed text-ice/90 sm:text-lg">{PROFILE.tagline}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{PROFILE.bio}</p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#projets"
                  className={`rounded-full bg-neon px-6 py-3 text-sm font-semibold text-bg shadow-[0_0_28px_-6px_rgba(0,229,255,0.8)] transition hover:bg-ice ${FOCUS}`}
                >
                  Voir les projets
                </a>
                <a
                  href="#contact"
                  className={`rounded-full border border-white/15 bg-bg/40 px-6 py-3 text-sm font-medium text-ice backdrop-blur transition hover:border-neon/50 hover:bg-white/5 ${FOCUS}`}
                >
                  Me contacter
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PROJETS */}
        <section id="projets" aria-labelledby="projets-titre" className="relative border-t border-white/10 py-20 sm:py-28">
          <div aria-hidden="true" className="pointer-events-none absolute top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-neon2/10 blur-[120px]" />
          <div className={`${CONTAINER} relative`}>
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.22em] text-neon uppercase">Sélection</p>
              <h2 id="projets-titre" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Projets récents</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Des expériences pensées pour être rapides, accessibles et visuellement cohérentes — de la scène 3D au design system.
              </p>
            </div>

            <div className="mt-12">
              <FerrisWheelGallery
                items={PROJECT_GALLERY_ITEMS}
                aria-label="Galerie des projets récents"
              />
            </div>

            <div className="mt-14 grid items-center gap-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neon/10 via-card/60 to-neon2/10 p-8 backdrop-blur sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:gap-14">
              <div className="max-w-md">
                <p className="text-xs font-medium tracking-[0.22em] text-neon uppercase">Signature</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Une marque, une morsure</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Un champ de formes animé par un shader WebGPU, découpé par un masque SVG : les vagues neon ne
                  se révèlent qu&apos;à l&apos;intérieur de la morsure. Le même langage graphique appliqué à tout
                  le portfolio.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Techniques du visuel">
                  {["Masque SVG", "Shader WebGPU", "React Bits"].map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-neon/20 bg-neon/5 px-2.5 py-1 text-[11px] text-neon/90"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px]">
                <BiteMark size={320} />
              </div>
            </div>
          </div>
        </section>

        {/* COMPÉTENCES */}
        <section
          id="competences"
          aria-label="Compétences"
          className="relative border-t border-white/10 py-20 sm:py-28"
        >
          <div className={`${CONTAINER}`}>
            <div className="h-[440px] w-full sm:h-[540px] lg:h-[620px]">
              <ToolWheel
                items={SKILL_WHEEL_ITEMS}
                eyebrow="EXPERTISE"
                title="Compétences"
                subtitle="Les technologies et outils que j’utilise pour concevoir des interfaces rapides, immersives et cohérentes."
                background="#f1f5f9"
                surface="#ffffff"
                color="#0f172a"
                mutedColor="rgba(15,23,42,0.55)"
                accent="#0891b2"
                signal="#0284c7"
                lineColor="rgba(15,23,42,0.12)"
                frame={false}
                autoplay
                pauseOnHover
              />
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {SKILL_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="rounded-2xl border border-white/10 bg-card/70 p-6 backdrop-blur transition hover:border-neon2/40"
                >
                  <h3 className="text-sm font-semibold tracking-wide text-ice uppercase">{group.title}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li key={item} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <dl className="mt-8 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-gradient-to-r from-neon/10 via-card/60 to-neon2/10 py-6 backdrop-blur">
              {STATS.map((stat) => (
                <div key={stat.label} className="px-3 text-center sm:px-6">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-2xl font-semibold text-ice sm:text-3xl">{stat.value}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground sm:text-xs">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CONTACT / FOOTER */}
        <section id="contact" aria-labelledby="contact-titre" className="relative border-t border-white/10 py-20 sm:py-28">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-neon2/10 to-transparent" />
          <div className={`${CONTAINER} relative`}>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-8 text-center backdrop-blur sm:p-14">
              <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-neon/15 blur-[100px]" />
              <div className="relative">
                <p className="text-xs font-medium tracking-[0.22em] text-neon uppercase">Contact</p>
                <h2 id="contact-titre" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Travaillons ensemble</h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Un projet, une idée ou simplement envie d&apos;échanger sur la 3D et le front-end ? Écrivez-moi, je réponds rapidement.
                </p>
                <div className="mt-8 flex flex-col items-center gap-5">
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className={`inline-flex items-center gap-2 rounded-full bg-neon px-7 py-3.5 text-sm font-semibold text-bg shadow-[0_0_32px_-8px_rgba(0,229,255,0.9)] transition hover:bg-ice ${FOCUS}`}
                  >
                    {PROFILE.email}
                    <span aria-hidden="true">→</span>
                  </a>
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon" aria-hidden="true" />
                    {PROFILE.availability}
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row">
              <p>
                © {year} {PROFILE.name}. Tous droits réservés.
              </p>
              <a href="#accueil" className={`rounded-md transition-colors hover:text-ice ${FOCUS}`}>
                Retour en haut ↑
              </a>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
