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
  return (
    <motion.li aria-hidden={!active} aria-roledescription="étape" aria-label={`Étape ${i + 1} sur ${total} : ${s.title}`} className="absolute left-1/2 top-0 list-none" style={{ width: w, marginLeft: -w / 2, x, rotateY, scale, opacity, zIndex: zi }}>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_26px_44px_-28px_color-mix(in_oklab,var(--primary)_75%,transparent)]">
        <motion.span aria-hidden className="pointer-events-none absolute -right-2 -top-6 select-none text-[120px] font-black leading-none tracking-tighter text-primary/10" style={{ x: num }}>{i + 1}</motion.span>
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl text-primary-foreground" style={{ background: `linear-gradient(135deg,var(--primary),${GOLD})` }}>{s.icon ?? <span className="font-bold">{i + 1}</span>}</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Étape {i + 1}</p>
        </div>
        <h3 className="relative mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
        <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        {s.tags && s.tags.length > 0 && (
          <ul className="relative mt-3 flex flex-wrap gap-1.5">
            {s.tags.map((tag) => (
              <li key={tag} className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium leading-4 text-foreground/80">{tag}</li>
            ))}
          </ul>
        )}
      </div>
    </motion.li>
  )
}

export function StepsPath({ steps, title = "Comment ça marche", defaultStep = 0, accentColor = "#94a3b8", autoPlay = false, autoPlayInterval = 3200, onChange, className }: StepsPathProps) {
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
    else next = d.p - (e.clientX - d.x) / (Math.min(300, W - 60) * 0.7)
    const now = performance.now(); const cur = pos.get(); d.v = (next - cur) / Math.max(1, now - d.t) * 1000; d.t = now
    pos.set(Math.max(-0.2, Math.min(n - 0.8, next)))
  }
  const end = () => { const d = drag.current; drag.current = null; if (d) settle(Math.round(pos.get() + d.v * 0.1), d.v) }
  const key = (e: React.KeyboardEvent) => {
    const m: Record<string, number> = { ArrowRight: step + 1, ArrowUp: step + 1, ArrowLeft: step - 1, ArrowDown: step - 1, Home: 0, End: n - 1 }
    if (e.key in m) { e.preventDefault(); setPlaying(false); settle(m[e.key]) }
  }
  const cw = Math.min(340, W - 60)
  const btn = "grid size-11 place-items-center rounded-full border border-border bg-card outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-35"
  const isLast = step === n - 1
  return (
    <div className="mx-auto w-full max-w-3xl" style={{ "--sp-gold": accentColor } as React.CSSProperties}>
      <section aria-roledescription="carrousel" aria-label={title} className={cn("relative w-full overflow-hidden rounded-3xl border border-border bg-white/50 p-5 pb-6 text-foreground backdrop-blur-md", className)}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 40% at 50% 0%, color-mix(in oklab, ${GOLD} 20%, transparent), transparent), radial-gradient(50% 40% at 100% 100%, color-mix(in oklab, var(--primary) 16%, transparent), transparent)` }} />
        <div className="relative flex items-center justify-between">
          <div><h2 className="text-lg font-semibold tracking-tight">{title}</h2><p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">Étape {step + 1} sur {n} : {steps[step]?.title}{playing ? " · lecture auto" : ""}</p></div>
          <div className="flex items-center gap-2">
            <button type="button" aria-pressed={playing} aria-label={playing ? "Mettre la lecture en pause" : "Lancer la lecture"} onClick={() => setPlaying((p) => !p)} className={btn}>{playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}</button>
          </div>
        </div>

        <div ref={box} className="relative mt-3 touch-none select-none" style={{ height: PH }}>
          <svg width={W} height={PH} className="absolute inset-0 overflow-visible" aria-hidden>
            <defs><linearGradient id="sp-grad" x1="0" x2="1"><stop offset="0" stopColor="var(--primary)" /><stop offset="1" stopColor={GOLD} /></linearGradient></defs>
            <path d={route} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 11" className="stroke-border" />
            <motion.path d={filled} fill="none" strokeWidth="6" strokeLinecap="round" stroke="url(#sp-grad)" style={{ filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 55%, transparent))" }} />
          </svg>
          {steps.map((s, i) => {
            const t = i / last
            return (
              <button key={s.id} type="button" tabIndex={-1} aria-label={`Aller à l'étape ${i + 1} : ${s.title}`} onClick={() => { setPlaying(false); settle(i) }} className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none after:absolute after:-inset-2 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-11" style={{ left: PAD + t * (W - PAD * 2), top: wave(t) }}>
                <motion.span className={cn("grid size-5 place-items-center rounded-full border-2 text-[10px] font-bold sm:size-7 sm:text-xs", i <= step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")} animate={{ scale: i === step ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}>
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
            <div role="slider" tabIndex={0} aria-label="Étape" aria-orientation="horizontal" aria-valuemin={1} aria-valuemax={n} aria-valuenow={step + 1} aria-valuetext={`Étape ${step + 1} : ${steps[step]?.title}`} onKeyDown={key} onPointerDown={begin("knob")} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
              className="grid size-7 cursor-grab place-items-center rounded-full outline-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-11">
              <motion.span className="block size-5 rounded-full border-[3px] border-card sm:size-7" style={{ background: `linear-gradient(135deg,${GOLD},var(--primary))`, boxShadow: `0 0 0 2px var(--primary), 0 8px 18px -4px color-mix(in oklab, var(--primary) 70%, transparent)` }} whileTap={reduce ? undefined : { scale: 1.2 }} />
            </div>
          </motion.div>
        </div>

        <div onPointerDown={begin("card")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} className="relative mt-2 h-[19rem] touch-pan-y cursor-grab select-none active:cursor-grabbing" style={{ perspective: 1000 }}>
          <ul className="relative h-full">{steps.map((s, i) => <StepCard key={s.id} s={s} i={i} pos={pos} w={cw} reduce={reduce} active={i === step} total={n} />)}</ul>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-3">
          <button type="button" className={btn} aria-label="Étape précédente" disabled={step === 0} onClick={() => { setPlaying(false); settle(step - 1) }}><ArrowLeft className="size-4" aria-hidden /></button>
          <p className="text-center text-xs text-muted-foreground">Faites glisser le curseur ou balayez les cartes</p>
          <button type="button" onClick={() => { setPlaying(false); settle(isLast ? 0 : step + 1) }} className="flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {isLast ? <>Recommencer <RotateCcw className="size-4" aria-hidden /></> : <>Suivant <ArrowRight className="size-4" aria-hidden /></>}
          </button>
        </div>
      </section>
    </div>
  )
}
