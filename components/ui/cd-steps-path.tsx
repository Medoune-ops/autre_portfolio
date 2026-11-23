"use client"
import * as React from "react"
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Pause, Play, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PathStep {
  id: string
  title: string
  body: string
  /** Optional list rendered as chips, e.g. the stacks used for a domain. */
  tags?: string[]
  icon?: React.ReactNode
}
export interface StepsPathProps {
  steps: PathStep[]
  title?: string
  defaultStep?: number
  /** Hex driving the gold accent glow, exposed as a CSS variable (--sp-gold) so a consumer never has to override a raw literal. */
  accentColor?: string
  /** Starts the route auto-advancing; the play/pause control still lets a visitor take over at any time. */
  autoPlay?: boolean
  /** Milliseconds between auto-advanced steps. */
  autoPlayInterval?: number
  onChange?: (index: number) => void
  className?: string
}

const GOLD = "var(--sp-gold)"
const PH = 92, PAD = 26
const wave = (t: number) => 46 + 21 * Math.sin(t * Math.PI * 2.3 + 0.55)

function StepCard({ s, i, pos, w, reduce, active, total }: { s: PathStep; i: number; pos: MotionValue<number>; w: number; reduce: boolean; active: boolean; total: number }) {
  const d = useTransform(pos, (p) => i - p)
  const x = useTransform(d, (v) => (reduce ? v * (w + 16) : Math.sign(v) * Math.min(Math.abs(v), 1) * w * 0.7 + Math.max(0, Math.abs(v) - 1) * w * 0.2 * Math.sign(v)))
  const rotateY = useTransform(d, (v) => (reduce ? 0 : Math.max(-1.3, Math.min(1.3, v)) * -30))
  const scale = useTransform(d, (v) => (reduce ? 1 : 1 - Math.min(Math.abs(v), 2) * 0.1))
  const opacity = useTransform(d, (v) => Math.max(0, 1 - Math.abs(v) * (reduce ? 1 : 0.45)))
  const zi = useTransform(d, (v) => 100 - Math.round(Math.abs(v) * 10))
  const num = useTransform(d, (v) => (reduce ? 0 : v * -30))

  /* Couleur d'accent par domaine pour varier les cartes */
  const domainColors = [
    { gradient: "linear-gradient(135deg, #2872a1, #1c5a82)", glow: "rgba(40,114,161,0.18)", tagBg: "#2872a1", tagBorder: "#1c5a82" },
    { gradient: "linear-gradient(135deg, #789a99, #2c5553)", glow: "rgba(120,154,153,0.18)", tagBg: "#789a99", tagBorder: "#2c5553" },
    { gradient: "linear-gradient(135deg, #1c5a82, #2872a1)", glow: "rgba(28,90,130,0.18)", tagBg: "#1c5a82", tagBorder: "#2872a1" },
    { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", glow: "rgba(245,158,11,0.15)", tagBg: "#f59e0b", tagBorder: "#d97706" },
    { gradient: "linear-gradient(135deg, #64748b, #475569)", glow: "rgba(100,116,139,0.18)", tagBg: "#64748b", tagBorder: "#475569" },
    { gradient: "linear-gradient(135deg, #2c5553, #789a99)", glow: "rgba(44,85,83,0.18)", tagBg: "#2c5553", tagBorder: "#789a99" },
    { gradient: "linear-gradient(135deg, #2872a1, #789a99)", glow: "rgba(40,114,161,0.16)", tagBg: "#2872a1", tagBorder: "#789a99" },
  ]
  const dc = domainColors[i % domainColors.length]

  /* Métadonnées tech & IA pour chaque domaine */
  const domainTechInfo = [
    { code: "UI_MATRIX // 0x01", symbol: "⬡", badge: "FRONTEND", chip: "SYS.DOM", binary: "01000110" },
    { code: "CORE_API // 0x02", symbol: "⚡", badge: "BACKEND", chip: "SYS.NODE", binary: "01000010" },
    { code: "NATIVE_OS // 0x03", symbol: "◈", badge: "MOBILE", chip: "SYS.APP", binary: "01001101" },
    { code: "DATA_LAKE // 0x04", symbol: "☵", badge: "STORAGE", chip: "SYS.SQL", binary: "01000100" },
    { code: "CLOUD_OPS // 0x05", symbol: "⌘", badge: "DEVOPS", chip: "SYS.ENV", binary: "01001001" },
    { code: "VECTOR_LAB // 0x06", symbol: "✦", badge: "CREATIVE", chip: "SYS.UIX", binary: "01010110" },
    { code: "NEURAL_NET // 0x07", symbol: "⌬", badge: "AI_CORE", chip: "SYS.AI", binary: "01001001" },
  ]
  const tech = domainTechInfo[i % domainTechInfo.length]

  return (
    <motion.li aria-hidden={!active} aria-roledescription="étape" aria-label={`Étape ${i + 1} sur ${total} : ${s.title}`} className="absolute left-1/2 top-0 list-none" style={{ width: w, marginLeft: -w / 2, x, rotateY, scale, opacity, zIndex: zi }}>
      <div
        className="group relative overflow-hidden rounded-3xl border border-slate-900/[0.08] bg-white/90 p-6 backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgba(22,35,44,0.22)]"
        style={{ boxShadow: `0 26px 50px -24px ${dc.glow}, 0 0 0 1px rgba(120,154,153,0.08) inset` }}
      >
        {/* Motifs HUD cybernétiques aux 4 coins */}
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 h-2.5 w-2.5 border-l-2 border-t-2 opacity-35" style={{ borderColor: dc.tagBg }} />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 border-r-2 border-t-2 opacity-35" style={{ borderColor: dc.tagBg }} />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 h-2.5 w-2.5 border-b-2 border-l-2 opacity-35" style={{ borderColor: dc.tagBg }} />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 h-2.5 w-2.5 border-b-2 border-r-2 opacity-35" style={{ borderColor: dc.tagBg }} />

        {/* Traces de circuits imprimés & réseau neuronal SVG en arrière-plan */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-4 h-64 w-64 opacity-20 transition-opacity duration-500 group-hover:opacity-35"
          viewBox="0 0 240 240"
          fill="none"
        >
          {/* Lignes de bus et pistes de circuits */}
          <path d="M40 0 V45 L85 90 H170 L200 120 V240" stroke={dc.tagBg} strokeWidth="1.5" strokeDasharray="6 3" />
          <path d="M120 0 V30 L160 70 H240" stroke={dc.tagBg} strokeWidth="1.5" />
          <path d="M0 80 H60 L100 120 V180 L130 210 H240" stroke={dc.tagBg} strokeWidth="1.2" opacity="0.7" />
          <path d="M180 0 V25 L215 60 V110" stroke={dc.tagBg} strokeWidth="1" opacity="0.6" />

          {/* Nœuds neuronaux / points de soudure */}
          <circle cx="85" cy="90" r="3.5" fill={dc.tagBg} />
          <circle cx="170" cy="90" r="2.5" fill={dc.tagBg} />
          <circle cx="160" cy="70" r="3" fill={dc.tagBg} />
          <circle cx="100" cy="120" r="2.5" fill={dc.tagBg} />
          <circle cx="130" cy="210" r="3" fill={dc.tagBg} />
          <circle cx="40" cy="45" r="2" fill={dc.tagBg} />

          {/* Schéma microprocesseur / Core IA */}
          <rect x="180" y="140" width="36" height="36" rx="6" stroke={dc.tagBg} strokeWidth="1.5" />
          <rect x="188" y="148" width="20" height="20" rx="3" fill={dc.tagBg} fillOpacity="0.18" stroke={dc.tagBg} strokeWidth="1" />
          <path d="M174 147 H180 M174 153 H180 M174 159 H180 M174 165 H180" stroke={dc.tagBg} strokeWidth="1.5" />
          <path d="M216 147 H222 M216 153 H222 M216 159 H222 M216 165 H222" stroke={dc.tagBg} strokeWidth="1.5" />
          <path d="M187 134 V140 M193 134 V140 M201 134 V140 M207 134 V140" stroke={dc.tagBg} strokeWidth="1.5" />
          <path d="M187 176 V182 M193 176 V182 M201 176 V182 M207 176 V182" stroke={dc.tagBg} strokeWidth="1.5" />
        </svg>

        {/* Halo de fond subtil */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-[80px] transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: dc.gradient }}
        />
        {/* Motif de grille tech discret */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #16232c 0.8px, transparent 0.8px)", backgroundSize: "20px 20px" }}
        />

        {/* Grand numéro en arrière-plan */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-8 select-none font-mono text-[140px] font-black leading-none tracking-tighter"
          style={{ x: num, color: dc.glow, opacity: 0.5 }}
        >
          {i + 1}
        </motion.span>

        {/* En-tête : icône + badge domaine + télémétrie tech */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{ background: dc.gradient, boxShadow: `0 8px 20px -6px ${dc.glow}` }}
            >
              {s.icon ?? <span className="text-sm font-bold">{i + 1}</span>}
            </span>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                style={{ background: dc.gradient }}
              >
                <span>{tech.symbol}</span>
                <span>Domaine {i + 1}</span>
              </span>
            </div>
          </div>

          {/* Télémétrie Tech / IA */}
          <div className="flex flex-col items-end text-right font-mono">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: dc.tagBg }}>
              {tech.code}
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#16232c]/40">
              {tech.badge} · {tech.binary}
            </span>
          </div>
        </div>

        {/* Titre du domaine */}
        <h3 className="relative mt-4 text-xl font-bold tracking-tight text-[#16232c]">{s.title}</h3>

        {/* Séparateur stylisé tech avec métadonnées */}
        <div className="relative mt-3 flex items-center gap-2.5 font-mono">
          <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${dc.tagBg}40, transparent)` }} />
          <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: dc.tagBg }}>
            <span className="opacity-60">{tech.symbol}</span>
            <span>{s.tags?.length ?? 0} STACKS</span>
            <span className="text-[#16232c]/30">{"///"}</span>
            <span className="opacity-60">{tech.chip}</span>
          </span>
          <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, transparent, ${dc.tagBg}40)` }} />
        </div>

        {/* Description */}
        <p className="relative mt-3 text-sm leading-relaxed text-[#16232c]/70">{s.body}</p>

        {/* Tags / Chips des stacks avec glyphe tech */}
        {s.tags && s.tags.length > 0 && (
          <ul className="relative mt-4 flex flex-wrap gap-2">
            {s.tags.map((tag) => (
              <li
                key={tag}
                className="group/tag relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] font-medium leading-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  borderColor: `${dc.tagBg}30`,
                  background: `linear-gradient(135deg, ${dc.tagBg}0A, ${dc.tagBg}14)`,
                  color: dc.tagBg,
                }}
              >
                <span className="opacity-40 transition-opacity group-hover/tag:opacity-100" aria-hidden>
                  ◈
                </span>
                <span className="font-sans font-semibold">{tag}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Ligne cybernétique et statut en bas */}
        <div className="absolute bottom-0 left-6 right-6 flex items-center justify-between pb-1.5 pt-2 font-mono text-[8px] uppercase tracking-widest text-[#16232c]/30">
          <div className="h-[2px] flex-1 rounded-full opacity-60" style={{ background: dc.gradient }} />
          <span className="px-2.5">SYS.READY // {tech.chip}</span>
          <div className="h-[2px] w-8 rounded-full opacity-60" style={{ background: dc.gradient }} />
        </div>
      </div>
    </motion.li>
  )
}

