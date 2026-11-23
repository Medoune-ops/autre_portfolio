"use client";

import { useState } from "react";
import { FORMATION_BOOKS, NAV_LINKS, PROFILE, SKILL_DOMAINS, SKILL_GROUPS, SPLINE_SCENE } from "@/data/portfolio";
import { SplineScene } from "@/components/ui/splite";
import BiteMark from "@/components/ui/BiteMark";
import StrokeText from "@/components/ui/StrokeText";
import BlurText from "@/components/ui/BlurText";
import TextLoop from "@/components/ui/TextLoop";
import { ToolWheel, type ToolWheelItem } from "@/components/ui/tool-wheel";
import { StepsPath, type PathStep } from "@/components/ui/cd-steps-path";
import { FerrisWheelGallery } from "@/components/ui/ferris-wheel-gallery";
import BooksShowcase from "@/components/ui/BooksShowcase";
import ContactWithGlobe from "@/components/ui/contact-with-globe";
import { CVDownloadDropdown } from "@/components/ui/cv-download-dropdown";
import {
  siAngular,
  siClaude,
  siCss,
  siDocker,
  siExpo,
  siExpress,
  siFigma,
  siFlutter,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siLaravel,
  siMongodb,
  siMysql,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPrisma,
  siPython,
  siReact,
  siTailwindcss,
  siTypescript,
  siVercel,
} from "simple-icons";
import {
  CloudCog,
  Code2,
  Database,
  PenTool,
  ServerCog,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

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

// Sélection de stacks affichées dans la roue, avec leurs logos officiels.
const STACK_WHEEL_ITEMS: ToolWheelItem[] = [
  { label: "HTML5", description: "Structure des pages web", path: siHtml5.path, fillRule: "nonzero" },
  { label: "CSS", description: "Mise en forme et design", path: siCss.path, fillRule: "nonzero" },
  { label: "JavaScript", description: "Langage du web", path: siJavascript.path, fillRule: "nonzero" },
  { label: "TypeScript", description: "JavaScript typé", path: siTypescript.path, fillRule: "nonzero" },
  { label: "Python", description: "Langage polyvalent", path: siPython.path, fillRule: "nonzero" },
  { label: "React", description: "Bibliothèque d'interface", path: siReact.path, fillRule: "nonzero" },
  { label: "Next.js", description: "Framework React full-stack", path: siNextdotjs.path, fillRule: "nonzero" },
  { label: "Tailwind CSS", description: "Styles utilitaires", path: siTailwindcss.path, fillRule: "nonzero" },
  { label: "Angular", description: "Framework front-end", path: siAngular.path, fillRule: "nonzero" },
  { label: "Node.js", description: "Runtime JavaScript", path: siNodedotjs.path, fillRule: "nonzero" },
  { label: "Express", description: "Framework backend minimal", path: siExpress.path, fillRule: "nonzero" },
  { label: "NestJS", description: "Backend Node.js structuré", path: siNestjs.path, fillRule: "nonzero" },
  { label: "Laravel", description: "Framework PHP", path: siLaravel.path, fillRule: "nonzero" },
  { label: "Expo", description: "Apps React Native", path: siExpo.path, fillRule: "nonzero" },
  { label: "Flutter", description: "UI mobile multiplateforme", path: siFlutter.path, fillRule: "nonzero" },
  { label: "MySQL", description: "Base de données relationnelle", path: siMysql.path, fillRule: "nonzero" },
  { label: "PostgreSQL", description: "Base de données SQL", path: siPostgresql.path, fillRule: "nonzero" },
  { label: "MongoDB", description: "Base NoSQL orientée documents", path: siMongodb.path, fillRule: "nonzero" },
  { label: "Prisma", description: "ORM pour TypeScript", path: siPrisma.path, fillRule: "nonzero" },
  { label: "Docker", description: "Conteneurisation", path: siDocker.path, fillRule: "nonzero" },
  { label: "Git", description: "Versionnage du code", path: siGit.path, fillRule: "nonzero" },
  { label: "GitHub", description: "Hébergement et CI/CD", path: siGithub.path, fillRule: "nonzero" },
  { label: "Vercel", description: "Déploiement front-end", path: siVercel.path, fillRule: "nonzero" },
  { label: "Figma", description: "Design d'interfaces", path: siFigma.path, fillRule: "nonzero" },
  { label: "Claude", description: "Assistant IA d'Anthropic", path: siClaude.path, fillRule: "nonzero" },
];

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  "Front-end": Code2,
  "Back-end & API": ServerCog,
  Mobile: Smartphone,
  "Bases de données": Database,
  "Infra / DevOps": CloudCog,
  "Design & outils": PenTool,
  IA: Sparkles,
};

