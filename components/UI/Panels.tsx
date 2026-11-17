"use client";

import { BRAIN_PARTS } from "@/data/parts";

export function Panels() {
  return (
    <>
      {BRAIN_PARTS.map((p, i) => (
        <aside
          key={p.id}
          id={`panel-${p.id}`}
          className={`panel ${i % 2 === 0 ? "" : "panel--left"}`}
          aria-live="polite"
        >
          <div className="panel__inner" style={{ borderColor: `${p.accent}55`, boxShadow: `0 0 40px ${p.accent}22` }}>
            <div className="panel__kicker" style={{ color: p.accent }}>
              {p.subtitle}
            </div>
            <h2 className="panel__title">{p.title}</h2>
            <p className="panel__text">{p.text}</p>
          </div>
        </aside>
      ))}
    </>
  );
}
