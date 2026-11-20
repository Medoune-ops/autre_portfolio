"use client";

import { NAV_LINKS, PROFILE, SKILL_GROUPS, SPLINE_SCENE, STATS } from "@/data/portfolio";
import { SplineScene } from "@/components/ui/splite";
import BiteMark from "@/components/ui/BiteMark";
import StrokeText from "@/components/ui/StrokeText";
import BlurText from "@/components/ui/BlurText";
import TextLoop from "@/components/ui/TextLoop";
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

const ALL_STACKS_TEXT = SKILL_GROUPS.flatMap((group) => group.items).join(" ✦ ");

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const CONTAINER = "mx-auto w-full max-w-6xl px-6 lg:px-8";

type SectionTitleProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  id?: string;
  className?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  fillDuration?: number;
  stagger?: number;
  trigger?: "mount" | "scroll";
  showOverlay?: boolean;
};

function SectionTitle({
  text,
  as: Tag = "h2",
  id,
  className = "",
  fontSize = 56,
  fontWeight = 700,
  letterSpacing = -2,
  strokeWidth = 1.4,
  drawDuration = 2.0,
  fillDelay = 0.7,
  fillDuration = 2.8,
  stagger = 0.05,
  trigger = "scroll",
  showOverlay = true,
}: SectionTitleProps) {
  return (
    <Tag id={id} className={`relative ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="block">
        <StrokeText
          text={text}
          strokeColor="transparent"
          strokeWidth={0}
          fillColor="#94a3b8"
          fillMode="fade"
          drawDuration={0.01}
          fillDelay={0}
          trigger="mount"
          fontSize={fontSize}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
          hoverRedraw={false}
          shadow={false}
        />
      </span>
      {showOverlay && (
        <span aria-hidden="true" className="absolute inset-0 block">
          <StrokeText
            text={text}
            strokeColor="#94a3b8"
            fillColor="#020617"
            strokeStyle="solid"
            strokeWidth={strokeWidth}
            dashLength={10}
            drawDuration={drawDuration}
            fillDelay={fillDelay}
            fillDuration={fillDuration}
            stagger={stagger}
            ease="power2.out"
            trigger={trigger}
            fillMode="wipe"
            wipeFrom="left"
            fontSize={fontSize}
            fontWeight={fontWeight}
            letterSpacing={letterSpacing}
            marching={false}
            hoverRedraw={true}
            shadow={false}
          />
        </span>
      )}
    </Tag>
  );
}

export function PortfolioContent({ active = true }: { active?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent font-sans text-ice antialiased selection:bg-neon/20">
      <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-bg/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <div className={`${CONTAINER} flex items-center justify-between gap-4 py-3.5 sm:py-4`}>
          <a
            href="#accueil"
            className={`group flex items-center gap-2.5 rounded-md text-sm font-semibold tracking-tight text-ice transition-colors hover:text-neon ${FOCUS}`}
            aria-label={`Retour à l'accueil — ${PROFILE.name}`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-neon shadow-[0_0_14px_3px_rgba(8,145,178,0.45)] transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            {PROFILE.name}
          </a>
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`rounded-full px-3 py-1.5 text-ice/75 transition-all duration-200 hover:bg-white/70 hover:text-ice hover:shadow-sm ${FOCUS}`}
                  >
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

          {/* Voile de lisibilité : dense sous le texte, plus léger à droite pour laisser voir la scène 3D. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/[0.88] via-bg/[0.78] to-bg/45 lg:bg-gradient-to-r lg:from-bg/[0.92] lg:via-bg/[0.72] lg:to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg/60 to-transparent"
          />

          <div className={`${CONTAINER} pointer-events-none relative z-10`}>
            <div className="pointer-events-auto max-w-xl">
              <p className="inline-flex items-center gap-2.5 rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-medium text-ice/85 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon" />
                </span>
                <BlurText as="span" text={PROFILE.availability} delay={80} animateBy="words" direction="top" />
              </p>

              <SectionTitle
                as="h1"
                id="accueil-titre"
                text={PROFILE.name}
                className="mt-7"
                fontSize={128}
                fontWeight={800}
                letterSpacing={-4}
                strokeWidth={1.6}
                drawDuration={2.2}
                fillDelay={0.8}
                fillDuration={3.2}
                stagger={0.06}
                trigger="mount"
                showOverlay={active}
              />
              <SectionTitle
                as="p"
                text={PROFILE.role}
                className="mt-3"
                fontSize={54}
                fontWeight={700}
                letterSpacing={-1}
                strokeWidth={1.2}
                drawDuration={2.0}
                fillDelay={1.0}
                fillDuration={3.0}
                stagger={0.03}
                trigger="mount"
                showOverlay={active}
              />
              <BlurText
                as="p"
                text={PROFILE.tagline}
                className="mt-7 max-w-2xl text-base leading-relaxed text-ice/90 sm:text-lg"
                delay={60}
                animateBy="words"
                direction="top"
              />
              <BlurText
                as="p"
                text={PROFILE.bio}
                className="mt-4 max-w-2xl text-base leading-relaxed text-ice/80 sm:text-lg"
                delay={40}
                animateBy="words"
                direction="top"
              />

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#projets"
                  className={`group inline-flex items-center justify-center rounded-full bg-neon px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(8,145,178,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neon2 hover:shadow-[0_16px_36px_-12px_rgba(8,145,178,0.75)] active:translate-y-0 ${FOCUS}`}
                >
                  Voir les projets
                  <span aria-hidden="true" className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </a>
                <a
                  href="#contact"
                  className={`inline-flex items-center justify-center rounded-full border border-slate-900/15 bg-white/70 px-7 py-3.5 text-sm font-semibold text-ice shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-neon/40 hover:bg-white hover:shadow-md active:translate-y-0 ${FOCUS}`}
                >
                  Me contacter
                </a>
              </div>
            </div>
          </div>

          <a
            href="#projets"
            className={`pointer-events-auto absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 rounded-full px-3 py-2 text-xs font-medium tracking-[0.18em] text-ice/60 uppercase transition-colors hover:text-ice sm:inline-flex ${FOCUS}`}
            aria-label="Défiler vers les projets"
          >
            <span>Défiler</span>
            <span aria-hidden="true" className="h-8 w-px bg-gradient-to-b from-neon/70 to-transparent" />
          </a>
        </section>

        {/* STACKS */}
        <section aria-label="Technologies maîtrisées" className="relative overflow-hidden border-t border-slate-900/10 py-8 sm:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg/[0.72]" />
          <div className="relative">
            <TextLoop
              text={ALL_STACKS_TEXT}
              shape="wave"
              speed={80}
              direction="forward"
              separator="✦"
              curviness={40}
              tilt={0}
              fontSize={38}
              fontWeight={700}
              letterSpacing={1.5}
              uppercase
              color="#f8fafc"
              ribbon
              ribbonColor="#334155"
              ribbonWidth={96}
              edgeFade={0.12}
              cross={false}
              draggable={false}
              scrollBoost={0}
              outline={false}
              pauseOnHover
            />
          </div>
        </section>

        {/* PROJETS */}
        <section id="projets" aria-labelledby="projets-titre" className="relative border-t border-slate-900/10 py-24 sm:py-32">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg/[0.72]" />
          <div aria-hidden="true" className="pointer-events-none absolute top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-neon2/10 blur-[120px]" />
          <div className={`${CONTAINER} relative`}>
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.22em] text-neon uppercase">Sélection</p>
              <SectionTitle
                as="h2"
                id="projets-titre"
                text="Projets récents"
                className="mt-3 max-w-xl"
                fontSize={52}
                fontWeight={700}
                letterSpacing={-1.5}
                strokeWidth={1.3}
                drawDuration={1.8}
                fillDelay={0.5}
                fillDuration={2.4}
                stagger={0.04}
                trigger="scroll"
              />
              <BlurText
                as="p"
                text="Des expériences pensées pour être rapides, accessibles et visuellement cohérentes — de la scène 3D au design system."
                className="mt-4 text-base leading-relaxed text-ice/80 sm:text-lg"
                delay={50}
                animateBy="words"
                direction="top"
              />
            </div>

            <div className="mt-12">
              <FerrisWheelGallery
                items={PROJECT_GALLERY_ITEMS}
                aria-label="Galerie des projets récents"
              />
            </div>

            <div className="mt-16 grid items-center gap-10 overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-br from-white/80 via-neon/5 to-neon2/10 p-8 shadow-soft backdrop-blur-sm transition-shadow duration-300 hover:shadow-glow sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:gap-14">
              <div className="max-w-md">
                <p className="text-sm font-medium tracking-[0.22em] text-neon uppercase">Signature</p>
                <SectionTitle
                  as="h3"
                  text="Une marque, une morsure"
                  className="mt-3 max-w-md"
                  fontSize={42}
                  fontWeight={700}
                  letterSpacing={-1}
                  strokeWidth={1.2}
                  drawDuration={1.8}
                  fillDelay={0.5}
                  fillDuration={2.4}
                  stagger={0.04}
                  trigger="scroll"
                />
                <BlurText
                  as="p"
                  text="Un champ de formes animé par un shader WebGPU, découpé par un masque SVG : les vagues neon ne se révèlent qu'à l'intérieur de la morsure. Le même langage graphique appliqué à tout le portfolio."
                  className="mt-4 text-base leading-relaxed text-ice/80 sm:text-lg"
                  delay={40}
                  animateBy="words"
                  direction="top"
                />
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Techniques du visuel">
                  {["Masque SVG", "Shader WebGPU", "React Bits"].map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-neon/25 bg-white/70 px-3 py-1.5 text-xs font-semibold text-neon shadow-sm"
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
          className="relative border-t border-slate-900/10 py-24 sm:py-32"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg/[0.72]" />
          <div className={`${CONTAINER} relative`}>
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <p className="text-sm font-medium tracking-[0.22em] text-neon uppercase">Expertise</p>
              <SectionTitle
                as="h2"
                text="Compétences"
                className="mt-3"
                fontSize={52}
                fontWeight={700}
                letterSpacing={-1.5}
                strokeWidth={1.3}
                drawDuration={1.8}
                fillDelay={0.5}
                fillDuration={2.4}
                stagger={0.04}
                trigger="scroll"
              />
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ice/80 sm:text-lg">
                Les technologies et outils que j’utilise pour concevoir des interfaces rapides, immersives et cohérentes.
              </p>
            </div>
            <div className="h-[440px] w-full sm:h-[540px] lg:h-[620px]">
              <ToolWheel
                items={SKILL_WHEEL_ITEMS}
                eyebrow=""
                title=""
                subtitle=""
                background="#f1f5f9"
                surface="#ffffff"
                color="#0f172a"
                mutedColor="rgba(15,23,42,0.72)"
                accent="#0891b2"
                signal="#0284c7"
                lineColor="rgba(15,23,42,0.12)"
                frame={false}
                autoplay
                pauseOnHover
              />
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {SKILL_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="group rounded-2xl border border-slate-900/10 bg-white/75 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-neon/30 hover:shadow-glow"
                >
                  <h3 className="text-sm font-semibold tracking-wide text-ice uppercase">{group.title}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-lg border border-slate-900/10 bg-white/80 px-3 py-1.5 text-sm font-medium text-ice/80 transition-colors duration-200 group-hover:border-slate-900/15"
                      >
                        <BlurText
                          as="span"
                          text={item}
                          delay={40}
                          animateBy="words"
                          direction="top"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-slate-900/10 rounded-2xl border border-slate-900/10 bg-white/75 py-6 shadow-soft backdrop-blur-sm">
              {STATS.map((stat) => (
                <div key={stat.label} className="px-4 text-center sm:px-6">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-3xl font-semibold tracking-tight text-ice sm:text-4xl">{stat.value}</span>
                    <BlurText
                      as="span"
                      text={stat.label}
                      className="mt-2 block text-sm font-medium text-ice/70 sm:text-base"
                      delay={80}
                      animateBy="words"
                      direction="top"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CONTACT / FOOTER */}
        <section id="contact" aria-labelledby="contact-titre" className="relative border-t border-slate-900/10 py-24 sm:py-32">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg/[0.72]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-neon2/10 to-transparent" />
          <div className={`${CONTAINER} relative`}>
            <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white/80 p-8 text-center shadow-soft backdrop-blur-sm sm:p-14">
              <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-neon/15 blur-[100px]" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
              <div className="relative">
                <p className="text-sm font-medium tracking-[0.22em] text-neon uppercase">Contact</p>
                <SectionTitle
                  as="h2"
                  id="contact-titre"
                  text="Travaillons ensemble"
                  className="mt-3"
                  fontSize={52}
                  fontWeight={700}
                  letterSpacing={-1.5}
                  strokeWidth={1.3}
                  drawDuration={1.8}
                  fillDelay={0.5}
                  fillDuration={2.4}
                  stagger={0.04}
                  trigger="scroll"
                />
                <BlurText
                  as="p"
                  text="Un projet, une idée ou simplement envie d'échanger sur la 3D et le front-end ? Écrivez-moi, je réponds rapidement."
                  className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ice/80 sm:text-lg"
                  delay={50}
                  animateBy="words"
                  direction="top"
                />
                <div className="mt-9 flex flex-col items-center gap-5">
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className={`inline-flex items-center gap-2 rounded-full bg-neon px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(8,145,178,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neon2 hover:shadow-[0_16px_36px_-12px_rgba(8,145,178,0.75)] active:translate-y-0 ${FOCUS}`}
                  >
                    {PROFILE.email}
                    <span aria-hidden="true">→</span>
                  </a>
                  <p className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-sm text-ice/80 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon" aria-hidden="true" />
                    <BlurText as="span" text={PROFILE.availability} delay={80} animateBy="words" direction="top" />
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-900/10 pt-8 text-sm text-ice/75 sm:flex-row">
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