const TOTAL_SKILLS = SKILL_GROUPS.reduce((total, group) => total + group.items.length, 0);

const SKILL_STEPS: PathStep[] = SKILL_DOMAINS.map((domain) => {
  const Icon = DOMAIN_ICONS[domain.title] ?? Code2;
  return {
    id: domain.title,
    title: domain.title,
    body: domain.description,
    tags: domain.stacks,
    icon: <Icon size={20} strokeWidth={1.8} aria-hidden="true" />,
  };
});

const ALL_STACKS_TEXT = SKILL_GROUPS.flatMap((group) => group.items).join(" ✦ ");

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const CONTAINER = "mx-auto w-full max-w-6xl px-6 lg:px-8";
const FULL_CONTAINER = "mx-auto w-full px-4 sm:px-6 lg:px-8";

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
          fillColor="#789a99"
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
            strokeColor="#789a99"
            fillColor="#16232c"
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
  const [activeStack, setActiveStack] = useState(0);
  const activeStackItem = STACK_WHEEL_ITEMS[activeStack] ?? STACK_WHEEL_ITEMS[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent font-sans text-ice antialiased selection:bg-neon/20">
      <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-bg/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <div className={`${CONTAINER} flex items-center justify-between gap-4 py-3.5 sm:py-4`}>
          <a
            href="#accueil"
            className={`group flex items-center rounded-md text-sm font-semibold tracking-tight text-ice transition-colors hover:text-neon ${FOCUS}`}
            aria-label={`Retour à l'accueil — ${PROFILE.name}`}
          >
            {PROFILE.name}
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
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
            <div className="hidden h-4 w-px bg-slate-900/15 sm:block" aria-hidden="true" />
            <CVDownloadDropdown variant="header" />
          </div>
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
                  className={`group inline-flex items-center justify-center rounded-full bg-neon px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(40,114,161,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neon2 hover:shadow-[0_16px_36px_-12px_rgba(40,114,161,0.75)] active:translate-y-0 ${FOCUS}`}
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
                <CVDownloadDropdown variant="hero" />
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
        <section aria-label="Technologies maîtrisées" className="relative overflow-hidden py-8 sm:py-12">
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
              color="#16232c"
              ribbon
              ribbonColor="#cbdde9"
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
        <section id="projets" aria-labelledby="projets-titre" className="relative py-24 sm:py-32">
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
                  text="Un champ de formes animé par un shader WebGPU, découpé par un masque SVG : les vagues grises ne se révèlent qu'à l'intérieur de la morsure. Le même langage graphique appliqué à tout le portfolio."
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
          className="relative py-24 sm:py-32"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg/[0.72]" />
          <div className={`${FULL_CONTAINER} relative`}>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-ice/60 shadow-sm backdrop-blur">
                Expertise
                <span className="h-3 w-px bg-slate-900/20" aria-hidden="true" />
                <span className="text-neon">Stack &amp; outils</span>
              </span>
              <SectionTitle
                as="h2"
                text="Compétences"
                className="mt-5"
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
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ice/40">
                <span>{STACK_WHEEL_ITEMS.length} technologies</span>
                <span className="h-1 w-1 rounded-full bg-slate-900/20" aria-hidden="true" />
                <span>{SKILL_GROUPS.length} catégories</span>
                <span className="h-1 w-1 rounded-full bg-slate-900/20" aria-hidden="true" />
                <span>Veille continue</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white/60 shadow-[0_30px_80px_-50px_rgba(22,35,44,0.5)] backdrop-blur-md">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(22,35,44,0.16) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  WebkitMaskImage: "radial-gradient(ellipse 72% 72% at 50% 45%, #000 18%, transparent 76%)",
                  maskImage: "radial-gradient(ellipse 72% 72% at 50% 45%, #000 18%, transparent 76%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse 58% 52% at 50% 46%, rgba(40,114,161,0.12), transparent 72%)",
                }}
              />

              <div className="relative flex items-center justify-between gap-4 border-b border-slate-900/[0.08] px-5 py-3.5 sm:px-7">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ice/60">
                    Carte des stacks
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ice/40 sm:text-[10px]">
                  <span className="hidden sm:inline">Rotation automatique</span>
                  <span className="hidden h-3 w-px bg-slate-900/10 sm:inline" aria-hidden="true" />
                  <span className="sm:hidden">{STACK_WHEEL_ITEMS.length}</span>
                  <span className="hidden sm:inline">{STACK_WHEEL_ITEMS.length} technologies</span>
                </div>
              </div>

              <div className="relative h-[60vh] min-h-[520px] w-full lg:h-[72vh]">
                <ToolWheel
                  items={STACK_WHEEL_ITEMS}
                  showDetails
                  ariaLabel="Roue des stacks"
                  onActiveChange={setActiveStack}
                  eyebrow=""
                  title=""
                  subtitle=""
                  background="transparent"
                  surface="#ffffff"
                  color="#16232c"
                  mutedColor="rgba(22,35,44,0.72)"
                  accent="#2872a1"
                  signal="#789a99"
                  lineColor="rgba(120,154,153,0.3)"
                  frame={false}
                  autoplay
                  pauseOnHover
                />
              </div>

              <div className="relative flex flex-col gap-3 border-t border-slate-900/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ice/40">Sélection</span>
                  <span className="truncate text-sm font-semibold text-ice">{activeStackItem.label}</span>
                  <span className="hidden truncate text-xs text-ice/50 md:inline">{activeStackItem.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-[2px]" aria-hidden="true">
                    {STACK_WHEEL_ITEMS.map((item, index) => (
                      <span
                        key={item.label}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          index === activeStack ? "w-4 bg-neon" : "w-[3px] bg-slate-900/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-ice/50">
                    {String(activeStack + 1).padStart(2, "0")} / {String(STACK_WHEEL_ITEMS.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-14 flex flex-col items-center gap-2 text-center">
              <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ice/40">
                Vue détaillée
              </p>
              <p className="text-xs text-ice/50">
                {TOTAL_SKILLS} compétences référencées · {SKILL_DOMAINS.length} domaines
              </p>
            </div>

            <div className="mt-6">
              <StepsPath
                steps={SKILL_STEPS}
                title="Mes stacks, domaine par domaine"
                accentColor="#cbdde9"
                autoPlay
                autoPlayInterval={4200}
              />
            </div>

          </div>
        </section>

        {/* FORMATION — chaque livre = une étape du parcours */}
        <section id="formation" aria-labelledby="formation-titre" className="relative py-24 sm:py-32">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg/[0.72]" />
          <div className={`${FULL_CONTAINER} relative`}>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-ice/60 shadow-sm backdrop-blur">
                Parcours
                <span className="h-3 w-px bg-slate-900/20" aria-hidden="true" />
                <span className="text-neon">Formation</span>
              </span>
              <SectionTitle
                as="h2"
                id="formation-titre"
                text="Mon parcours"
                className="mt-5"
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
                Chaque livre est une étape de ma formation : clique sur une couverture pour ouvrir sa fiche, puis glisse l’ouvrage pour l’explorer.
              </p>
            </div>

            <div className="relative h-[70vh] min-h-[620px] overflow-hidden rounded-3xl border border-slate-900/10 bg-white shadow-[0_30px_80px_-50px_rgba(22,35,44,0.5)] lg:h-[82vh]">
              <BooksShowcase
                books={FORMATION_BOOKS}
                heroTitle="Parcours"
                navTitle="Formation"
                themeColors={{
                  navy: "#1c5a82",
                  pink: "#2872a1",
                  cream: "#f8fafc",
                  lav: "#cbdde9",
                  peri: "#789a99",
                  bgLight: "#f8fafc",
                  bgDark: "#16232c",
                  foregroundLight: "#16232c",
                  foregroundDark: "#f8fafc",
                }}
              />
            </div>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ice/40">
              {FORMATION_BOOKS.length} étapes · {FORMATION_BOOKS[0]?.year.split(" — ")[0]} — {FORMATION_BOOKS[FORMATION_BOOKS.length - 1]?.year}
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <ContactWithGlobe
          id="contact"
          email={PROFILE.email}
          phone={PROFILE.phone}
          title="Travaillons ensemble"
          subtitle="Contact"
          description="Un projet, une idée ou simplement envie d'échanger sur la 3D et le front-end ? Écrivez-moi, je réponds rapidement."
          className="bg-bg/[0.72] py-24 sm:py-32"
        />

        {/* FOOTER */}
        <footer className={`${CONTAINER} relative flex flex-col items-center justify-between gap-5 py-10 text-sm text-ice/75 sm:flex-row`}>
          <p>
            © {year} {PROFILE.name}. Tous droits réservés.
          </p>
          <a href="#accueil" className={`rounded-md transition-colors hover:text-ice ${FOCUS}`}>
            Retour en haut ↑
          </a>
        </footer>
      </main>
    </div>
  );
}
