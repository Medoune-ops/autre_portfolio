"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  CloudCog,
  Code2,
  Database,
  PenTool,
  ServerCog,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { SkillDomain } from "@/data/portfolio";

type DomainMeta = {
  icon: LucideIcon;
  code: string;
  accent: string;
  deep: string;
  soft: string;
};

const DOMAIN_META: Record<string, DomainMeta> = {
  "Front-end": {
    icon: Code2,
    code: "UI // 01",
    accent: "#2872a1",
    deep: "#1c5a82",
    soft: "rgba(40,114,161,0.14)",
  },
  "Back-end & API": {
    icon: ServerCog,
    code: "CORE // 02",
    accent: "#1c5a82",
    deep: "#16232c",
    soft: "rgba(28,90,130,0.14)",
  },
  Mobile: {
    icon: Smartphone,
    code: "NATIVE // 03",
    accent: "#2c5553",
    deep: "#1f3e3c",
    soft: "rgba(44,85,83,0.14)",
  },
  "Bases de données": {
    icon: Database,
    code: "DATA // 04",
    accent: "#789a99",
    deep: "#2c5553",
    soft: "rgba(120,154,153,0.16)",
  },
  "Infra / DevOps": {
    icon: CloudCog,
    code: "OPS // 05",
    accent: "#475569",
    deep: "#1e293b",
    soft: "rgba(71,85,105,0.14)",
  },
  "Design & outils": {
    icon: PenTool,
    code: "LAB // 06",
    accent: "#b45309",
    deep: "#78350f",
    soft: "rgba(180,83,9,0.14)",
  },
  IA: {
    icon: Sparkles,
    code: "AI // 07",
    accent: "#0f766e",
    deep: "#134e4a",
    soft: "rgba(15,118,110,0.14)",
  },
};

const FALLBACK_META: DomainMeta = {
  icon: Code2,
  code: "SYS // 00",
  accent: "#2872a1",
  deep: "#1c5a82",
  soft: "rgba(40,114,161,0.14)",
};

const REVEAL_BASE =
  "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none";
const REVEAL_VISIBLE = "translate-y-0 opacity-100";
const REVEAL_HIDDEN = "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100";

function DomainCard({
  domain,
  index,
  featured = false,
  revealed,
}: {
  domain: SkillDomain;
  index: number;
  featured?: boolean;
  revealed: boolean;
}) {
  const meta = DOMAIN_META[domain.title] ?? FALLBACK_META;
  const Icon = meta.icon;
  const visibleStacks = featured ? domain.stacks.length : 5;
  const hiddenCount = Math.max(0, domain.stacks.length - visibleStacks);

  return (
    <div
      className={`${featured ? "sm:col-span-2" : ""} ${REVEAL_BASE} ${
        revealed ? REVEAL_VISIBLE : REVEAL_HIDDEN
      }`}
      style={{ transitionDelay: `${Math.min(index * 65, 390)}ms` }}
    >
      <article
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-900/[0.08] bg-white/75 p-6 shadow-[0_18px_50px_-30px_rgba(22,35,44,0.3)] backdrop-blur-xl transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(22,35,44,0.35)]"
        style={
          {
            "--accent": meta.accent,
            "--accent-deep": meta.deep,
            "--accent-soft": meta.soft,
          } as CSSProperties
        }
      >
        {/* Liseré supérieur qui se déploie au survol */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent transition-transform duration-700 group-hover:scale-x-100"
        />

        {/* Halo d'accent au survol */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-[70px] transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: meta.soft }}
        />

        {/* Trame technique discrète */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(22,35,44,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(22,35,44,0.045) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 65% at 100% 0%, #000 10%, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse 80% 65% at 100% 0%, #000 10%, transparent 75%)",
          }}
        />

        {/* Index fantôme */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1 select-none font-mono text-[92px] font-black leading-none tracking-tighter text-[var(--accent)] opacity-[0.06] transition-opacity duration-500 group-hover:opacity-[0.1]"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative flex items-start justify-between gap-4">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105"
            style={{
              background: `linear-gradient(140deg, ${meta.accent}, ${meta.deep})`,
              boxShadow: `0 12px 26px -12px ${meta.accent}`,
            }}
          >
            <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-ice/35">
            {meta.code}
          </span>
        </div>

        <div className="relative mt-5">
          <h3 className="text-lg font-bold tracking-tight text-ice">{domain.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ice/65">{domain.description}</p>
        </div>

        <ul
          className="relative mt-5 flex flex-wrap gap-1.5"
          aria-label={`Technologies — ${domain.title}`}
        >
          {domain.stacks.slice(0, visibleStacks).map((stack) => (
            <li
              key={stack}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium text-ice/70 transition-colors duration-300 group-hover:text-ice/85"
              style={{
                borderColor: `${meta.accent}22`,
                background: `${meta.accent}0a`,
              }}
            >
              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full"
                style={{ background: meta.accent }}
              />
              {stack}
            </li>
          ))}
          {hiddenCount > 0 && (
            <li
              className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold"
              style={{
                borderColor: `${meta.accent}33`,
                color: meta.accent,
                background: "#ffffff",
              }}
            >
              +{hiddenCount}
            </li>
          )}
        </ul>

        <div className="relative mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ice/40">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: meta.accent }}
            />
            {String(domain.stacks.length).padStart(2, "0")} technologies
          </span>
          <span
            aria-hidden="true"
            className="flex overflow-hidden rounded-full border border-slate-900/10"
          >
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className="h-1 w-2.5"
                style={{
                  background:
                    i < Math.min(domain.stacks.length, 7)
                      ? meta.accent
                      : "rgba(22,35,44,0.08)",
                  opacity: i < Math.min(domain.stacks.length, 7) ? 0.7 : 1,
                }}
              />
            ))}
          </span>
        </div>
      </article>
    </div>
  );
}

