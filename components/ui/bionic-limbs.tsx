"use client";

import { useId } from "react";

/**
 * Bras bioniques animés (SVG + CSS) qui encadrent la roue des stacks.
 * - Doigts articulés (3 phalanges) qui se plient en cascade
 * - Servo-articulations rotatives, noyaux lumineux, flux d'énergie
 * - `pulseKey` : change de valeur => impulsion de données aux bouts des doigts
 * Purement décoratif : aria-hidden, pointer-events-none, désactivé en reduced-motion.
 */

const FINGERS = [
  { y: 97, len: [20, 16, 13], delay: 0 },
  { y: 107.5, len: [22, 18, 14], delay: 0.14 },
  { y: 118, len: [21, 17, 13], delay: 0.28 },
  { y: 128.5, len: [17, 13, 11], delay: 0.42 },
] as const;

const CSS = `
.bio-limb { overflow: visible; }
.bio-float { animation: bio-float 7s ease-in-out infinite; }
.bio-fa, .bio-fb, .bio-fc, .bio-ta, .bio-tb { transform-origin: 0 0; animation-duration: 5.6s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
.bio-fa { animation-name: bio-flex-a; }
.bio-fb { animation-name: bio-flex-b; }
.bio-fc { animation-name: bio-flex-c; }
.bio-ta { animation-name: bio-thumb-a; }
.bio-tb { animation-name: bio-thumb-b; }
.bio-flow { stroke-dasharray: 5 9; animation: bio-dash 1.5s linear infinite; }
.bio-flow-slow { stroke-dasharray: 3 7; animation: bio-dash 2.8s linear infinite; }
.bio-spin, .bio-spin-rev { transform-box: fill-box; transform-origin: center; }
.bio-spin { animation: bio-rot 14s linear infinite; }
.bio-spin-rev { animation: bio-rot 18s linear infinite reverse; }
.bio-pulse { filter: drop-shadow(0 0 3px rgba(40,114,161,0.85)); animation: bio-pulse 2.2s ease-in-out infinite; }
.bio-tip { filter: drop-shadow(0 0 3px rgba(40,114,161,0.9)); animation: bio-pulse 2.2s ease-in-out infinite; }
.bio-amber { filter: drop-shadow(0 0 3px rgba(245,158,11,0.8)); animation: bio-pulse 3.1s ease-in-out infinite; }
.bio-ping { transform-box: fill-box; transform-origin: center; animation: bio-ping 1s ease-out both; }
@keyframes bio-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes bio-flex-a { 0%,100% { transform: rotate(0deg); } 42%,62% { transform: rotate(13deg); } }
@keyframes bio-flex-b { 0%,100% { transform: rotate(0deg); } 42%,62% { transform: rotate(26deg); } }
@keyframes bio-flex-c { 0%,100% { transform: rotate(0deg); } 42%,62% { transform: rotate(18deg); } }
@keyframes bio-thumb-a { 0%,100% { transform: rotate(0deg); } 42%,62% { transform: rotate(-14deg); } }
@keyframes bio-thumb-b { 0%,100% { transform: rotate(0deg); } 42%,62% { transform: rotate(-22deg); } }
@keyframes bio-dash { to { stroke-dashoffset: -28; } }
@keyframes bio-rot { to { transform: rotate(360deg); } }
@keyframes bio-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes bio-ping { 0% { transform: scale(0.4); opacity: 0.95; } 100% { transform: scale(3.4); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .bio-limb *, .bio-limb { animation: none !important; }
}
`;

const INK = "#16232c";
const NEON = "#2872a1";
const AMBER = "#f59e0b";

