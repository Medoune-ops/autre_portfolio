"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function useNearViewport<T extends HTMLElement>(margin = "500px") {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin, visible]);

  return [ref, visible] as const;
}
import { FORMATION_BOOKS, NAV_LINKS, PROFILE, SKILL_DOMAINS, SKILL_GROUPS, SPLINE_SCENE } from "@/data/portfolio";
import { SplineScene } from "@/components/ui/splite";
import BiteMark from "@/components/ui/BiteMark";
import StrokeText from "@/components/ui/StrokeText";
import BlurText from "@/components/ui/BlurText";
import TextLoop from "@/components/ui/TextLoop";
import type { ToolWheelItem } from "@/components/ui/tool-wheel";
import { StepsPath, type PathStep } from "@/components/ui/cd-steps-path";
import { CVDownloadDropdown } from "@/components/ui/cv-download-dropdown";
import { PopButton } from "@/components/ui/PopButton";
import { BionicLimbs } from "@/components/ui/bionic-limbs";

const ToolWheel = dynamic(() => import("@/components/ui/tool-wheel").then((m) => m.ToolWheel), {
  ssr: false,
  loading: () => <div className="h-[62vh] min-h-[530px] w-full animate-pulse rounded-3xl bg-slate-100/70" aria-hidden="true" />,
});
const FerrisWheelGallery = dynamic(
  () => import("@/components/ui/ferris-wheel-gallery").then((m) => m.FerrisWheelGallery),
  { ssr: false, loading: () => <div className="h-[420px] w-full animate-pulse rounded-3xl bg-slate-100/70" aria-hidden="true" /> },
);
const BooksShowcase = dynamic(() => import("@/components/ui/BooksShowcase"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100/70" aria-hidden="true" />,
});
const ContactWithGlobe = dynamic(() => import("@/components/ui/contact-with-globe"), {
  ssr: false,
  loading: () => <div className="min-h-[640px] w-full animate-pulse bg-slate-100/40" aria-hidden="true" />,
});
const FuzzyGazeFooter = dynamic(
  () => import("@/components/ui/fuzzy-gaze-footer").then((m) => m.FuzzyGazeFooter),
  { ssr: false, loading: () => <div className="h-[70svh] w-full bg-[#16232c]" aria-hidden="true" /> },
);
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
  ChevronLeft,
  ChevronRight,
  CloudCog,
  Code2,
  Database,
  Menu,
  Pause,
  PenTool,
  Play,
  ServerCog,
  Smartphone,
  Sparkles,
  X,
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

const FOOTER_COLUMNS = [
  {
    title: "Navigation",
    links: [
      { label: "Accueil", href: "#accueil" },
      { label: "Projets récents", href: "#projets" },
      { label: "Compétences", href: "#competences" },
      { label: "Parcours", href: "#formation" },
    ],
  },
  {
    title: "Profil & CV",
    links: [
      { label: "Télécharger CV (FR)", href: "/cv/CV_Medoune_SECK_FR.pdf" },
      { label: "Download Resume (EN)", href: "/cv/CV_Medoune_SECK_EN.pdf" },
      { label: "Keur Massar, Dakar", href: "#contact" },
      { label: "Disponible de suite", href: "#contact" },
    ],
  },
  {
    title: "Expertises",
    links: [
      { label: "Architecture Full-Stack", href: "#competences" },
      { label: "Design UI/UX & Motion", href: "#competences" },
      { label: "3D & Performance Web", href: "#projets" },
      { label: "Intelligence Artificielle", href: "#competences" },
    ],
  },
  {
    title: "Connexion",
    links: [
      { label: "GitHub (@Medoune-ops)", href: "https://github.com/Medoune-ops" },
      { label: "Écrire un e-mail", href: `mailto:${PROFILE.email}` },
      { label: "Téléphone direct", href: `tel:${PROFILE.phone.replace(/\s+/g, "")}` },
      { label: "Retour en haut ↑", href: "#accueil" },
    ],
  },
];

export type EnrichedStackItem = ToolWheelItem & {
  domain: "Front-end" | "Back-end & API" | "Mobile" | "BDD & DevOps" | "Design & IA";
  level: string;
};

