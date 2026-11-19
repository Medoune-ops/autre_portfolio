"use client";

import { NAV_LINKS, PROFILE, PROJECTS, SKILL_GROUPS, SPLINE_SCENE, STATS } from "@/data/portfolio";
import { SplineScene } from "@/components/ui/splite";
import BiteMark from "@/components/ui/BiteMark";
import { ParticleText } from "@/components/ui/particle-text";
import { ToolWheel } from "@/components/ui/tool-wheel";

const SKILL_WHEEL_BASE = [
  {
    label: "Front-end",
    path: "M8.5 6.5 3.5 12l5 5.5 1.5-1.4L6.4 12 10 7.9Zm7 0-1.5 1.4L17.6 12 14 16.1l1.5 1.4 5-5.5ZM11 20l-1.8-.7 3.8-15.3 1.8.7Z",
  },
  {
    label: "3D & motion",
    path: "M12 2 3 7v10l9 5 9-5V7Zm0 2.2 6.8 3.8L12 11.8 5.2 8ZM5 9.7l6 3.3v6.6l-6-3.3Zm8 9.9v-6.6l6-3.3v6.6Z",
  },
  {
    label: "Outils",
    path: "M21.3 7.4a6 6 0 0 1-8 7.7l-6.8 6.8a2 2 0 0 1-2.8-2.8l6.8-6.8a6 6 0 0 1 7.7-8l-3.2 3.2 2.1 2.1 3.2-3.2Z",
  },
];

// Neuf éléments ou plus pour que chaque emplacement visible soit unique.
const SKILL_WHEEL_ITEMS = [...SKILL_WHEEL_BASE, ...SKILL_WHEEL_BASE, ...SKILL_WHEEL_BASE];

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
                  color="#EAF6FF"
                  particleColor="#EAF6FF"
                  maxDimension={420}
                  size={1.15}
                  randomness={1.4}
                  depth={2.2}
                />
              </h1>
              <p className="mt-3">
                <ParticleText
                  text={"Développeur front-end &\nexpériences 3D"}
                  className="h-[56px] w-full max-w-[520px] sm:h-[72px]"
                  font='600 56px system-ui, -apple-system, "Segoe UI", sans-serif'
                  color="#00E5FF"
                  particleColor="#00E5FF"
                  maxDimension={520}
                  size={1.1}
                  randomness={1.2}
                  depth={2.0}
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

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map((project) => (
                <li key={project.title}>
                  <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-card/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon/40 hover:bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold leading-snug text-ice">{project.title}</h3>
                      <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground">
                        {project.year}
                      </span>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
                    <ul className="mt-6 flex flex-wrap gap-2" aria-label={`Technologies — ${project.title}`}>
                      {project.tags.map((tag) => (
                        <li key={tag} className="rounded-full border border-neon/20 bg-neon/5 px-2.5 py-1 text-[11px] text-neon/90">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ul>

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
                background="#0A0F1C"
                surface="#111827"
                color="#EAF6FF"
                mutedColor="rgba(234,246,255,0.6)"
                accent="#00E5FF"
                signal="#1E90FF"
                lineColor="rgba(255,255,255,0.12)"
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
