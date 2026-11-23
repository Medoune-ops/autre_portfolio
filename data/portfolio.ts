// Contenu du portfolio — modifie librement ces valeurs.
// Tout est centralisé ici pour que les sections restent faciles à personnaliser.

import type { BookCfg } from "@/components/ui/BooksShowcase";

export const SPLINE_SCENE =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export const PROFILE = {
  name: "Medoune",
  fullName: "Medoune Seck",
  role: "Web Designer & Developer",
  tagline: "Génie Informatique · Full-Stack Development · UI/UX Design",
  bio: "Développeur & Designer. Maîtrise full-stack, design UI/UX et communication digitale. Autonome, rigoureux et orienté impact sur des projets tech ambitieux.",
  email: "smedoune16@gmail.com",
  phone: "+221 76 921 10 73",
  location: "Keur Massar, Dakar",
  availability: "Disponible pour de nouveaux projets",
};

export type CVOption = {
  lang: "fr" | "en";
  code: string;
  name: string;
  subtitle: string;
  fileName: string;
  href: string;
  badge: string;
};

export const CV_OPTIONS: CVOption[] = [
  {
    lang: "fr",
    code: "FR",
    name: "Français",
    subtitle: "CV Développeur & Designer (PDF)",
    fileName: "CV_Medoune_SECK_FR.pdf",
    href: "/cv/CV_Medoune_SECK_FR.pdf",
    badge: "FR",
  },
  {
    lang: "en",
    code: "EN",
    name: "English",
    subtitle: "Developer & Designer Resume (PDF)",
    fileName: "CV_Medoune_SECK_EN.pdf",
    href: "/cv/CV_Medoune_SECK_EN.pdf",
    badge: "EN",
  },
];

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
  x.lineWidth = 3.4;
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
  x.globalAlpha = 0.55;
  x.fillStyle = color;
  x.strokeStyle = color;
  x.lineWidth = 3;
  x.font = "700 52px ui-monospace, SFMono-Regular, Menlo, monospace";

  const glyphs = ["</>", "{ }", "[ ]", "=>", "//", "01", "#", "()"];
  const spots = [
    [w - 340, 250],
    [w - 310, 640],
    [w - 370, 790],
    [90, h - 470],
    [250, h - 400],
    [w - 290, h - 560],
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
    x.arc(nx, ny, 10, 0, Math.PI * 2);
    x.fill();
  });
  x.restore();
}

function drawCircuitMotif(x: CanvasRenderingContext2D, w: number, h: number, color: string) {
  x.save();
  x.globalAlpha = 0.5;
  x.strokeStyle = color;
  x.fillStyle = color;
  x.lineWidth = 3;

  const chipX = w - 330;
  const chipY = 620;
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

  x.font = "700 32px ui-monospace, SFMono-Regular, Menlo, monospace";
  x.fillText("CPU", chipX + 56, chipY + 94);
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
    gradient.addColorStop(1, "#16232c");
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
      x.globalAlpha = 0.55;
      drawBrainShape(x, w * 0.5, h * 0.52, 1.8, accent);
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
      "#1c5a82",
      "#cbdde9",
      "code",
    ),
    edge: "#dce9f1",
    backBg: "#1c5a82",
    backInk: "255,255,255",
    spineBg: "#1c5a82",
    spineInk: "#cbdde9",
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
      "#2c5553",
      "#f59e0b",
      "circuit",
    ),
    edge: "#e7efeb",
    backBg: "#2c5553",
    backInk: "255,255,255",
    spineBg: "#2c5553",
    spineInk: "#f59e0b",
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
      "#2872a1",
      "#cbdde9",
      "brain",
    ),
    edge: "#dce9f1",
    backBg: "#2872a1",
    backInk: "255,255,255",
    spineBg: "#2872a1",
    spineInk: "#cbdde9",
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
