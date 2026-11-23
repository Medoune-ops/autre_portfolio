// Contenu du portfolio — modifie librement ces valeurs.
// Tout est centralisé ici pour que les sections restent faciles à personnaliser.

import type { BookCfg } from "@/components/ui/BooksShowcase";

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
  { label: "Formation", href: "#formation" },
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
    items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "Python", "Java", "PHP", "SQL", "Dart (exploré)"],
  },
  {
    title: "Frameworks & bibliothèques",
    items: [
      "React.js",
      "Next.js 14",
      "Node.js",
      "Express.js",
      "NestJS",
      "Laravel",
      "Django",
      "Angular",
      "Tailwind CSS",
    ],
  },
  {
    title: "Backend & API",
    items: [
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
    title: "Mobile",
    items: ["React Native + Expo", "Flutter", "Riverpod", "Firebase", "Android Studio"],
  },
  {
    title: "Bases de données",
    items: [
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Oracle",
      "Neon.tech",
      "Prisma (ORM)",
      "Supabase",
      "Merise (MCD, 18 entités)",
    ],
  },
  {
    title: "Infra / DevOps & outils",
    items: ["Linux", "Docker", "VMware", "Git", "GitHub", "Vercel", "Render", "pptxgenjs", "LibreOffice (pipeline PDF)"],
  },
  {
    title: "Design",
    items: ["Figma (maquettes HiFi)", "Photoshop", "Canva", "Illustrator"],
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

export type SkillDomain = {
  title: string;
  description: string;
  stacks: string[];
};

/** Les stacks réellement utilisées, regroupées par domaine d'intervention. */
function drawWrappedText(
  x: CanvasRenderingContext2D,
  text: string,
  left: number,
  top: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = "";
  let y = top;
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (x.measureText(test).width > maxWidth && line) {
      x.fillText(line, left, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) x.fillText(line, left, y);
}

function formationCover(title: string, school: string, year: string, bg: string, accent: string) {
  return (x: CanvasRenderingContext2D, w: number, h: number) => {
    const gradient = x.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, bg);
    gradient.addColorStop(1, "#0a0e1c");
    x.fillStyle = gradient;
    x.fillRect(0, 0, w, h);

    x.save();
    x.strokeStyle = accent;
    x.globalAlpha = 0.3;
    x.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      x.beginPath();
      x.arc(w * 0.82, h * 0.22, 90 + i * 78, 0, Math.PI * 2);
      x.stroke();
    }
    x.restore();

    x.fillStyle = accent;
    x.fillRect(84, 104, 116, 8);
    x.font = "600 24px Arial";
    x.fillText("FORMATION", 84, 168);

    x.fillStyle = "#ffffff";
    x.font = "700 68px Georgia";
    drawWrappedText(x, title, 84, 360, w - 168, 82);

    x.globalAlpha = 0.55;
    x.fillStyle = "#ffffff";
    x.fillRect(84, h - 260, w - 168, 2);
    x.globalAlpha = 1;

    x.fillStyle = accent;
    x.font = "600 30px Arial";
    drawWrappedText(x, school, 84, h - 200, w - 168, 42);

    x.fillStyle = "rgba(255,255,255,0.72)";
    x.font = "500 27px Arial";
    x.fillText(year, 84, h - 100);

    x.strokeStyle = "rgba(255,255,255,0.22)";
    x.lineWidth = 2;
    x.strokeRect(48, 48, w - 96, h - 96);
  };
}

/** Chaque livre représente une étape du parcours de formation. */
export const FORMATION_BOOKS: BookCfg[] = [
  {
    id: "licence-dev-applications",
    title: "Développement d'Applications",
    author: "Université numérique Cheikh Hamidou Kane (UNCHK)",
    year: "2023 — En cours",
    desc: "Licence Développement d'Applications : web, mobile et gaming. Une formation tournée vers la conception d'expériences numériques complètes, du front-end au déploiement.",
    degree: "Licence",
    status: "En cours",
    chapters: ["Développement web", "Mobile", "Gaming", "Génie logiciel", "Projets appliqués"],
    front: formationCover(
      "Développement d'Applications",
      "UNCHK",
      "2023 — En cours",
      "#1d3b5c",
      "#6dd6ff",
    ),
    edge: "#dfe8f0",
    backBg: "#1d3b5c",
    backInk: "255,255,255",
    spineBg: "#1d3b5c",
    spineInk: "#6dd6ff",
  },
  {
    id: "licence-genie-informatique",
    title: "Génie Informatique",
    author: "UNIPRO — Université Professionnelle, Dakar",
    year: "2022 — 2025",
    desc: "Licence Génie Informatique, spécialité Développement Web & Mobile, obtenue avec mention Bien. Les fondamentaux du génie logiciel, des bases de données et des applications multiplateformes.",
    degree: "Licence",
    mention: "Mention Bien",
    chapters: ["Développement Web & Mobile", "Bases de données", "Génie logiciel", "Algorithmique", "Architecture logicielle"],
    front: formationCover(
      "Génie Informatique",
      "UNIPRO · Dakar",
      "2022 — 2025",
      "#3b2359",
      "#e3a8ff",
    ),
    edge: "#eadff2",
    backBg: "#3b2359",
    backInk: "255,255,255",
    spineBg: "#3b2359",
    spineInk: "#e3a8ff",
  },
  {
    id: "baccalaureat",
    title: "Baccalauréat",
    author: "Institution Sénégalaise pour l'Enseignement et la Formation",
    year: "2021",
    desc: "Le point de départ : le baccalauréat à l'Institution Sénégalaise pour l'Enseignement et la Formation, avant de se spécialiser dans le développement numérique.",
    degree: "Baccalauréat",
    chapters: ["Sciences", "Mathématiques", "Informatique", "Culture générale"],
    front: formationCover(
      "Baccalauréat",
      "I.S.E.F",
      "2021",
      "#0f463f",
      "#7de3c1",
    ),
    edge: "#dcece6",
    backBg: "#0f463f",
    backInk: "255,255,255",
    spineBg: "#0f463f",
    spineInk: "#7de3c1",
  },
];

export const SKILL_DOMAINS: SkillDomain[] = [
  {
    title: "Front-end",
    description: "Interfaces web, design system et micro-interactions.",
    stacks: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React.js", "Next.js 14", "Angular", "Tailwind CSS"],
  },
  {
    title: "Back-end & API",
    description: "Services, logique métier et documentation d'API.",
    stacks: [
      "Python",
      "Java",
      "PHP",
      "Node.js",
      "Express.js",
      "NestJS",
      "Laravel",
      "Django",
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
    title: "Mobile",
    description: "Applications multiplateforme et état réactif.",
    stacks: ["Dart (exploré)", "React Native + Expo", "Flutter", "Riverpod", "Firebase", "Android Studio"],
  },
  {
    title: "Bases de données",
    description: "Modélisation, requêtes et accès aux données.",
    stacks: [
      "SQL",
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Oracle",
      "Neon.tech",
      "Prisma (ORM)",
      "Supabase",
      "Merise (MCD, 18 entités)",
    ],
  },
  {
    title: "Infra / DevOps",
    description: "Conteneurs, versionnage et déploiement.",
    stacks: ["Linux", "Docker", "VMware", "Git", "GitHub", "Vercel", "Render"],
  },
  {
    title: "Design & outils",
    description: "Maquettes, direction artistique et livrables.",
    stacks: ["Figma (maquettes HiFi)", "Photoshop", "Canva", "Illustrator", "pptxgenjs", "LibreOffice (pipeline PDF)"],
  },
  {
    title: "IA",
    description: "Contenu généré, transcription et répétition espacée.",
    stacks: [
      "Whisper API (score tajwid, Tarteel)",
      "Claude (génération contenu, docs, code)",
      "Algorithme SM-2 (répétition espacée)",
    ],
  },
];
