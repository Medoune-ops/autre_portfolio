// Contenu du portfolio — modifie librement ces valeurs.
// Tout est centralisé ici pour que les sections restent faciles à personnaliser.

export const SPLINE_SCENE =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export const PROFILE = {
  name: "Medoune",
  role: "Développeur front-end & expériences 3D",
  tagline:
    "Je conçois des interfaces immersives où le mouvement, la lumière et la 3D servent le contenu.",
  bio: "Passionné par le détail visuel et la performance, je transforme des idées en expériences web fluides : scènes 3D temps réel, animations maîtrisées et design systems cohérents.",
  email: "hello@example.com",
  availability: "Disponible pour de nouveaux projets",
};

export const NAV_LINKS = [
  { label: "Accueil", href: "#accueil" },
  { label: "Projets", href: "#projets" },
  { label: "Compétences", href: "#competences" },
  { label: "Contact", href: "#contact" },
] as const;

export type Project = {
  title: string;
  description: string;
  tags: string[];
  year: string;
  href?: string;
};

export const PROJECTS: Project[] = [
  {
    title: "Portfolio 3D immersif",
    description:
      "Une expérience pilotée au scroll : un cerveau 3D procédural se fragmente, chaque région révèle son panneau et la caméra accompagne la lecture.",
    tags: ["Next.js", "React Three Fiber", "Three.js"],
    year: "2026",
  },
  {
    title: "Hero Spline interactive",
    description:
      "Scène 3D temps réel intégrée à Next.js, avec spotlight au curseur, chargement différé et fallback accessible.",
    tags: ["Spline", "Next.js", "TypeScript"],
    year: "2026",
  },
  {
    title: "Système visuel néon",
    description:
      "Direction artistique sombre et lumineuse : halos cyan, verre dépoli, typographie contrastée et micro-interactions cohérentes.",
    tags: ["Tailwind CSS", "Design system", "Motion"],
    year: "2025",
  },
];

export type SkillGroup = {
  title: string;
  items: string[];
};

export const SKILL_GROUPS: SkillGroup[] = [
  {
    title: "Langages",
    items: ["TypeScript", "JavaScript", "HTML", "CSS", "Dart (exploré)", "SQL"],
  },
  {
    title: "Frontend",
    items: ["Next.js 14", "React", "Tailwind CSS", "Vanilla JS (portfolio, effets 3D)", "React Native + Expo"],
  },
  {
    title: "Backend / API",
    items: [
      "Node.js",
      "Express.js",
      "NestJS",
      "API CRUD",
      "JWT",
      "Middleware",
      "Architecture MVC",
      "POO",
      "Swagger (documentation API)",
      "NextAuth v5",
    ],
  },
  {
    title: "Bases de données",
    items: ["PostgreSQL", "Neon.tech", "Prisma (ORM)", "Supabase", "Merise (MCD, 18 entités)"],
  },
  {
    title: "Déploiement / outils",
    items: ["Vercel", "Render", "Git", "GitHub", "Figma (maquettes HiFi)", "pptxgenjs", "LibreOffice (pipeline PDF)"],
  },
  {
    title: "Mobile (exploré)",
    items: ["Flutter", "Riverpod", "Firebase"],
  },
  {
    title: "IA",
    items: [
      "Whisper API (score tajwid, Tarteel)",
      "Claude (génération contenu, docs, code)",
      "Algorithme SM-2 (répétition espacée)",
    ],
  },
];

export const STATS = [
  { value: "3D", label: "temps réel" },
  { value: "100%", label: "responsive" },
  { value: "A11y", label: "pris en compte" },
] as const;