// Sélection de stacks affichées dans la roue, avec leurs logos officiels et métadonnées.
const STACK_WHEEL_ITEMS: EnrichedStackItem[] = [
  { label: "HTML5", description: "Structure sémantique, accessibilité WCAG et SEO technique", path: siHtml5.path, fillRule: "nonzero", domain: "Front-end", level: "Expert" },
  { label: "CSS3", description: "Animations fluides, Grid, Flexbox et design moderne réactif", path: siCss.path, fillRule: "nonzero", domain: "Front-end", level: "Expert" },
  { label: "JavaScript", description: "ES6+, async/await, DOM et logique applicative réactive", path: siJavascript.path, fillRule: "nonzero", domain: "Front-end", level: "Avancé" },
  { label: "TypeScript", description: "Typage strict, interfaces génériques et haute maintenabilité", path: siTypescript.path, fillRule: "nonzero", domain: "Front-end", level: "Avancé" },
  { label: "Python", description: "Automatisation, scripts data et logique backend polyvalente", path: siPython.path, fillRule: "nonzero", domain: "Back-end & API", level: "Maîtrisé" },
  { label: "React", description: "Composants modulaires, hooks avancés et architecture de pointe", path: siReact.path, fillRule: "nonzero", domain: "Front-end", level: "Expert" },
  { label: "Next.js", description: "App Router full-stack, Server Components, SSR et optimisations", path: siNextdotjs.path, fillRule: "nonzero", domain: "Front-end", level: "Expert" },
  { label: "Tailwind CSS", description: "Design systems ultra-rapides, utilitaires et micro-interactions", path: siTailwindcss.path, fillRule: "nonzero", domain: "Front-end", level: "Expert" },
  { label: "Angular", description: "Framework robuste orienté entreprise et services injectables", path: siAngular.path, fillRule: "nonzero", domain: "Front-end", level: "Maîtrisé" },
  { label: "Node.js", description: "Runtime JavaScript serveur asynchrone pour microservices et APIs", path: siNodedotjs.path, fillRule: "nonzero", domain: "Back-end & API", level: "Avancé" },
  { label: "Express", description: "APIs RESTful légères, middlewares et routage haute performance", path: siExpress.path, fillRule: "nonzero", domain: "Back-end & API", level: "Avancé" },
  { label: "NestJS", description: "Backend TypeScript modulaire, microservices et injection de dépendances", path: siNestjs.path, fillRule: "nonzero", domain: "Back-end & API", level: "Avancé" },
  { label: "Laravel", description: "Framework PHP robuste, Eloquent ORM et architecture MVC", path: siLaravel.path, fillRule: "nonzero", domain: "Back-end & API", level: "Maîtrisé" },
  { label: "Expo", description: "Applications mobiles React Native universelles iOS et Android", path: siExpo.path, fillRule: "nonzero", domain: "Mobile", level: "Avancé" },
  { label: "Flutter", description: "Interfaces mobiles natives et performantes multiplateformes", path: siFlutter.path, fillRule: "nonzero", domain: "Mobile", level: "Exploré" },
  { label: "MySQL", description: "Base relationnelle SQL, indexation et requêtes relationnelles", path: siMysql.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Avancé" },
  { label: "PostgreSQL", description: "Base relationnelle avancée, intégrité des données et JSONB", path: siPostgresql.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Avancé" },
  { label: "MongoDB", description: "Base NoSQL flexible orientée documents et pipelines d'agrégation", path: siMongodb.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Maîtrisé" },
  { label: "Prisma", description: "ORM type-safe de nouvelle génération pour TypeScript et bases SQL", path: siPrisma.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Avancé" },
  { label: "Docker", description: "Conteneurisation d'applications et environnements reproductibles", path: siDocker.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Maîtrisé" },
  { label: "Git", description: "Gestion de versions distribuée, branches et historiques rigoureux", path: siGit.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Expert" },
  { label: "GitHub", description: "Workflows CI/CD automatisés, revues de code et collaboration", path: siGithub.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Avancé" },
  { label: "Vercel", description: "Déploiement Edge continu, Serverless et monitoring temps réel", path: siVercel.path, fillRule: "nonzero", domain: "BDD & DevOps", level: "Avancé" },
  { label: "Figma", description: "Conception UI/UX, wireframes interactifs et design tokens", path: siFigma.path, fillRule: "nonzero", domain: "Design & IA", level: "Avancé" },
  { label: "Claude", description: "Intégration d'agents IA, prompts d'ingénierie et automatisation", path: siClaude.path, fillRule: "nonzero", domain: "Design & IA", level: "Avancé" },
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

const STACK_DOMAINS = [
  "Tous",
  "Front-end",
  "Back-end & API",
  "Mobile",
  "BDD & DevOps",
  "Design & IA",
] as const;

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
  const [isWheelPaused, setIsWheelPaused] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>("Tous");
  const [splineReady, setSplineReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectsRef, showProjects] = useNearViewport<HTMLDivElement>("700px");
  const [skillsRef, showSkills] = useNearViewport<HTMLDivElement>("700px");
  const [formationRef, showFormation] = useNearViewport<HTMLDivElement>("700px");
  const [contactRef, showContact] = useNearViewport<HTMLDivElement>("700px");
  const [footerRef, showFooter] = useNearViewport<HTMLDivElement>("500px");
  const activeStackItem = STACK_WHEEL_ITEMS[activeStack] ?? STACK_WHEEL_ITEMS[0];

  // Diffère la scène 3D lourde après le premier rendu ; désactivée sur mobile/reduced-motion pour éviter les ralentissements.
  useEffect(() => {
    if (!active) return;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    if (!desktop || reduced || saveData) return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(() => setSplineReady(true), { timeout: 1800 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(() => setSplineReady(true), 900);
    return () => window.clearTimeout(timer);
  }, [active]);

  // Rotation automatique fluide et pause intelligente
  useEffect(() => {
    if (isWheelPaused) return;
    const interval = setInterval(() => {
      setActiveStack((prev) => (prev + 1) % STACK_WHEEL_ITEMS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isWheelPaused]);

  const handlePrevStack = () => {
    setActiveStack((prev) => (prev - 1 + STACK_WHEEL_ITEMS.length) % STACK_WHEEL_ITEMS.length);
  };

  const handleNextStack = () => {
    setActiveStack((prev) => (prev + 1) % STACK_WHEEL_ITEMS.length);
  };

  const handleDomainFilter = (domain: string) => {
    setDomainFilter(domain);
    if (domain !== "Tous") {
      const targetIndex = STACK_WHEEL_ITEMS.findIndex((item) => item.domain === domain);
      if (targetIndex !== -1) {
        setActiveStack(targetIndex);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent font-sans text-ice antialiased selection:bg-neon/20">
      <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-bg/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <div className={`${CONTAINER} flex items-center justify-between gap-3 py-3 sm:py-4`}>
          <a
            href="#accueil"
            className={`group flex shrink-0 items-center rounded-md text-sm font-semibold tracking-tight text-ice transition-colors hover:text-neon ${FOCUS}`}
            aria-label={`Retour à l'accueil — ${PROFILE.name}`}
          >
            {PROFILE.name}
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav aria-label="Navigation principale" className="hidden md:block">
              <ul className="flex items-center gap-1 text-sm">
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
            <div className="hidden h-4 w-px bg-slate-900/15 md:block" aria-hidden="true" />
            <CVDownloadDropdown variant="header" />
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/10 bg-white/70 text-ice/80 shadow-sm transition hover:bg-white hover:text-ice md:hidden ${FOCUS}`}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Navigation mobile"
            className="border-t border-slate-900/10 bg-bg/95 backdrop-blur-xl md:hidden"
          >
            <ul className={`${CONTAINER} grid gap-1 py-3`}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium text-ice/80 transition hover:bg-white hover:text-ice ${FOCUS}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main>
        {/* HERO */}
        <section
          id="accueil"
          aria-labelledby="accueil-titre"
          className="relative flex min-h-screen items-center pb-[56%] pt-28 sm:pb-[42%] sm:pt-32 lg:py-24 [min-height:100dvh]"
        >
          {/* Scène 3D : occupe toute la hauteur du héro, cadrée à droite sur grand écran. */}
          <div
            className="absolute inset-x-0 bottom-0 h-[50%] overflow-hidden sm:h-[46%] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-auto lg:aspect-[5/6]"
            role="img"
            aria-label="Scène 3D interactive présentant le travail de Medoune"
          >
            {splineReady ? (
              <SplineScene scene={SPLINE_SCENE} className="h-full w-full" active />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-neon/10 via-transparent to-neon2/10" aria-hidden="true" />
            )}
          </div>

          {/* Voile de lisibilité : dense sous le texte, plus léger à droite pour laisser voir la scène 3D. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-bg/[0.88] via-bg/[0.78] to-bg/45 lg:bg-gradient-to-r lg:from-bg/[0.92] lg:via-bg/[0.72] lg:to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden bg-gradient-to-t from-bg/60 to-transparent"
          />

          <div className={`${CONTAINER} pointer-events-none relative z-30`}>
            <div className="pointer-events-auto max-w-xl">
              <SectionTitle
                as="h1"
                id="accueil-titre"
                text={PROFILE.name}
                className="mt-5 max-w-[min(100%,34rem)]"
                fontSize={112}
                fontWeight={800}
                letterSpacing={-3}
                strokeWidth={1.5}
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
                className="mt-3 max-w-[min(100%,34rem)]"
                fontSize={42}
                fontWeight={700}
                letterSpacing={-0.8}
                strokeWidth={1.1}
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
                <PopButton
                  as="a"
                  href="#projets"
                  variant="primary"
                  size="md"
                >
                  Voir les projets
                  <span aria-hidden="true" className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </PopButton>
                <PopButton
                  as="a"
                  href="#contact"
                  variant="secondary"
                  size="md"
                >
                  Me contacter
                </PopButton>
                <CVDownloadDropdown variant="hero" />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-ice/65">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="text-neon" aria-hidden="true">✦</span> Architecture Full-Stack
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="text-neon" aria-hidden="true">✦</span> Design UI/UX Précis
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="text-neon" aria-hidden="true">✦</span> 3D &amp; Performance
                </span>
              </div>
            </div>
          </div>

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
              <p className="text-sm font-medium tracking-[0.22em] text-neon uppercase">Portfolio &amp; Réalisations</p>
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
                text="Donner vie aux idées : des réalisations où l'élégance du design visuel rencontre la puissance de l'ingénierie moderne."
                className="mt-4 text-base leading-relaxed text-ice/80 sm:text-lg"
                delay={50}
                animateBy="words"
                direction="top"
              />
            </div>

            <div ref={projectsRef} className="mt-12 min-h-[420px]">
              {showProjects ? (
                <FerrisWheelGallery
                  items={PROJECT_GALLERY_ITEMS}
                  aria-label="Galerie des projets récents"
                />
              ) : (
                <div className="h-[420px] w-full animate-pulse rounded-3xl bg-slate-100/60" aria-hidden="true" />
              )}
            </div>

            <div className="mt-16 grid items-center gap-10 overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-br from-white/80 via-neon/5 to-neon2/10 p-8 shadow-soft backdrop-blur-sm transition-shadow duration-300 hover:shadow-glow sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:gap-14">
              <div className="max-w-md">
                <p className="text-sm font-medium tracking-[0.22em] text-neon uppercase">Identité Visuelle &amp; Motion</p>
                <SectionTitle
                  as="h3"
                  text="Créativité &amp; Impact"
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
                  text="Créer une empreinte mémorable : l'alliance d'une direction artistique affûtée, d'effets visuels immersifs et d'une rigueur technique au service de chaque projet."
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
                Un écosystème technologique complet et moderne — du pixel parfait sur le front-end à la fiabilité d&apos;une architecture backend performante et évolutive.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ice/40">
                <span>{STACK_WHEEL_ITEMS.length} technologies maîtrisées</span>
                <span className="h-1 w-1 rounded-full bg-slate-900/20" aria-hidden="true" />
                <span>{SKILL_GROUPS.length} piliers d&apos;expertise</span>
                <span className="h-1 w-1 rounded-full bg-slate-900/20" aria-hidden="true" />
                <span>Veille &amp; Innovation continue</span>
              </div>
            </div>
            {/* Conteneur principal de la roue interactive ultra embellie */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white/75 shadow-[0_30px_90px_-40px_rgba(22,35,44,0.35)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_40px_100px_-35px_rgba(40,114,161,0.25)]">
              {/* Coins HUD style futuriste */}
              <div className="pointer-events-none absolute left-3 top-3 z-30 h-4 w-4 border-l-2 border-t-2 border-neon/50" aria-hidden="true" />
              <div className="pointer-events-none absolute right-3 top-3 z-30 h-4 w-4 border-r-2 border-t-2 border-neon/50" aria-hidden="true" />
              <div className="pointer-events-none absolute bottom-3 left-3 z-30 h-4 w-4 border-b-2 border-l-2 border-neon/50" aria-hidden="true" />
              <div className="pointer-events-none absolute bottom-3 right-3 z-30 h-4 w-4 border-b-2 border-r-2 border-neon/50" aria-hidden="true" />

              {/* Décors de fond : matrice de points et halos */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(22,35,44,0.18) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 50% 45%, #000 20%, transparent 75%)",
                  maskImage: "radial-gradient(ellipse 75% 75% at 50% 45%, #000 20%, transparent 75%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse 65% 55% at 50% 48%, rgba(40,114,161,0.14), transparent 72%)",
                }}
              />

              {/* Anneaux d'orbites technologiques et radar gyroscopique */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
                <div className="h-[280px] w-[280px] rounded-full border border-dashed border-neon/25 animate-[spin_50s_linear_infinite]" />
                <div className="absolute h-[430px] w-[430px] rounded-full border border-slate-900/[0.07]" />
                <div className="absolute h-[580px] w-[580px] rounded-full border border-dashed border-steel/20 animate-[spin_70s_linear_infinite_reverse]" />
                {/* Lignes de visée gyroscopiques */}
                <div className="absolute h-px w-[620px] bg-gradient-to-r from-transparent via-slate-900/[0.08] to-transparent" />
                <div className="absolute h-[620px] w-px bg-gradient-to-b from-transparent via-slate-900/[0.08] to-transparent" />
              </div>

              {/* Barre supérieure : statut live + filtres de domaine interactifs */}
              <div className="relative z-20 flex flex-col gap-3 border-b border-slate-900/[0.08] bg-white/40 px-5 py-3.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isWheelPaused ? "bg-amber-400" : "animate-ping bg-emerald-400"}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${isWheelPaused ? "bg-amber-500" : "bg-emerald-500"}`} />
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ice/70">
                    Système Gyroscopique 360°
                  </span>
                  <span className="hidden h-3 w-px bg-slate-900/10 sm:inline" aria-hidden="true" />
                  <span className="hidden font-mono text-[10px] text-neon uppercase tracking-[0.18em] sm:inline">
                    {isWheelPaused ? "En pause" : "Rotation active"}
                  </span>
                </div>

                {/* Filtres par domaine d'expertise */}
                <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filtrer les technologies par domaine">
                  {STACK_DOMAINS.map((domain) => {
                    const isSelected = domainFilter === domain;
                    return (
                      <button
                        key={domain}
                        onClick={() => handleDomainFilter(domain)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 ${
                          isSelected
                            ? "bg-neon text-white shadow-sm shadow-neon/30"
                            : "bg-white/80 text-ice/60 hover:bg-white hover:text-ice border border-slate-900/5"
                        }`}
                        role="tab"
                        aria-selected={isSelected}
                      >
                        {domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Roue interactive des technologies */}
              <div ref={skillsRef} className="relative h-[58vh] min-h-[480px] w-full sm:min-h-[530px] lg:h-[74vh]">
                {showSkills ? (
                  <>
                    <ToolWheel
                      items={STACK_WHEEL_ITEMS}
                      active={activeStack}
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
                      pauseOnHover
                    />
                    <BionicLimbs pulseKey={activeStack} />
                  </>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-3xl bg-slate-100/60" aria-hidden="true" />
                )}
              </div>

              {/* Station de contrôle et fiche détaillée de la technologie sélectionnée */}
              <div className="relative z-20 flex flex-col gap-4 border-t border-slate-900/[0.08] bg-white/70 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neon/25 bg-white shadow-sm transition-transform duration-300 hover:scale-105">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-neon" aria-hidden="true">
                      <path d={activeStackItem.path} fillRule="nonzero" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-bold text-ice tracking-tight">{activeStackItem.label}</span>
                      <span className="rounded-full border border-neon/20 bg-neon/10 px-2.5 py-0.5 text-[10px] font-semibold text-neon uppercase tracking-wider">
                        {activeStackItem.domain}
                      </span>
                      <span className="rounded-full border border-slate-900/10 bg-slate-900/5 px-2 py-0.5 text-[10px] font-medium text-ice/60">
                        {activeStackItem.level}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ice/70">{activeStackItem.description}</p>
                  </div>
                </div>

                {/* Commandes interactives de rotation */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={handlePrevStack}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-900/10 bg-white text-ice/75 shadow-sm transition-all hover:border-neon/30 hover:bg-neon/10 hover:text-neon active:scale-95"
                    aria-label="Technologie précédente"
                    title="Technologie précédente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsWheelPaused((p) => !p)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-3 text-xs font-semibold text-ice/80 shadow-sm transition-all hover:border-neon/30 hover:bg-neon/10 hover:text-neon active:scale-95"
                    aria-label={isWheelPaused ? "Reprendre la rotation automatique" : "Mettre la rotation en pause"}
                    title={isWheelPaused ? "Reprendre" : "Pause"}
                  >
                    {isWheelPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Lecture</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleNextStack}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-900/10 bg-white text-ice/75 shadow-sm transition-all hover:border-neon/30 hover:bg-neon/10 hover:text-neon active:scale-95"
                    aria-label="Technologie suivante"
                    title="Technologie suivante"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="ml-2 flex items-center gap-1.5 pl-2 border-l border-slate-900/10">
                    <span className="font-mono text-xs font-semibold tabular-nums text-neon">
                      {String(activeStack + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[10px] text-ice/40">/</span>
                    <span className="font-mono text-xs tabular-nums text-ice/50">
                      {String(STACK_WHEEL_ITEMS.length).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bandeau interactif de sélection rapide de toutes les stacks */}
              <div className="relative z-20 border-t border-slate-900/[0.08] bg-slate-50/70 p-3 sm:px-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {STACK_WHEEL_ITEMS.map((item, index) => {
                    const isCurrent = index === activeStack;
                    const matchesFilter = domainFilter === "Tous" || item.domain === domainFilter;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setActiveStack(index);
                          setIsWheelPaused(true);
                        }}
                        className={`group flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all duration-200 ${
                          isCurrent
                            ? "bg-neon text-white font-semibold shadow-sm shadow-neon/30 scale-105"
                            : matchesFilter
                            ? "bg-white text-ice/75 hover:bg-white hover:text-neon border border-slate-900/10"
                            : "bg-white/40 text-ice/40 border border-slate-900/5 opacity-50 hover:opacity-100"
                        }`}
                        title={`${item.label} — ${item.description}`}
                      >
                        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 fill-current ${isCurrent ? "text-white" : "text-neon"}`}>
                          <path d={item.path} fillRule="nonzero" />
                        </svg>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-14 flex flex-col items-center gap-2 text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
                Maîtrise par domaine d&apos;intervention
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-ice/70">
                Du front-end réactif à l&apos;infrastructure cloud et l&apos;IA : explorez mon écosystème technologique étape par étape.
              </p>
              <p className="font-mono text-xs text-ice/40">
                {TOTAL_SKILLS} compétences clés · {SKILL_DOMAINS.length} domaines spécialisés
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
                Une progression méthodique guidée par la curiosité technique, la rigueur de l&apos;ingénierie et la passion constante de bâtir des solutions concrètes.
              </p>
            </div>

            <div ref={formationRef} className="relative h-[65vh] min-h-[520px] overflow-hidden rounded-3xl border border-slate-900/10 bg-white shadow-[0_30px_80px_-50px_rgba(22,35,44,0.5)] sm:min-h-[620px] lg:h-[82vh]">
              {showFormation ? (
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
              ) : (
                <div className="h-full w-full animate-pulse bg-slate-100/60" aria-hidden="true" />
              )}
            </div>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ice/40">
              {FORMATION_BOOKS.length} étapes · {FORMATION_BOOKS[0]?.year.split(" — ")[0]} — {FORMATION_BOOKS[FORMATION_BOOKS.length - 1]?.year}
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <div ref={contactRef} className="min-h-[640px]">
          {showContact ? (
            <ContactWithGlobe
              id="contact"
              email={PROFILE.email}
              phone={PROFILE.phone}
              title="Donnons vie à vos projets"
              description="Vous avez un projet innovant, un besoin en développement ou une vision à concrétiser ? Discutons-en et créons ensemble une expérience numérique d'exception."
              className="bg-bg/[0.72] py-24 sm:py-32"
            />
          ) : (
            <div className="min-h-[640px] w-full animate-pulse bg-slate-100/40" aria-hidden="true" />
          )}
        </div>

        {/* FOOTER INTERACTIF FUZZY GAZE */}
        <section
          ref={footerRef}
          aria-label="Pied de page interactif"
          className="relative border-t border-slate-900/10"
        >
          {showFooter ? (
            <FuzzyGazeFooter
              wordmark="Medoune"
              wordmarkHref="#accueil"
              email={PROFILE.email}
              columns={FOOTER_COLUMNS}
              background="#16232c"
              height="85dvh"
            />
          ) : (
            <div className="h-[85dvh] w-full bg-[#16232c]" aria-hidden="true" />
          )}
          <div className="border-t border-white/10 bg-[#16232c] py-6 text-center text-xs">
            <p className="text-mist/70">© {year} {PROFILE.name}. Tous droits réservés.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
