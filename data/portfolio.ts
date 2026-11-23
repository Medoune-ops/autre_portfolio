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

function drawBrainShape(x: CanvasRenderingContext2D, cx: number, cy: number, scale: number, color: string) {
  x.save();
  x.translate(cx, cy);
  x.scale(scale, scale);
  x.strokeStyle = color;
  x.lineWidth = 2.6;
  x.lineCap = "round";
  x.lineJoin = "round";

  // Silhouette des deux hémisphères.
  x.beginPath();
  x.moveTo(0, -78);
  x.bezierCurveTo(-26, -104, -74, -100, -92, -66);
  x.bezierCurveTo(-126, -62, -140, -20, -122, 8);
  x.bezierCurveTo(-140, 40, -118, 78, -82, 76);
  x.bezierCurveTo(-62, 98, -20, 96, 0, 76);
  x.bezierCurveTo(20, 96, 62, 98, 82, 76);
  x.bezierCurveTo(118, 78, 140, 40, 122, 8);
  x.bezierCurveTo(140, -20, 126, -62, 92, -66);
  x.bezierCurveTo(74, -100, 26, -104, 0, -78);
  x.closePath();
  x.stroke();

  // Sillon central.
  x.beginPath();
  x.moveTo(0, -78);
  x.lineTo(0, 76);
  x.stroke();

  // Circonvolutions, symétriques de chaque côté.
  const folds = [
    [-10, -58, -50, -70, -70, -44],
    [-12, -28, -60, -34, -76, -10],
    [-8, 2, -55, 2, -78, 24],
    [-12, 32, -48, 38, -60, 60],
    [-76, -60, -96, -38, -84, -14],
    [-88, 12, -106, 32, -80, 52],
  ];
  folds.forEach(([x1, y1, cx1, cy1, cx2, cy2]) => {
    [-1, 1].forEach((side) => {
      x.beginPath();
      x.moveTo(side * x1, y1);
      x.bezierCurveTo(side * cx1, cy1, side * cx2, cy2, side * (cx2 + 8), cy2 + 12);
      x.stroke();
    });
  });

  // Tronc cérébral.
  x.beginPath();
  x.moveTo(-14, 76);
  x.bezierCurveTo(-18, 100, -8, 118, 4, 124);
  x.bezierCurveTo(18, 116, 20, 96, 14, 76);
  x.stroke();

  x.restore();
}

function drawCodeMotif(x: CanvasRenderingContext2D, w: number, h: number, color: string) {
  x.save();
  x.globalAlpha = 0.16;
  x.fillStyle = color;
  x.strokeStyle = color;
  x.lineWidth = 2;
  x.font = "700 44px ui-monospace, SFMono-Regular, Menlo, monospace";

  const glyphs = ["</>", "{ }", "[ ]", "=>", "//", "01", "#", "()"];
  const spots = [
    [w - 320, 250],
    [w - 210, 430],
    [w - 350, 630],
    [90, h - 430],
    [230, h - 370],
    [w - 270, h - 470],
  ];
  spots.forEach(([sx, sy], i) => x.fillText(glyphs[i % glyphs.length], sx, sy));

  const nodes = [
    [w - 150, 300],
    [w - 250, 370],
    [w - 300, 480],
    [w - 190, 560],
  ];
  x.beginPath();
  nodes.forEach(([nx, ny], i) => (i ? x.lineTo(nx, ny) : x.moveTo(nx, ny)));
  x.stroke();
  nodes.forEach(([nx, ny]) => {
    x.beginPath();
    x.arc(nx, ny, 7, 0, Math.PI * 2);
    x.fill();
  });
  x.restore();
}

function drawCircuitMotif(x: CanvasRenderingContext2D, w: number, h: number, color: string) {
  x.save();
  x.globalAlpha = 0.2;
  x.strokeStyle = color;
  x.fillStyle = color;
  x.lineWidth = 2;

  const chipX = w - 330;
  const chipY = 280;
  const chipSize = 170;
  x.strokeRect(chipX, chipY, chipSize, chipSize);
  x.strokeRect(chipX + 42, chipY + 42, chipSize - 84, chipSize - 84);
  for (let i = 0; i < 5; i++) {
    const py = chipY + 24 + i * 30;
    x.beginPath();
    x.moveTo(chipX - 34, py);
    x.lineTo(chipX, py);
    x.stroke();
    x.beginPath();
    x.moveTo(chipX + chipSize, py);
    x.lineTo(chipX + chipSize + 34, py);
    x.stroke();
  }

  const traces = [
    [
      [chipX - 34, chipY + 24],
      [90, chipY + 24],
      [90, chipY + 150],
    ],
    [
      [chipX + chipSize + 34, chipY + 114],
      [w - 60, chipY + 114],
      [w - 60, chipY + 240],
    ],
    [
      [chipX + 40, chipY + chipSize],
      [chipX + 40, chipY + chipSize + 120],
      [w - 150, chipY + chipSize + 120],
    ],
  ];
  traces.forEach((path) => {
    x.beginPath();
    path.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.stroke();
    const [endX, endY] = path[path.length - 1];
    x.beginPath();
    x.arc(endX, endY, 8, 0, Math.PI * 2);
    x.fill();
  });

  x.font = "600 26px ui-monospace, SFMono-Regular, Menlo, monospace";
  x.fillText("CPU", chipX + 60, chipY + 92);
  x.restore();
}

type CoverMotif = "code" | "circuit" | "brain";

function formationCover(
  title: string,
  school: string,
  year: string,
  bg: string,
  accent: string,
  motif: CoverMotif = "code",
) {
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

    if (motif === "code") {
      drawCodeMotif(x, w, h, accent);
    } else if (motif === "circuit") {
      drawCircuitMotif(x, w, h, accent);
    } else {
      x.save();
      x.globalAlpha = 0.32;
      drawBrainShape(x, w * 0.5, h * 0.52, 1.7, accent);
      x.restore();
    }

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
      "code",
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
      "circuit",
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
      "brain",
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
