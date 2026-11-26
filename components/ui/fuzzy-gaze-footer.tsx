"use client"

import { useEffect, useId, useRef, useState, type CSSProperties } from "react"

/**
 * FuzzyGazeFooter
 *
 * A full-screen footer with one huge fuzzy creature rising from the bottom edge. Its
 * heavy-lidded eyes follow the cursor, blink, and wander when nobody is moving. Two link
 * columns sit on each side of a script wordmark that dissolves into mist when you hover
 * it and then re-forms; a fat email line sits on the creature's belly.
 *
 * The creature is one picture with its eyes shut. The open eyes are drawn on top of the
 * two felt balls and clipped at the lid line, so the lids are the picture itself.
 *
 * Install-safe: one file, fonts embedded as subsets, no percentage height in flow, and the
 * root takes a definite min-height from the `height` prop.
 */

export interface FooterLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

/** One closed eye in the picture: centre and radius as fractions of the picture (x and r of its width, y of its height). */
export interface FooterEye {
  x: number
  y: number
  r: number
}

export interface FuzzyGazeFooterProps {
  /** Script word at the top centre. Hover or focus turns it to mist. */
  wordmark?: string
  wordmarkHref?: string
  /** Link columns. The first half sits left of the wordmark, the rest right of it. */
  columns?: FooterColumn[]
  /** Shown in capitals on the creature and used for the mailto link. */
  email?: string
  /** The creature, eyes shut, 3:2, on a flat background that matches `background`. */
  image?: string
  /** A smaller copy of the same picture for narrow screens. */
  imageSmall?: string
  /** Where the shut eyes are in the picture. */
  eyes?: FooterEye[]
  /** Where the top of the creature's head is in the picture, as a fraction of its height. */
  crown?: number
  /** Footer colour. Must match the picture's own background. */
  background?: string
  /** Minimum height of the footer. A definite length. */
  height?: string
  className?: string
  style?: CSSProperties
}

