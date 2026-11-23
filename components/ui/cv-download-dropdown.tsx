"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, ExternalLink, FileDown } from "lucide-react";
import { CV_OPTIONS, type CVOption } from "@/data/portfolio";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export type CVDownloadDropdownProps = {
  variant?: "hero" | "header" | "card";
  className?: string;
  align?: "left" | "right";
};

export function CVDownloadDropdown({
  variant = "hero",
  className = "",
  align = "left",
}: CVDownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermeture automatique au clic à l'extérieur ou touche Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (variant === "header") {
    return (
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Télécharger le CV en français ou en anglais"
          className={`inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-ice shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-neon hover:bg-white hover:text-neon hover:shadow-md active:translate-y-0 ${FOCUS}`}
        >
          <FileDown className="h-3.5 w-3.5 text-neon" aria-hidden="true" />
          <span>CV</span>
          <span className="rounded bg-neon/10 px-1 py-0.2 text-[10px] font-bold text-neon uppercase">
            FR / EN
          </span>
          <ChevronDown
            className={`h-3 w-3 text-ice/60 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-neon" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-2xl border border-slate-900/10 bg-white/95 p-2 shadow-[0_20px_50px_-15px_rgba(22,35,44,0.25)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <div className="px-3 py-2 border-b border-slate-900/10 mb-1">
              <p className="text-[11px] font-semibold tracking-wider text-ice/50 uppercase">
                Télécharger mon CV
              </p>
              <p className="text-xs text-ice/80">Choisis la langue souhaitée :</p>
            </div>

            <div className="flex flex-col gap-1">
              {CV_OPTIONS.map((option) => (
                <div
                  key={option.lang}
                  className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-slate-100/80"
                >
                  <a
                    href={option.href}
                    download={option.fileName}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-1 items-center gap-2.5 text-left focus:outline-none"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon/20 bg-neon/10 text-xs font-bold text-neon">
                      {option.code}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-ice group-hover:text-neon">
                          {option.name}
                        </span>
                        <span className="text-[11px] text-ice/50">({option.code})</span>
                      </div>
                      <p className="truncate text-[11px] text-ice/60">
                        {option.subtitle}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-center gap-1 pl-2">
                    <a
                      href={option.href}
                      download={option.fileName}
                      title={`Télécharger (${option.code})`}
                      aria-label={`Télécharger le CV en ${option.name}`}
                      onClick={() => setIsOpen(false)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10 text-neon transition-colors hover:bg-neon hover:text-white ${FOCUS}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={option.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Aperçu (${option.code})`}
                      aria-label={`Ouvrir le CV en ${option.name} dans un nouvel onglet`}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-ice/50 transition-colors hover:bg-slate-200 hover:text-ice ${FOCUS}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`rounded-2xl border border-slate-900/10 bg-white/70 p-5 shadow-soft backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10 text-neon">
            <FileDown className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-ice">Curriculum Vitae</h4>
            <p className="text-xs text-ice/65">Disponible en Français et en Anglais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {CV_OPTIONS.map((option) => (
            <div
              key={option.lang}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-900/10 bg-white/90 p-3 hover:border-neon/30 transition-all"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-neon/15 px-1.5 py-0.5 text-[10px] font-bold text-neon">
                    {option.code}
                  </span>
                  <span className="text-xs font-semibold text-ice truncate">
                    {option.name}
                  </span>
                </div>
                <p className="text-[10px] text-ice/55 mt-0.5">Format PDF</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={option.href}
                  download={option.fileName}
                  className={`inline-flex items-center gap-1 rounded-lg bg-neon px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-neon2 ${FOCUS}`}
                >
                  <Download className="h-3 w-3" />
                  <span>Télécharger</span>
                </a>
                <a
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Aperçu dans le navigateur"
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-ice/60 hover:bg-slate-100 hover:text-ice ${FOCUS}`}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Variant "hero" (par défaut)
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Télécharger mon CV (choix FR ou EN)"
        className={`group inline-flex items-center justify-center gap-2 rounded-full border border-slate-900/15 bg-white/80 px-6 py-3.5 text-sm font-semibold text-ice shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-neon/40 hover:bg-white hover:shadow-md active:translate-y-0 ${FOCUS}`}
      >
        <FileDown className="h-4 w-4 text-neon transition-transform duration-200 group-hover:scale-110" />
        <span>Télécharger mon CV</span>
        <span className="flex items-center gap-1 rounded-full bg-slate-900/5 px-2 py-0.5 text-xs font-bold text-neon">
          <span>FR</span>
          <span className="text-ice/30">/</span>
          <span>EN</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-ice/60 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-neon" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full z-50 mt-2.5 w-80 origin-top-left rounded-3xl border border-slate-900/10 bg-white/95 p-3 shadow-[0_25px_60px_-15px_rgba(22,35,44,0.28)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150`}
        >
          <div className="px-3 py-2 border-b border-slate-900/10 mb-2">
            <p className="text-[10px] font-bold tracking-widest text-neon uppercase">
              Curriculum Vitae
            </p>
            <p className="text-xs text-ice/70 mt-0.5">
              Sélectionnez la langue pour télécharger le document PDF :
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {CV_OPTIONS.map((option: CVOption) => (
              <div
                key={option.lang}
                className="group flex flex-col gap-2 rounded-2xl border border-slate-900/[0.08] bg-slate-50/70 p-3 transition-all hover:border-neon/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon">
                      {option.code}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ice">
                        {option.name}
                      </p>
                      <p className="text-[11px] text-ice/60">{option.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ice/40 bg-white px-2 py-0.5 rounded-full border border-slate-900/10">
                    PDF
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={option.href}
                    download={option.fileName}
                    onClick={() => setIsOpen(false)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-neon px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neon2 active:scale-[0.98] ${FOCUS}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Télécharger ({option.code})</span>
                  </a>

                  <a
                    href={option.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Aperçu dans le navigateur"
                    aria-label={`Aperçu du CV en ${option.name}`}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-xs font-medium text-ice/80 transition-colors hover:border-slate-900/20 hover:text-ice ${FOCUS}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Aperçu</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 px-3 py-1.5 text-center border-t border-slate-900/[0.06]">
            <p className="text-[10px] text-ice/50">
              Dernière mise à jour : 2026 · Medoune Seck
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