export function StepsPath({ steps, title = "Comment ça marche", defaultStep = 0, accentColor = "#789a99", autoPlay = false, autoPlayInterval = 3200, onChange, className }: StepsPathProps) {
  const reduce = !!useReducedMotion()
  const n = steps.length, last = Math.max(1, n - 1)
  const box = React.useRef<HTMLDivElement>(null)
  const [W, setW] = React.useState(520)
  const [step, setStep] = React.useState(defaultStep)
  const [burst, setBurst] = React.useState(0)
  const [playing, setPlaying] = React.useState(autoPlay)
  const stepRef = React.useRef(step); stepRef.current = step
  const pos = useMotionValue(defaultStep)
  const sp = useSpring(pos, { stiffness: 400, damping: 40 })
  const Wr = React.useRef(W); Wr.current = W
  const drag = React.useRef<{ v: number; t: number; p: number; kind: "knob" | "card"; x: number } | null>(null)
  React.useEffect(() => {
    const el = box.current; if (!el) return
    const f = () => setW(el.offsetWidth); const ro = new ResizeObserver(f); ro.observe(el); f(); return () => ro.disconnect()
  }, [])
  useMotionValueEvent(pos, "change", (v) => { const r = Math.max(0, Math.min(n - 1, Math.round(v))); setStep((s) => (s === r ? s : r)) })
  const px = (t: number) => PAD + t * (Wr.current - PAD * 2)
  const route = React.useMemo(() => Array.from({ length: 90 }, (_, i) => { const t = i / 89; return `${i ? "L" : "M"}${(PAD + t * (W - PAD * 2)).toFixed(1)} ${wave(t).toFixed(1)}` }).join(" "), [W])
  const filled = useTransform(sp, (v) => { const tc = Math.max(0, Math.min(1, v / last)); const c = Math.max(2, Math.round(tc * 90)); return Array.from({ length: c }, (_, i) => { const t = (i / (c - 1)) * tc; return `${i ? "L" : "M"}${px(t).toFixed(1)} ${wave(t).toFixed(1)}` }).join(" ") })
  const halfKnob = () => (W < 420 ? 14 : 22)
  const kx = useTransform(sp, (v) => px(v / last) - halfKnob()), ky = useTransform(sp, (v) => wave(v / last) - halfKnob())
  const settle = React.useCallback((target: number, velocity = 0) => {
    const t = Math.max(0, Math.min(n - 1, target)); setStep(t); onChange?.(t)
    animate(pos, t, reduce ? { duration: 0.2 } : { type: "spring", stiffness: 160, damping: 17, velocity }).then(() => { if (!reduce) setBurst((b) => b + 1) })
  }, [n, onChange, pos, reduce])

  /* autoplay: advances on an interval, skips a tick mid-drag, and yields the moment a visitor takes manual control */
  React.useEffect(() => {
    if (!playing || n < 2) return
    const id = window.setInterval(() => {
      if (drag.current) return
      const s = stepRef.current
      settle(s >= n - 1 ? 0 : s + 1)
    }, Math.max(900, autoPlayInterval))
    return () => window.clearInterval(id)
  }, [playing, n, autoPlayInterval, settle])

  const begin = (kind: "knob" | "card") => (e: React.PointerEvent) => { setPlaying(false); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); pos.stop(); drag.current = { v: 0, t: performance.now(), p: pos.get(), kind, x: e.clientX } }
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    let next: number
    if (d.kind === "knob") { const b = box.current!.getBoundingClientRect(); next = ((e.clientX - b.left - PAD) / (W - PAD * 2)) * last }
    else next = d.p - (e.clientX - d.x) / (Math.min(420, W - 80) * 0.7)
    const now = performance.now(); const cur = pos.get(); d.v = (next - cur) / Math.max(1, now - d.t) * 1000; d.t = now
    pos.set(Math.max(-0.2, Math.min(n - 0.8, next)))
  }
  const end = () => { const d = drag.current; drag.current = null; if (d) settle(Math.round(pos.get() + d.v * 0.1), d.v) }
  const key = (e: React.KeyboardEvent) => {
    const m: Record<string, number> = { ArrowRight: step + 1, ArrowUp: step + 1, ArrowLeft: step - 1, ArrowDown: step - 1, Home: 0, End: n - 1 }
    if (e.key in m) { e.preventDefault(); setPlaying(false); settle(m[e.key]) }
  }
  const cw = Math.min(460, W - 80)
  const btn = "grid size-11 place-items-center rounded-full border border-border bg-card outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-35"
  const isLast = step === n - 1
  return (
    <div className="w-full" style={{ "--sp-gold": accentColor } as React.CSSProperties}>
      <section aria-roledescription="carrousel" aria-label={title} className={cn("relative w-full overflow-hidden rounded-3xl border border-slate-900/[0.08] bg-white/80 p-5 pb-6 text-foreground shadow-[0_30px_80px_-50px_rgba(22,35,44,0.18)] backdrop-blur-xl sm:p-8", className)}>
        {/* Halos de fond */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 40% at 50% 0%, color-mix(in oklab, ${GOLD} 20%, transparent), transparent), radial-gradient(50% 40% at 100% 100%, color-mix(in oklab, var(--primary) 16%, transparent), transparent)` }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #16232c 0.6px, transparent 0.6px)", backgroundSize: "18px 18px" }} />

        {/* En-tête */}
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#16232c]">{title}</h2>
            <p className="mt-0.5 text-sm tabular-nums text-[#16232c]/60" aria-live="polite">
              Domaine {step + 1} sur {n} : {steps[step]?.title}{playing ? " · lecture auto" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-pressed={playing} aria-label={playing ? "Mettre la lecture en pause" : "Lancer la lecture"} onClick={() => setPlaying((p) => !p)} className={cn(btn, "border-slate-900/10 bg-white/90 shadow-sm hover:bg-[#cbdde9]/30 hover:border-[#2872a1]/30")}>{playing ? <Pause className="size-4 text-[#2872a1]" aria-hidden /> : <Play className="size-4 text-[#2872a1]" aria-hidden />}</button>
          </div>
        </div>

        {/* Chemin sinusoïdal */}
        <div ref={box} className="relative mt-3 touch-none select-none" style={{ height: PH }}>
          <svg width={W} height={PH} className="absolute inset-0 overflow-visible" aria-hidden>
            <defs><linearGradient id="sp-grad" x1="0" x2="1"><stop offset="0" stopColor="var(--primary)" /><stop offset="1" stopColor={GOLD} /></linearGradient></defs>
            <path d={route} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 11" className="stroke-border" />
            <motion.path d={filled} fill="none" strokeWidth="6" strokeLinecap="round" stroke="url(#sp-grad)" style={{ filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 55%, transparent))" }} />
          </svg>
          {steps.map((s, i) => {
            const t = i / last
            return (
              <button key={s.id} type="button" tabIndex={-1} aria-label={`Aller au domaine ${i + 1} : ${s.title}`} onClick={() => { setPlaying(false); settle(i) }} className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none after:absolute after:-inset-2 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-11" style={{ left: PAD + t * (W - PAD * 2), top: wave(t) }}>
                <motion.span className={cn("grid size-5 place-items-center rounded-full border-2 text-[10px] font-bold shadow-sm sm:size-7 sm:text-xs", i <= step ? "border-[#2872a1] bg-[#2872a1] text-white" : "border-slate-900/15 bg-white text-[#16232c]/60")} animate={{ scale: i === step ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}>
                  {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </motion.span>
              </button>
            )
          })}
          <motion.div className="absolute left-0 top-0 size-7 sm:size-11" style={{ x: kx, y: ky }}>
            {burst > 0 && !reduce && (
              <span key={burst} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
                {Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2; return <motion.span key={k} className="absolute -ml-[3px] -mt-[3px] block size-1.5 rounded-full" style={{ background: k % 2 ? GOLD : "var(--primary)" }} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 34, y: Math.sin(a) * 34, opacity: 0, scale: 0.2 }} transition={{ duration: 0.7, ease: "easeOut" }} /> })}
              </span>
            )}
            <div role="slider" tabIndex={0} aria-label="Étape" aria-orientation="horizontal" aria-valuemin={1} aria-valuemax={n} aria-valuenow={step + 1} aria-valuetext={`Domaine ${step + 1} : ${steps[step]?.title}`} onKeyDown={key} onPointerDown={begin("knob")} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
              className="grid size-7 cursor-grab place-items-center rounded-full outline-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-11">
              <motion.span className="block size-5 rounded-full border-[3px] border-white sm:size-7" style={{ background: `linear-gradient(135deg,${GOLD},var(--primary))`, boxShadow: `0 0 0 2px var(--primary), 0 8px 20px -4px color-mix(in oklab, var(--primary) 70%, transparent)` }} whileTap={reduce ? undefined : { scale: 1.2 }} />
            </div>
          </motion.div>
        </div>

        {/* Cartes domaine */}
        <div onPointerDown={begin("card")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} className="relative mt-2 h-[30rem] touch-pan-y cursor-grab select-none active:cursor-grabbing sm:h-[34rem]" style={{ perspective: 1000 }}>
          <ul className="relative h-full">{steps.map((s, i) => <StepCard key={s.id} s={s} i={i} pos={pos} w={cw} reduce={reduce} active={i === step} total={n} />)}</ul>
        </div>

        {/* Contrôles du bas */}
        <div className="relative mt-4 flex items-center justify-between gap-3">
          <button type="button" className={cn(btn, "border-slate-900/10 bg-white/90 shadow-sm hover:bg-[#cbdde9]/30 hover:border-[#2872a1]/30 disabled:opacity-30")} aria-label="Domaine précédent" disabled={step === 0} onClick={() => { setPlaying(false); settle(step - 1) }}><ArrowLeft className="size-4 text-[#16232c]" aria-hidden /></button>
          <p className="flex items-center gap-2 text-center text-xs text-[#16232c]/50">
            <span className="hidden sm:inline">Faites glisser le curseur ou balayez les cartes</span>
            <span className="inline sm:hidden">Balayez pour naviguer</span>
          </p>
          <button type="button" onClick={() => { setPlaying(false); settle(isLast ? 0 : step + 1) }} className="flex h-11 items-center gap-2 rounded-full bg-[#2872a1] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(40,114,161,0.5)] outline-none transition-all hover:-translate-y-0.5 hover:bg-[#1c5a82] hover:shadow-[0_12px_26px_-8px_rgba(40,114,161,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0">
            {isLast ? <>Recommencer <RotateCcw className="size-4" aria-hidden /></> : <>Suivant <ArrowRight className="size-4" aria-hidden /></>}
          </button>
        </div>
      </section>
    </div>
  )
}