const IMG_BASE = "https://kedhar-components.pages.dev/fuzzy-gaze-footer/"

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Wander",
    links: [
      { label: "Projects", href: "#" },
      { label: "Studio", href: "#" },
      { label: "Sketchbook", href: "#" },
      { label: "Journal", href: "#" },
    ],
  },
  {
    title: "Follow",
    links: [
      { label: "Newsletter", href: "#" },
      { label: "Podcast", href: "#" },
      { label: "Feed", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Small print",
    links: [
      { label: "Uses", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Thanks", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
  {
    title: "Reach out",
    links: [
      { label: "Say hi", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Book a chat", href: "#" },
      { label: "Start a brief", href: "#" },
    ],
  },
]

const DEFAULT_EYES: FooterEye[] = [
  { x: 0.4349, y: 0.5107, r: 0.0456 },
  { x: 0.5641, y: 0.5107, r: 0.0456 },
]

/** The picture is 3:2; eye boxes are placed against it. */
const ASPECT = 1.5

// #region gaze
/** How the eyes behave. Angles in radians, sizes as fractions of the eye's diameter. */
const GAZE = {
  reach: (52 * Math.PI) / 180, // how far round the ball a pupil can turn
  travel: 0.86, // of the eye's radius, at a quarter turn
  falloff: 1.4, // eye diameters at which the pull is about half
  pupil: 0.47,
  lift: 0.1, // looking up travels this much of the way, so a pupil tucks under the lid but never vanishes
  lid: 0.47, // share of the eye the lid covers when looking straight ahead
  lidOpen: 0.09, // how much it opens when looking down
  lidDroop: 0.01, // and droops when looking up
  ease: 0.11, // seconds
}

/** Where an eye wants to look for a target dx,dy away (px) when it is d px across. Length 0..1. */
function gazeFor(dx: number, dy: number, d: number) {
  const dist = Math.hypot(dx, dy)
  if (dist < 0.001 || d <= 0) return { x: 0, y: 0 }
  const m = 1 - Math.exp(-dist / (GAZE.falloff * d))
  return { x: (dx / dist) * m, y: (dy / dist) * m }
}

/**
 * The pupil for a gaze of length 0..1: its offset in percent of its own size, the angle of
 * the gaze, and how much the ball's curve flattens it along that angle.
 */
function pupilPose(gx: number, gy: number) {
  const length = Math.hypot(gx, gy)
  const full = (GAZE.travel * 50) / GAZE.pupil // offset of a pupil turned a quarter of the way round
  const reach = length < 0.0001 ? 0 : (full * Math.sin(Math.min(1, length) * GAZE.reach)) / length
  const x = gx * reach
  const y = gy * reach * (gy < 0 ? GAZE.lift : 1)
  const turned = Math.min(1, Math.hypot(x, y) / full)
  return { x, y, angle: Math.atan2(y, x), squash: Math.sqrt(1 - turned * turned) }
}

/** Share of the eye under the lid, 0..1. It rides the gaze and shuts on a blink (0..1). */
function lidFor(gy: number, blink: number) {
  const open = GAZE.lid - Math.min(1, Math.max(-1, gy)) * (gy > 0 ? GAZE.lidOpen : GAZE.lidDroop)
  // a shut lid goes a little past the bottom, so its rim leaves the eye as well
  return open + (1.04 - open) * Math.min(1, Math.max(0, blink))
}

/** A blink, t ms after it starts: shut in 80, held 40, open again by 270. */
function blinkAt(t: number) {
  if (t <= 0 || t >= 270) return 0
  if (t < 80) return ease(t / 80)
  if (t < 120) return 1
  return 1 - ease((t - 120) / 150)
}

function ease(t: number) {
  return t * t * (3 - 2 * t)
}

/**
 * The wordmark's mist for an amount 0..1 at a font size (px): how far the noise pushes
 * the letters, the blur that turns them to cloud, the grain that eats the cloud
 * (k1 * cloud * grain + k2 * cloud) and the opacity.
 */
function mistAt(amount: number, fontSize: number) {
  const a = ease(Math.min(1, Math.max(0, amount)))
  const unit = fontSize / 76
  return { push: 24 * a * unit, blur: 4.4 * a * unit, k1: 1.6 * a, k2: 1 - 0.96 * a, opacity: 1 - 0.5 * a }
}

/** How far to slide the picture (a share of its width) so the eyes, not the frame, sit on the centre line. */
function eyeShift(eyes: { x: number }[]) {
  if (!eyes.length) return 0
  const mid = eyes.reduce((sum, eye) => sum + eye.x, 0) / eyes.length
  return Math.round((0.5 - mid) * 1e5) / 1e5
}

/** The lowest point of the eyes, as a fraction of the picture's height. The picture is sized so this clears the email. */
function eyeFloor(eyes: { y: number; r: number }[], crown: number) {
  const low = eyes.reduce((max, eye) => Math.max(max, eye.y + eye.r * 1.5), crown + 0.2)
  return Math.round(low * 1e4) / 1e4
}

/** Mist timing, ms: dissolve, stay (counted from the last hover), re-form. */
const MIST = { rise: 500, hold: 1300, fall: 600 }
// #endregion

// Scoped styles. The three fonts are subsets (capitals and figures for the display face),
// embedded so an installed footer fetches no font files.
const CSS =
  "@font-face{font-family:FgfDisplay;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  "@font-face{font-family:FgfScript;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  ".fgf-root{position:relative;isolation:isolate;overflow:hidden;container-type:inline-size;box-sizing:border-box;width:100%;background:var(--fgf-bg);color:#fff;font-family:FgfSans,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-size:16.5px;font-weight:500;line-height:20px;text-align:left;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}" +
  ".fgf-root *,.fgf-root *::before,.fgf-root *::after{box-sizing:border-box}" +
  ".fgf-in{display:flex;flex-direction:column;min-height:inherit;padding:57px 40px 40px}" +
  ".fgf-defs{position:absolute;width:0;height:0;overflow:hidden}" +
  ".fgf-art,.fgf-gap{--fgf-w:calc(max(100cqw,640px) * 1.006);--fgf-a:calc(var(--fgf-w) / 1.5)}" +
  ".fgf-art{--fgf-top:max(26%,calc(290px - (100cqw - 1024px) * .4));position:absolute;z-index:-1;left:50%;top:max(var(--fgf-top),calc(100% - var(--fgf-a) * (1 - var(--fgf-crown))));height:min(var(--fgf-a),calc((100% - 96px - var(--fgf-top)) / (var(--fgf-chin) - var(--fgf-crown))));aspect-ratio:3 / 2;transform:translate(calc(-50% + var(--fgf-shift) * 100%),calc(var(--fgf-crown) * -100%));pointer-events:none;user-select:none}" +
  ".fgf-img{position:absolute;left:0;top:0;right:0;bottom:0;display:block;width:100%;height:100%;max-width:none;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 9%),linear-gradient(to right,transparent,#000 4%,#000 96%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to bottom,transparent,#000 9%),linear-gradient(to right,transparent,#000 4%,#000 96%,transparent);mask-composite:intersect}" +
  ".fgf-eye{--fgf-lid:47%;position:absolute;aspect-ratio:1;border-radius:50%;overflow:hidden;opacity:0;transition:opacity .35s ease}" +
  ".fgf-art[data-ready] .fgf-eye{opacity:1}" +
  ".fgf-rim{position:absolute;left:-113%;top:0;width:326%;height:326%;border-radius:50%;background:radial-gradient(closest-side,rgba(196,208,255,0) 98.1%,rgba(196,208,255,.5) 98.5%,rgba(170,186,250,.34) 100%);transform:translateY(calc((var(--fgf-lid) - 3%) / 3.26))}" +
  ".fgf-ball{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 46% 38%,#fff 0,#fcfcff 42%,#eceefa 66%,#cfd4f1 86%,#aab2e2 100%);clip-path:circle(160% at 50% calc(var(--fgf-lid) + 160%))}" +
  ".fgf-pupil{position:absolute;left:26.5%;top:26.5%;width:47%;height:47%;border-radius:50%;background:radial-gradient(circle at 50% 42%,#1a1a22 0,#050507 70%);transform:translate(0%,14%)}" +
  ".fgf-shade{position:absolute;left:-110%;top:0;width:320%;height:320%;border-radius:50%;background:radial-gradient(closest-side,rgba(70,86,180,0) 92%,rgba(70,86,180,.1) 95.4%,rgba(60,76,170,.3) 98.6%,rgba(48,62,150,.6) 100%);transform:translateY(calc(var(--fgf-lid) / 3.2))}" +
  ".fgf-top{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:start}" +
  ".fgf-nav{display:flex;grid-row:1}" +
  ".fgf-nav-a{grid-column:1;justify-self:start}" +
  ".fgf-nav-b{grid-column:3;justify-self:end}" +
  ".fgf-col{min-width:clamp(140px,12cqw,172px)}" +
  ".fgf-col:last-child{min-width:0}" +
  ".fgf-head{margin:0 0 27px;font-family:FgfDisplay,'Arial Black',Impact,sans-serif;font-size:16px;font-weight:400;line-height:22px;letter-spacing:0;text-transform:uppercase;color:#fffbea;white-space:nowrap}" +
  ".fgf-list{display:grid;row-gap:26px;margin:0;padding:0;list-style:none}" +
  ".fgf-list li{display:block;margin:0;padding:0}" +
  ".fgf-link{position:relative;display:inline-block;color:rgba(255,255,255,.82);text-decoration:none;white-space:nowrap;outline:none;transition:color .2s ease}" +
  ".fgf-link::after,.fgf-mail::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:1.5px;border-radius:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .32s cubic-bezier(.2,.7,.2,1)}" +
  ".fgf-link:focus-visible,.fgf-mail:focus-visible{color:#fff}" +
  ".fgf-link:focus-visible::after,.fgf-mail:focus-visible::after{transform:scaleX(1);transform-origin:0 50%}" +
  ".fgf-logo{grid-column:2;grid-row:1;justify-self:center;display:block;margin-top:-16px;padding:0 12px;color:#fff;text-decoration:none;outline:none;border-radius:12px}" +
  ".fgf-logo:focus-visible,.fgf-link:focus-visible,.fgf-mail:focus-visible{outline:2px solid #fff;outline-offset:6px}" +
  ".fgf-word{display:block;font-family:FgfScript,'Brush Script MT','Segoe Script',cursive;font-size:clamp(58px,5.3cqw,76px);font-weight:400;line-height:1;white-space:nowrap;-webkit-text-stroke:.012em currentColor}" +
  ".fgf-gap{flex:1 0 auto;min-height:200px}" +
  ".fgf-mail{position:relative;align-self:center;max-width:100%;font-family:FgfDisplay,'Arial Black',Impact,sans-serif;font-size:clamp(17px,5.6cqw,26px);font-weight:400;line-height:1;text-transform:uppercase;text-decoration:none;white-space:nowrap;color:#fffbea;text-shadow:0 1px 10px rgba(52,66,150,.28)}" +
  ".fgf-mail::after{bottom:-9px;height:2px}" +
  "@media (hover:hover){.fgf-link:hover,.fgf-mail:hover{color:#fff}.fgf-link:hover::after,.fgf-mail:hover::after{transform:scaleX(1);transform-origin:0 50%}}" +
  "@container (max-width:959px){.fgf-top{grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:24px;row-gap:40px}.fgf-logo{grid-column:1 / -1;grid-row:1;margin-top:-14px}.fgf-nav{grid-row:2;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:24px;justify-self:stretch}.fgf-nav-a{grid-column:1}.fgf-nav-b{grid-column:2}.fgf-col,.fgf-col:last-child{min-width:0}.fgf-gap{min-height:calc(var(--fgf-a) * (1 - var(--fgf-crown)) - 30px)}}" +
  "@container (max-width:599px){.fgf-in{padding:44px 24px 34px}.fgf-top{row-gap:34px}.fgf-nav-a,.fgf-nav-b{grid-column:1 / -1}.fgf-nav-b{grid-row:3}.fgf-head{margin-bottom:19px}.fgf-list{row-gap:18px}}" +
  "@media (prefers-reduced-motion:reduce){.fgf-link,.fgf-link::after,.fgf-mail::after,.fgf-eye{transition:none}}"

export function FuzzyGazeFooter({
  wordmark = "Wooly",
  wordmarkHref = "#",
  columns = DEFAULT_COLUMNS,
  email = "hello@example.com",
  image = IMG_BASE + "creature.webp",
  imageSmall = IMG_BASE + "creature-960.webp",
  eyes = DEFAULT_EYES,
  crown = 0.161,
  background = "#90acf7",
  height = "100svh",
  className,
  style,
}: FuzzyGazeFooterProps) {
  const rootRef = useRef(null as HTMLElement | null)
  const artRef = useRef(null as HTMLDivElement | null)
  const imgRef = useRef(null as HTMLImageElement | null)
  const wordRef = useRef(null as HTMLSpanElement | null)
  const filterRef = useRef(null as SVGFilterElement | null)
  const [ready, setReady] = useState(false)
  const filterId = "fgf-mist-" + useId().replace(/[^a-zA-Z0-9]/g, "")

  // a cached picture can finish before React attaches onLoad
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) setReady(true)
  }, [image])

  // ---- eyes: follow the pointer, wander when it is still, blink ----
  useEffect(() => {
    const root = rootRef.current
    const art = artRef.current
    if (!root || !art || !ready) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const eyeEls = Array.from(art.querySelectorAll(".fgf-eye")) as HTMLElement[]
    const pupils = eyeEls.map((el) => el.querySelector(".fgf-pupil") as HTMLElement)
    const look = eyeEls.map(() => ({ x: 0, y: 0.12 }))
    const pointer = { x: 0, y: 0, at: -1e9 }
    let wander = { x: 0, y: 0, until: 0 }
    let blinkStart = performance.now() + 1400 + Math.random() * 2200
    let onScreen = true
    let raf = 0
    let last = performance.now()

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.at = performance.now()
    }
    const wake = () => {
      if (onScreen && !document.hidden && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    function frame(now: number) {
      raf = 0
      if (!onScreen || document.hidden) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const box = art!.getBoundingClientRect()
      const idle = now - pointer.at > 2600
      if (idle && now > wander.until) {
        // look somewhere new around the face: mostly sideways, a little up or down
        wander = {
          x: (Math.random() - 0.5) * box.width * 0.9,
          y: (Math.random() - 0.35) * box.height * 0.5,
          until: now + 1300 + Math.random() * 2200,
        }
      }
      if (now - blinkStart > 270) blinkStart = now + 2400 + Math.random() * 3800
      const blink = blinkAt(now - blinkStart)
      const k = 1 - Math.exp(-dt / GAZE.ease)
      for (let i = 0; i < eyeEls.length; i++) {
        const eye = eyes[i]
        if (!eye) continue
        const cx = box.left + eye.x * box.width
        const cy = box.top + eye.y * box.height
        const want = gazeFor(
          (idle ? cx + wander.x : pointer.x) - cx,
          (idle ? cy + wander.y : pointer.y) - cy,
          eye.r * 2 * box.width,
        )
        const s = look[i]
        s.x += (want.x - s.x) * k
        s.y += (want.y - s.y) * k
        const p = pupilPose(s.x, s.y)
        pupils[i].style.transform =
          "translate(" + p.x.toFixed(2) + "%," + p.y.toFixed(2) + "%) rotate(" + p.angle.toFixed(3) + "rad) scaleX(" + p.squash.toFixed(3) + ")"
        eyeEls[i].style.setProperty("--fgf-lid", (lidFor(s.y, blink) * 100).toFixed(2) + "%")
      }
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      wake()
    })
    io.observe(root)
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    document.addEventListener("visibilitychange", wake)
    wake()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      document.removeEventListener("visibilitychange", wake)
    }
  }, [ready, eyes])

  // ---- wordmark: hover or focus turns it to mist, then it re-forms ----
  useEffect(() => {
    const word = wordRef.current
    const filter = filterRef.current
    const link = word ? word.parentElement : null
    if (!word || !filter || !link) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const push = filter.querySelector("feDisplacementMap")!
    const blur = filter.querySelector("feGaussianBlur")!
    const mix = filter.querySelector("feComposite")!
    let amount = 0
    let goal = 0
    let holdUntil = 0
    let raf = 0
    let last = 0

    const paint = () => {
      if (amount <= 0.001) {
        // back to plain text: crisp glyphs and no filter cost at rest
        word.style.filter = ""
        word.style.opacity = ""
        return
      }
      const m = mistAt(amount, parseFloat(getComputedStyle(word).fontSize) || 76)
      push.setAttribute("scale", m.push.toFixed(2))
      blur.setAttribute("stdDeviation", m.blur.toFixed(2))
      mix.setAttribute("k1", m.k1.toFixed(3))
      mix.setAttribute("k2", m.k2.toFixed(3))
      word.style.filter = "url(#" + filterId + ")"
      word.style.opacity = m.opacity.toFixed(3)
    }
    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      if (goal === 1 && amount >= 1 && now >= holdUntil) goal = 0
      amount = goal === 1 ? Math.min(1, amount + dt / MIST.rise) : Math.max(0, amount - dt / MIST.fall)
      paint()
      raf = amount > 0 || goal === 1 ? requestAnimationFrame(frame) : 0
    }
    const start = () => {
      goal = 1
      holdUntil = performance.now() + MIST.hold
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    link.addEventListener("pointerenter", start)
    link.addEventListener("focus", start)
    return () => {
      cancelAnimationFrame(raf)
      link.removeEventListener("pointerenter", start)
      link.removeEventListener("focus", start)
      word.style.filter = ""
      word.style.opacity = ""
    }
  }, [filterId])

  const half = Math.ceil(columns.length / 2)
  const sides = [columns.slice(0, half), columns.slice(half)]

  return (
    <footer
      ref={rootRef}
      className={"fgf-root" + (className ? " " + className : "")}
      style={{
        minHeight: height,
        ["--fgf-bg" as string]: background,
        ["--fgf-crown" as string]: crown,
        ["--fgf-chin" as string]: eyeFloor(eyes, crown),
        ["--fgf-shift" as string]: eyeShift(eyes),
        ...style,
      }}
    >
      <style>{CSS}</style>
      <svg className="fgf-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter ref={filterRef} id={filterId} x="-30%" y="-70%" width="160%" height="240%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" seed="11" result="drift" />
          <feDisplacementMap in="SourceGraphic" in2="drift" scale="0" xChannelSelector="R" yChannelSelector="G" result="moved" />
          <feGaussianBlur in="moved" stdDeviation="0" result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 3 -1.05" result="grain" />
          <feComposite in="soft" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" result="eroded" />
          <feGaussianBlur in="eroded" stdDeviation="0.5" />
        </filter>
      </svg>

      <div
        ref={artRef}
        className="fgf-art"
        aria-hidden="true"
        data-ready={ready ? "" : undefined}
      >
        <img
          ref={imgRef}
          className="fgf-img"
          src={image}
          srcSet={imageSmall ? imageSmall + " 960w, " + image + " 1536w" : undefined}
          sizes={imageSmall ? "max(100vw, 640px)" : undefined}
          width={1536}
          height={1024}
          alt=""
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
          style={{ maxWidth: "none" }}
        />
        {eyes.map((eye, i) => (
          <span
            key={i}
            className="fgf-eye"
            style={{
              left: (eye.x - eye.r) * 100 + "%",
              top: (eye.y - eye.r * ASPECT) * 100 + "%",
              width: eye.r * 200 + "%",
            }}
          >
            <span className="fgf-rim" />
            <span className="fgf-ball">
              <span className="fgf-pupil" />
              <span className="fgf-shade" />
            </span>
          </span>
        ))}
      </div>

      <div className="fgf-in">
        <div className="fgf-top">
          {sides.map((side, s) => (
            <nav key={s} className={"fgf-nav " + (s === 0 ? "fgf-nav-a" : "fgf-nav-b")} aria-label={s === 0 ? "Footer" : "Footer, more"}>
              {side.map((column) => (
                <div key={column.title} className="fgf-col">
                  <h3 className="fgf-head">{column.title}</h3>
                  <ul className="fgf-list">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a className="fgf-link" href={link.href}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          ))}
          <a className="fgf-logo" href={wordmarkHref} aria-label={wordmark}>
            <span ref={wordRef} className="fgf-word" aria-hidden="true">
              {wordmark}
            </span>
          </a>
        </div>

        <div className="fgf-gap" />

        <a className="fgf-mail" href={"mailto:" + email}>
          {email}
        </a>
      </div>
    </footer>
  )
}

export default FuzzyGazeFooter;