function ContactCard({ revealed }: { revealed: boolean }) {
  return (
    <div
      className={`sm:col-span-2 xl:col-span-1 ${REVEAL_BASE} ${
        revealed ? REVEAL_VISIBLE : REVEAL_HIDDEN
      }`}
      style={{ transitionDelay: "420ms" }}
    >
      <a
        href="#contact"
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#16232c] bg-[#16232c] p-6 text-white shadow-[0_24px_60px_-30px_rgba(22,35,44,0.6)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1"
        aria-label="Discutons de votre projet — aller au contact"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 0%, #789a99 0%, transparent 45%), radial-gradient(circle at 0% 100%, #2872a1 0%, transparent 45%)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-110"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full border border-dashed border-white/15 transition-transform duration-700 group-hover:rotate-45"
        />

        <div className="relative flex items-center justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Sparkles size={21} strokeWidth={1.7} className="text-mist" aria-hidden="true" />
          </span>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Prochain projet
          </span>
        </div>

        <h3 className="relative mt-5 max-w-[16ch] text-xl font-bold leading-snug tracking-tight">
          Construisons votre stack idéale.
        </h3>
        <p className="relative mt-2 max-w-[32ch] text-sm leading-relaxed text-white/65">
          Une idée, un produit à lancer ou une architecture à solidifier ? Parlons-en.
        </p>

        <span className="relative mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-mist">
          Démarrer la conversation
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </a>
    </div>
  );
}

export function SkillDomainGrid({
  domains,
  className = "",
}: {
  domains: SkillDomain[];
  className?: string;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const totalSkills = domains.reduce((total, domain) => total + domain.stacks.length, 0);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-neon">
            Maîtrise par domaine
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-ice sm:text-3xl">
            Sept spécialités, un seul cap.
          </h3>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ice/60">
          {totalSkills} compétences clés réparties sur {domains.length} domaines — du pixel
          parfait à l&apos;infrastructure, sans rupture de qualité.
        </p>
      </div>

      <div ref={gridRef} className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {domains.map((domain, index) => (
          <DomainCard
            key={domain.title}
            domain={domain}
            index={index}
            featured={index === 0}
            revealed={revealed}
          />
        ))}
        <ContactCard revealed={revealed} />
      </div>
    </div>
  );
}

export default SkillDomainGrid;