function Limb({ side, pulseKey, uid }: { side: "left" | "right"; pulseKey: number; uid: string }) {
  const plate = `bio-plate-${uid}`;
  const plateV = `bio-plate-v-${uid}`;
  const isRight = side === "right";

  return (
    <div
      className={`absolute top-1/2 w-[30%] max-w-[380px] -translate-y-1/2 ${isRight ? "right-0" : "left-0"}`}
    >
      <svg viewBox="0 0 360 220" className="bio-limb bio-float block h-auto w-full" fill="none">
        <defs>
          <linearGradient id={plate} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#cbdde9" />
          </linearGradient>
          <linearGradient id={plateV} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e6eef2" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {/* Le membre est dessiné vers la droite ; le côté droit est miroir. */}
        <g transform={isRight ? "translate(360 0) scale(-1 1)" : undefined}>
          {/* Fixation épaule */}
          <rect x="-4" y="68" width="30" height="86" rx="5" fill={INK} />
          {[78, 111, 144].map((cy) => (
            <circle key={cy} cx="10" cy={cy} r="3" fill="#cbdde9" />
          ))}

          {/* Vérin hydraulique */}
          <line x1="30" y1="76" x2="86" y2="84" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <line x1="86" y1="84" x2="122" y2="91" stroke="#789a99" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="30" cy="76" r="3.4" fill="#cbdde9" stroke={INK} strokeWidth="1.2" />
          <circle cx="122" cy="91" r="3.4" fill="#cbdde9" stroke={INK} strokeWidth="1.2" />

          {/* Bras */}
          <rect x="24" y="84" width="72" height="54" rx="10" fill={`url(#${plate})`} stroke={INK} strokeOpacity="0.55" strokeWidth="1.4" />
          <polygon points="42,84 52,84 46,138 36,138" fill={AMBER} fillOpacity="0.88" />
          <path d="M58 100 H72 L80 108 H92" stroke={NEON} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="bio-flow-slow" />
          <path d="M58 122 H76 L82 116 H92" stroke="#789a99" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="bio-flow-slow" />

          {/* Coude : servo */}
          <circle cx="112" cy="111" r="26" fill={`url(#${plate})`} stroke={INK} strokeOpacity="0.6" strokeWidth="1.5" />
          <circle cx="112" cy="111" r="21" stroke={NEON} strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="3 5" className="bio-spin" />
          <circle cx="112" cy="111" r="15" fill={INK} />
          <circle cx="112" cy="111" r="9.5" stroke="#cbdde9" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 3" className="bio-spin-rev" />
          <circle cx="112" cy="111" r="5" fill={NEON} className="bio-pulse" />

          {/* Avant-bras */}
          <polygon points="134,92 232,99 232,126 134,132" fill={`url(#${plateV})`} stroke={INK} strokeOpacity="0.55" strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="164" y1="94" x2="164" y2="130" stroke={INK} strokeOpacity="0.2" />
          <line x1="198" y1="97" x2="198" y2="127" stroke={INK} strokeOpacity="0.2" />
          <path d="M140 112 H228" stroke={NEON} strokeWidth="1.8" strokeLinecap="round" className="bio-flow" />
          <rect x="170" y="101" width="22" height="4" rx="2" fill={AMBER} fillOpacity="0.9" className="bio-amber" />
          <rect x="170" y="119" width="14" height="3" rx="1.5" fill={INK} fillOpacity="0.35" />

          {/* Poignet */}
          <circle cx="238" cy="112.5" r="14" fill={INK} />
          <circle cx="238" cy="112.5" r="9" fill={`url(#${plate})`} />
          <circle cx="238" cy="112.5" r="11.5" stroke="#cbdde9" strokeOpacity="0.6" strokeDasharray="2 4" className="bio-spin-rev" />

          {/* Paume */}
          <rect x="246" y="92" width="46" height="42" rx="9" fill={`url(#${plate})`} stroke={INK} strokeOpacity="0.6" strokeWidth="1.4" />
          <rect x="254" y="100" width="24" height="26" rx="5" fill={INK} />
          <circle cx="266" cy="113" r="7" stroke={NEON} strokeWidth="1.2" strokeDasharray="2 3" className="bio-spin" />
          <circle cx="266" cy="113" r="3.2" fill={NEON} className="bio-pulse" />
          <path d="M280 104 H288 M280 122 H288" stroke="#cbdde9" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />

          {/* Doigts articulés */}
          {FINGERS.map((f, i) => {
            const [a, b, c] = f.len;
            return (
              <g key={i} transform={`translate(292 ${f.y})`}>
                <circle cx="0" cy="0" r="4.6" fill={INK} />
                <g className="bio-fa" style={{ animationDelay: `${f.delay}s` }}>
                  <rect x="0" y="-4" width={a} height="8" rx="4" fill={`url(#${plate})`} stroke={INK} strokeOpacity="0.6" strokeWidth="1.1" />
                  <g transform={`translate(${a} 0)`}>
                    <g className="bio-fb" style={{ animationDelay: `${f.delay + 0.06}s` }}>
                      <circle cx="0" cy="0" r="3.4" fill={INK} />
                      <rect x="0" y="-3.6" width={b} height="7.2" rx="3.6" fill={`url(#${plate})`} stroke={INK} strokeOpacity="0.6" strokeWidth="1.1" />
                      <g transform={`translate(${b} 0)`}>
                        <g className="bio-fc" style={{ animationDelay: `${f.delay + 0.12}s` }}>
                          <circle cx="0" cy="0" r="3" fill={INK} />
                          <rect x="0" y="-3.2" width={c} height="6.4" rx="3.2" fill="#e6eef2" stroke={INK} strokeOpacity="0.6" strokeWidth="1.1" />
                          <circle cx={c - 1} cy="0" r="2.2" fill={NEON} className="bio-tip" />
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            );
          })}

          {/* Pouce */}
          <circle cx="262" cy="134" r="6" fill={INK} />
          <g transform="translate(262 134) rotate(42)">
            <g className="bio-ta">
              <rect x="0" y="-4.5" width="19" height="9" rx="4.5" fill={`url(#${plate})`} stroke={INK} strokeOpacity="0.6" strokeWidth="1.1" />
              <g transform="translate(19 0)">
                <g className="bio-tb">
                  <circle cx="0" cy="0" r="3.4" fill={INK} />
                  <rect x="0" y="-3.8" width="15" height="7.6" rx="3.8" fill="#e6eef2" stroke={INK} strokeOpacity="0.6" strokeWidth="1.1" />
                  <circle cx="14" cy="0" r="2.3" fill={AMBER} className="bio-amber" />
                </g>
              </g>
            </g>
          </g>

          {/* Impulsion de données (rejouée à chaque changement de stack) */}
          <circle key={pulseKey} cx="347" cy="107.5" r="4" stroke={NEON} strokeWidth="1.6" className="bio-ping" />
        </g>

        {/* Étiquettes HUD (hors miroir pour rester lisibles) */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="7" letterSpacing="1.4" fill={INK} fillOpacity="0.5">
          <text x={isRight ? 334 : 26} y="168" textAnchor={isRight ? "end" : "start"}>
            {isRight ? "SERVO-02 · 3.2 N·m" : "SERVO-01 · 3.2 N·m"}
          </text>
          <text x={isRight ? 334 : 26} y="178" textAnchor={isRight ? "end" : "start"} fill={NEON} fillOpacity="0.8">
            {isRight ? "SYNC · ONLINE" : "TORQUE · OK"}
          </text>
          <path d={isRight ? "M334 183 H250" : "M26 183 H110"} stroke={INK} strokeOpacity="0.18" />
        </g>
      </svg>
    </div>
  );
}

export function BionicLimbs({ pulseKey = 0 }: { pulseKey?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden md:block">
      <style>{CSS}</style>
      <Limb side="left" pulseKey={pulseKey} uid={`${uid}l`} />
      <Limb side="right" pulseKey={pulseKey} uid={`${uid}r`} />
    </div>
  );
}

export default BionicLimbs;
