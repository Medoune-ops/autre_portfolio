"use client";

// Tool Wheel by Louis Studios.
// 220 more hand-made React components at https://studios.lou15.com/?ref=21st-code

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** One tool on the wheel. */
export interface ToolWheelItem {
  /** Name of the tool, read out to screen readers when it comes to the front. */
  label: string;
  /** Short description shown under the label in the hub when `showDetails` is on. */
  description?: string;
  /** Solid icon as SVG path data drawn in a 24 x 24 box. Leave out for a plain dot. */
  path?: string;
  /** Fill rule for the icon path. Simple Icons paths use `nonzero`. */
  fillRule?: "evenodd" | "nonzero";
}

export interface ToolWheelProps {
  /** Tools riding the wheel, in order. Nine or more keeps every visible slot unique. */
  items?: ToolWheelItem[];
  /** Controlled index of the tool resting in the bottom slot. Autoplay stops while this is set. */
  active?: number;
  /** Starting index when uncontrolled. */
  defaultActive?: number;
  /** Called with the new index whenever a tool settles into the bottom slot. */
  onActiveChange?: (index: number) => void;
  /** Step the wheel on its own when uncontrolled. */
  autoplay?: boolean;
  /** Seconds between steps; the signal loops once per step. */
  interval?: number;
  /** Hold the wheel still while a mouse rests over it. */
  pauseOnHover?: boolean;
  /** Show the active tool's name and description in the hub. */
  showDetails?: boolean;
  /** Accessible name for the wheel. Falls back to the title. */
  ariaLabel?: string;
  /** Small caps label above the title, between two accent squares. Empty hides it. */
  eyebrow?: string;
  /** Serif headline. Empty hides it. */
  title?: string;
  /** Supporting line under the title. Empty hides it. */
  subtitle?: string;
  /** SVG path data for the hub mark, drawn in the `markViewBox` box. */
  markPath?: string;
  /** View box of `markPath` as "minX minY width height". */
  markViewBox?: string;
  /** Page background behind the section. */
  background?: string;
  /** Fill of the tool discs and the hub. */
  surface?: string;
  /** Ink for icons, the headline and the eyebrow. */
  color?: string;
  /** Colour of the subtitle and the eyebrow brackets. */
  mutedColor?: string;
  /** Hub mark and eyebrow squares. */
  accent?: string;
  /** The travelling signal and the code glyphs around the bottom slot. */
  signal?: string;
  /** Hairlines: the wheel, the connector and the section frame. */
  lineColor?: string;
  /** Draw the hairline frame around the section. */
  frame?: boolean;
  /** Font stack for the headline. */
  font?: string;
  /** Font stack for the eyebrow and the subtitle. */
  uiFont?: string;
  /** Font stack for the code glyphs. */
  monoFont?: string;
  /** Class on the root element. */
  className?: string;
  /** Inline style merged onto the root element. */
  style?: React.CSSProperties;
}

const LS_MARK =
  "M466.0 847.5C468.2 847.2 470.5 846.7 472.5 845.8C484.4 840.0 495.5 832.8 507.5 827.3C512.6 825.0 518.1 823.6 523.5 822.3C528.1 821.3 532.8 820.6 537.5 820.3C543.5 820.0 549.5 820.2 555.5 820.7C566.2 821.5 576.8 823.3 587.5 824.3C594.5 825.0 601.5 825.6 608.5 825.6C637.2 825.9 665.8 824.9 694.5 825.3C699.9 825.4 705.2 826.3 710.5 827.3C719.2 829.0 727.7 832.0 736.5 833.3C743.4 834.3 750.5 834.3 757.5 834.3C760.5 834.2 763.5 833.6 766.5 833.0C789.2 828.2 811.9 823.2 834.5 818.0C837.1 817.4 839.6 816.5 842.0 815.5C844.9 814.3 847.9 813.1 850.5 811.3C853.8 808.9 857.0 806.2 859.5 803.0C861.2 800.8 862.1 798.1 862.8 795.5C863.3 793.6 863.3 791.5 863.0 789.5C862.8 787.4 862.4 785.3 861.4 783.5C859.9 780.9 858.1 778.5 855.9 776.5C853.4 774.2 850.6 772.2 847.5 770.7C838.0 766.0 827.9 762.8 818.5 758.0C815.2 756.3 812.3 754.0 809.6 751.5C807.9 749.9 806.3 748.1 805.5 745.9C804.3 742.6 803.4 739.0 803.7 735.5C804.7 722.7 807.8 710.2 809.3 697.5C809.9 692.9 809.9 688.2 809.8 683.5C809.8 679.8 809.6 676.1 809.1 672.5C808.5 668.1 807.8 663.8 806.6 659.5C805.7 655.7 804.4 652.1 802.8 648.5C801.3 645.0 799.5 641.7 797.5 638.4C795.6 635.3 793.5 632.2 791.1 629.5C786.9 624.9 782.7 620.3 777.8 616.5C772.1 612.0 765.9 608.1 759.5 604.6C752.8 601.0 745.7 597.9 738.5 595.4C723.0 590.0 707.1 585.9 691.5 580.9C687.4 579.6 683.3 578.3 679.5 576.4C675.6 574.5 671.8 572.1 668.4 569.5C667.0 568.5 666.0 567.0 665.2 565.5C664.3 563.9 663.6 562.3 663.2 560.5C662.9 558.9 662.9 557.2 663.1 555.5C663.3 554.1 663.7 552.7 664.5 551.5C666.2 549.1 668.0 546.6 670.5 545.0C673.5 543.0 677.0 541.7 680.5 540.9C685.1 539.9 689.8 539.6 694.5 539.7C700.2 539.8 705.9 540.4 711.5 541.5C716.6 542.5 721.6 544.0 726.5 545.8C731.0 547.5 735.3 549.6 739.5 552.0C746.0 555.8 751.8 560.7 758.5 564.3C760.0 565.0 761.8 565.0 763.5 564.8C765.2 564.6 767.0 564.0 768.5 563.1C771.1 561.6 773.4 559.6 775.5 557.5C785.4 548.0 795.0 538.2 804.5 528.3C806.5 526.2 808.5 523.9 810.1 521.5C811.0 520.3 811.7 518.9 812.0 517.5C812.4 515.5 812.5 513.5 812.1 511.5C811.7 509.5 810.7 507.7 809.5 506.1C807.4 503.3 805.0 500.8 802.4 498.5C798.0 494.6 793.4 490.9 788.5 487.6C782.4 483.7 776.1 479.9 769.5 477.0C761.1 473.2 752.4 469.9 743.5 467.4C734.3 464.8 724.9 463.0 715.5 461.9C705.2 460.7 694.8 460.3 684.5 460.5C675.5 460.6 666.4 461.5 657.5 463.1C649.4 464.5 641.3 466.6 633.5 469.3C626.6 471.7 619.9 474.8 613.5 478.5C607.5 481.9 602.0 486.1 596.5 490.4C593.8 492.5 591.4 495.0 589.0 497.5C586.2 500.7 583.4 504.0 580.9 507.5C578.9 510.4 577.0 513.4 575.4 516.5C573.8 519.4 572.5 522.4 571.3 525.5C570.3 528.1 569.3 530.8 568.6 533.5C567.6 537.8 566.6 542.1 566.0 546.5C565.5 550.1 565.2 553.8 565.2 557.5C565.1 561.8 565.0 566.2 565.6 570.5C566.5 577.2 567.7 583.9 569.5 590.5C570.4 594.0 571.8 597.3 573.4 600.5C574.9 603.6 576.6 606.6 578.6 609.5C580.7 612.6 583.1 615.7 585.6 618.5C588.1 621.2 590.6 623.9 593.5 626.2C598.7 630.3 604.0 634.2 609.7 637.5C617.1 641.7 624.8 645.5 632.8 648.5C647.8 654.2 663.4 658.2 678.5 663.8C684.0 665.8 689.4 668.3 694.5 671.2C697.1 672.6 699.5 674.4 701.6 676.5C703.2 678.2 704.7 680.3 705.5 682.5C706.2 684.4 706.5 686.5 706.1 688.5C705.5 690.7 704.2 692.8 702.7 694.5C701.0 696.4 698.8 697.8 696.5 698.9C693.7 700.3 690.6 701.3 687.5 702.0C683.9 702.9 680.2 703.6 676.5 703.8C671.3 704.1 666.0 704.2 660.8 703.5C653.2 702.4 645.8 700.5 638.5 698.4C633.7 697.0 629.1 695.1 624.5 693.1C617.7 690.1 611.4 686.0 604.5 683.4C602.3 682.6 599.8 682.6 597.5 682.9C595.9 683.0 594.4 683.7 593.0 684.5C591.0 685.6 589.2 687.1 587.5 688.6C582.0 693.4 576.6 698.4 571.3 703.5C566.4 708.3 561.6 713.3 556.9 718.5C554.7 721.0 552.3 723.5 550.7 726.5C548.4 730.6 547.6 735.3 545.5 739.5C544.9 740.8 543.7 741.8 542.5 742.6C541.3 743.3 539.9 743.6 538.5 743.8C536.5 744.0 534.4 744.3 532.5 743.7C530.0 743.0 527.6 741.8 525.5 740.1C523.6 738.6 522.1 736.6 520.8 734.5C519.5 732.3 518.5 729.9 517.8 727.5C516.6 723.6 515.6 719.6 515.2 715.5C513.9 703.9 512.9 692.2 512.8 680.5C512.0 565.2 512.8 449.8 512.5 334.5C512.5 331.8 512.2 329.1 511.7 326.5C511.3 324.8 510.7 323.0 509.8 321.5C509.0 320.2 507.8 319.0 506.5 318.1C505.0 317.2 503.3 316.5 501.5 316.0C499.5 315.5 497.5 315.3 495.5 315.3C474.2 315.1 452.8 314.9 431.5 315.3C428.8 315.4 426.0 315.7 423.5 316.6C421.4 317.4 419.5 318.8 418.0 320.5C416.7 321.9 416.0 323.8 415.5 325.7C414.8 328.2 414.5 330.9 414.5 333.5C414.2 454.5 415.1 575.5 414.6 696.5C414.5 705.8 414.1 715.2 412.9 724.5C412.3 729.6 411.1 734.7 409.2 739.5C407.6 743.4 405.4 747.2 402.5 750.3C399.4 753.5 395.5 756.0 391.5 758.0C383.1 762.1 374.0 764.5 365.5 768.2C361.4 770.0 357.3 772.1 353.5 774.5C351.5 775.9 349.9 777.7 348.3 779.5C347.2 780.7 346.3 782.1 345.6 783.5C344.7 785.1 343.8 786.7 343.4 788.5C342.8 791.4 342.6 794.5 342.7 797.5C342.8 798.9 343.2 800.2 343.8 801.5C344.9 803.9 346.1 806.4 347.8 808.5C349.7 810.9 352.0 813.0 354.5 814.8C356.8 816.4 359.4 817.5 362.0 818.5C365.4 819.7 368.9 820.8 372.5 821.3C382.4 822.8 392.5 823.2 402.5 824.7C406.6 825.2 410.6 826.2 414.5 827.3C417.4 828.2 420.3 829.2 423.0 830.5C432.6 835.3 441.8 841.0 451.5 845.8C453.7 846.8 456.1 847.5 458.5 847.8C461.0 848.0 463.5 847.9 466.0 847.5Z";

const DEFAULT_ITEMS: ToolWheelItem[] = [
  { label: "Docs", path: "M6 2.5h8.2l5.3 5.3V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5Zm7.4 1.9v4.5h4.5ZM8 12.2V14h8v-1.8Zm0 3.9v1.8h5.6v-1.8Z" },
  { label: "Chat", path: "M4 4h16a1.5 1.5 0 0 1 1.5 1.5v10.4A1.5 1.5 0 0 1 20 17.4h-9.1L6.1 21.2v-3.8H4a1.5 1.5 0 0 1-1.5-1.5V5.5A1.5 1.5 0 0 1 4 4Zm3.9 5.4a1.45 1.45 0 1 0 0 2.9a1.45 1.45 0 1 0 0-2.9Zm4.1 0a1.45 1.45 0 1 0 0 2.9a1.45 1.45 0 1 0 0-2.9Zm4.1 0a1.45 1.45 0 1 0 0 2.9a1.45 1.45 0 1 0 0-2.9Z" },
  { label: "Code", path: "M12 1.5a10.5 10.5 0 1 0 0 21a10.5 10.5 0 1 0 0-21Zm-2.3 6.6 1.3 1.3L8.4 12l2.6 2.6-1.3 1.3L5.8 12Zm4.6 0L18.2 12l-3.9 3.9-1.3-1.3 2.6-2.6-2.6-2.6Z" },
  { label: "Mail", path: "M3.5 4.8h17A1.5 1.5 0 0 1 22 6.3v11.4a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 17.7V6.3a1.5 1.5 0 0 1 1.5-1.5Zm.8 2.4v1.7l7.7 5 7.7-5V7.2L12 12.2Z" },
  { label: "Spark", path: "M12 1.5Q13.3 10.7 22.5 12Q13.3 13.3 12 22.5Q10.7 13.3 1.5 12Q10.7 10.7 12 1.5Z" },
  { label: "Cloud", path: "M7.2 19.5a5.1 5.1 0 0 1-.9-10.1A6.4 6.4 0 0 1 18.4 8.7a5.4 5.4 0 0 1-.9 10.8Z" },
  { label: "Automations", path: "M13.6 1.5 4 13.6h6.6L9.4 22.5 20 9.7h-6.7Z" },
  { label: "Calendar", path: "M7 2h2.1v2h5.8V2H17v2h2.5A1.5 1.5 0 0 1 21 5.5v14a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-14A1.5 1.5 0 0 1 4.5 4H7Zm-2 7.2V19h14V9.2Zm2 2.2h3.2v3.2H7Z" },
  { label: "Files", path: "M3.5 4h6.1l2.1 2.6h8.8A1.5 1.5 0 0 1 22 8.1v10.4a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4Z" },
];

// Geometry in design units: a 939 x 698 box (the measured section plus a margin).
const BOX_W = 939;
const BOX_H = 698;
const FR = { l: 24.5, r: 915.5, t: 13.5, b: 684.5 };
const CX = 469;
const RING_CY = 180;
const RING_R = 391;
const SLOT_DEG = 25.58;
const HUB_CY = 347;
const FOCUS_CY = 560.5;
const DISC_R = 36;
const BIG = 1.735;
const HUB_R = 62.5;
const HALO_R = 69.5;
const PULL = 10.5;
const ICON = 32;

// Timing measured from the reference at 30 fps.
const ROT_DUR = 14.53 / 30;
const ROT_LEAD = (66 - 50.93) / 30;
const SWITCH_AT = 0.518;
const SCALE_DUR = 9.5 / 30;
const COMET_LEN = 30;
const CHARS = "{}[]()<>/*@%&#:;+=01";

// Code glyph tracks around the bottom slot: angle, radius at frame 0, drift per frame, visibility per frame of a 66 frame step.
const TRACKS: [number, number, number, string][] = [
  [161.1, 64.72, 0.477, "000000000000001111111110111111111100000011111111111110010000000000"],
  [-152.9, 68.57, 0.305, "000000000000011111111111111110100011111111111111111111110000000000"],
  [62.5, 69.84, 0.387, "000000001000111111011011111111111111101111111011001110000000000000"],
  [10.2, 66.69, 0.281, "000000000000010110011110000001111111111111111111110000000000000000"],
  [-107.5, 64.17, 0.324, "000000000000000000000100010111111111111110001111111111101111110000"],
  [-56.8, 65.33, 0.334, "000000000000000000000001111111111111111111111111001111111111000000"],
  [114.4, 67.82, 0.097, "000000000000000000000000000000111111111101001111100000000000000000"],
];

type Tween = { from: number; to: number; start: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const mod = (a: number, n: number) => ((a % n) + n) % n;

export function ToolWheel({
  items = DEFAULT_ITEMS,
  active,
  defaultActive = 0,
  onActiveChange,
  autoplay = true,
  interval = 2.2,
  pauseOnHover = true,
  showDetails = false,
  ariaLabel,
  eyebrow = "CONNECTIONS",
  title = "Every tool. One shared workspace.",
  subtitle = "Plug the apps your team already works in into one shared view. Less switching. More time on the work itself.",
  markPath = LS_MARK,
  markViewBox = "337 309 532 544",
  background = "#fcfcfc",
  surface = "#ffffff",
  color = "#0a0a0a",
  mutedColor = "#4a4a4a",
  accent = "#e61207",
  signal = "#d0104a",
  lineColor = "#ebebeb",
  frame = true,
  font = 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  uiFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Inter, Arial, sans-serif',
  monoFont = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  className,
  style,
}: ToolWheelProps) {
  const rootRef = useRef(null as HTMLDivElement | null);
  const canvasRef = useRef(null as HTMLCanvasElement | null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [announce, setAnnounce] = useState("");
  const [focusRing, setFocusRing] = useState(false);
  const n = Math.max(1, items.length);
  const controlled = active !== undefined;
  const start = mod(Math.round(controlled ? (active as number) : defaultActive), n);
  const [activeIndex, setActiveIndex] = useState(start);

  const live = useRef({
    T: 0,
    last: -1,
    rot0: start,
    rot1: start,
    animStart: -1,
    animDur: ROT_DUR,
    nextStepAt: interval - ROT_LEAD,
    manualEnd: -10,
    shown: start,
    scales: new Map<number, Tween>([
      [start, { from: 0, to: 1, start: -0.25 }],
      [start - 1, { from: 1, to: 0, start: -0.25 }],
    ]),
    hover: false,
    onscreen: true,
    reduced: false,
  });

  const props = useRef({ items, n, autoplay, interval, pauseOnHover, controlled, onActiveChange, focusRing, showDetails });
  props.current = { items, n, autoplay, interval, pauseOnHover, controlled, onActiveChange, focusRing, showDetails };

  const paths = useMemo(() => {
    if (typeof Path2D === "undefined") return [] as (Path2D | null)[];
    return items.map((it) => (it.path ? new Path2D(it.path) : null));
  }, [items]);
  const mark = useMemo(() => (typeof Path2D === "undefined" || !markPath ? null : new Path2D(markPath)), [markPath]);
  const markBox = useMemo(() => markViewBox.split(/[\s,]+/).map(Number), [markViewBox]);

  const rotAt = (T: number) => {
    const L = live.current;
    if (L.animStart < 0 || T >= L.animStart + L.animDur) return L.rot1;
    if (T <= L.animStart) return L.rot0;
    return L.rot0 + (L.rot1 - L.rot0) * ((T - L.animStart) / L.animDur);
  };
  const scaleOf = (j: number, T: number) => {
    const L = live.current;
    const tw = L.scales.get(j);
    if (!tw) return 0;
    const d = L.reduced ? 0 : SCALE_DUR;
    const p = d <= 0 ? 1 : easeInOutQuad(clamp01((T - tw.start) / d));
    return tw.from + (tw.to - tw.from) * p;
  };

  const goTo = useCallback((target: number) => {
    const L = live.current;
    const { n: count } = props.current;
    const cur = L.rot1;
    let delta = mod(target - mod(cur, count), count);
    if (delta > count / 2) delta -= count;
    if (delta === 0) return;
    const now = L.T;
    const from = rotAt(now);
    L.rot0 = from;
    L.rot1 = cur + delta;
    L.animStart = now;
    L.animDur = L.reduced ? 0.0001 : ROT_DUR * Math.sqrt(Math.abs(L.rot1 - from));
    L.manualEnd = now + L.animDur;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure the heading block against its designed height.
  useEffect(() => {
    const el = textRef.current;
    if (!el || size.w === 0) return;
    const measure = () => {
      const k = Math.min(size.w / BOX_W, size.h / BOX_H);
      const extra = Math.max(0, el.offsetHeight - 131.3 * k - 1.5);
      setTextExtra((prev) => (Math.abs(prev - extra) > 0.5 ? extra : prev));
    };
    measure();
    document.fonts?.ready?.then(measure);
  }, [size.w, size.h, eyebrow, title, subtitle, font, uiFont]);

  // Controlled index.
  useEffect(() => {
    if (controlled) goTo(mod(Math.round(active as number), n));
  }, [active, controlled, n, goTo]);

  // Size.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Reduced motion, visibility.
  useEffect(() => {
    const L = live.current;
    const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const upd = () => (L.reduced = !!mq?.matches);
    upd();
    mq?.addEventListener?.("change", upd);
    let io: IntersectionObserver | null = null;
    if (rootRef.current && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => (L.onscreen = es[es.length - 1].isIntersecting));
      io.observe(rootRef.current);
    }
    return () => {
      mq?.removeEventListener?.("change", upd);
      io?.disconnect();
    };
  }, []);

  const [textExtra, setTextExtra] = useState(0);
  const textRef = useRef(null as HTMLDivElement | null);
  const extraRef = useRef(0);
  extraRef.current = textExtra;
  // When text floors make the heading block taller than designed, the wheel moves down by the difference.
  const layout = (w: number, h: number) => {
    const k = Math.min(w / BOX_W, h / BOX_H);
    const dy = Math.min(extraRef.current, Math.max(0, h - BOX_H * k));
    return { k, ox: (w - BOX_W * k) / 2, oy: (h - BOX_H * k - dy) / 2, dy };
  };

  // Item centres for drawing and hit testing.
  const placeItems = (T: number) => {
    const rot = rotAt(T);
    const out: { j: number; x: number; y: number; s: number }[] = [];
    const lo = Math.floor(rot) - 6;
    const hi = Math.ceil(rot) + 6;
    for (let j = lo; j <= hi; j++) {
      const off = j - rot;
      if (Math.abs(off) > 5.6) continue;
      const deg = 90 + off * SLOT_DEG;
      const dd = Math.abs(deg - 90);
      const pull = PULL * Math.max(0, 1 - (dd / 12) * (dd / 12));
      const a = (deg * Math.PI) / 180;
      const r = RING_R - pull;
      out.push({ j, x: CX + r * Math.cos(a), y: RING_CY + r * Math.sin(a), s: 1 + (BIG - 1) * scaleOf(j, T) });
    }
    out.sort((p, q) => p.s - q.s);
    return out;
  };

  const colors = useRef({ background, surface, color, accent, signal, lineColor, monoFont, frame });
  colors.current = { background, surface, color, accent, signal, lineColor, monoFont, frame };

  // Render loop.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || size.w === 0 || size.h === 0) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(size.w * dpr);
    cv.height = Math.round(size.h * dpr);
    const { k, ox, oy, dy } = layout(size.w, size.h);
    const L = live.current;
    let raf = 0;

    const commitActive = (T: number) => {
      const rot = rotAt(T);
      const next = Math.floor(rot + (1 - SWITCH_AT));
      while (L.shown !== next) {
        const dir = next > L.shown ? 1 : -1;
        const to = L.shown + dir;
        const cross = dir > 0 ? to - (1 - SWITCH_AT) : L.shown - (1 - SWITCH_AT);
        let tc = T;
        if (L.animStart >= 0 && L.rot1 !== L.rot0) tc = L.animStart + L.animDur * ((cross - L.rot0) / (L.rot1 - L.rot0));
        if (!(tc <= T)) tc = T;
        const prev = L.shown;
        L.scales.set(prev, { from: scaleOf(prev, tc), to: 0, start: tc });
        L.scales.set(to, { from: scaleOf(to, tc), to: 1, start: tc });
        L.shown = to;
        const idx = mod(to, props.current.n);
        const item = props.current.items[idx];
        setActiveIndex(idx);
        props.current.onActiveChange?.(idx);
        setAnnounce(`${item?.label ?? ""}${item?.description ? `. ${item.description}` : ""}, ${idx + 1} sur ${props.current.n}`);
      }
      for (const [j, tw] of L.scales) if (tw.to === 0 && T - tw.start > SCALE_DUR + 0.05) L.scales.delete(j);
    };

    const draw = (T: number) => {
      const C = colors.current;
      const P = props.current;
      const X = (x: number) => ox + x * k;
      const Y = (y: number) => oy + dy + y * k;
      const textBottom = dy > 0 && textRef.current ? oy + 31 * k + textRef.current.offsetHeight + 6 : -1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);

      if (C.frame) {
        ctx.fillStyle = C.lineColor;
        const lw = Math.max(1, k);
        ctx.fillRect(X(FR.l) - lw / 2, 0, lw, size.h);
        ctx.fillRect(X(FR.r) - lw / 2, 0, lw, size.h);
        ctx.fillRect(X(FR.l), oy + FR.t * k - lw / 2, (FR.r - FR.l) * k, lw);
        ctx.fillRect(X(FR.l), Y(FR.b) - lw / 2, (FR.r - FR.l) * k, lw);
      }

      ctx.save();
      ctx.beginPath();
      const clipTop = Math.max(oy + (FR.t + 0.5) * k, textBottom);
      ctx.rect(X(FR.l + 0.5), clipTop, (FR.r - FR.l - 1) * k, Y(FR.b - 0.5) - clipTop);
      ctx.clip();

      // Wheel and connector.
      ctx.strokeStyle = C.lineColor;
      ctx.lineWidth = Math.max(1, k);
      ctx.beginPath();
      ctx.arc(X(CX), Y(RING_CY), RING_R * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(CX), Y(HUB_CY + HALO_R));
      ctx.lineTo(X(CX), Y(FOCUS_CY - HALO_R));
      ctx.stroke();

      const halo = (cy: number) => {
        ctx.beginPath();
        ctx.arc(X(CX), Y(cy), HALO_R * k, 0, Math.PI * 2);
        ctx.fillStyle = C.background;
        ctx.fill();
        ctx.strokeStyle = C.lineColor;
        ctx.lineWidth = Math.max(1, k);
        ctx.stroke();
      };
      const showHub = !P.showDetails || size.w >= 520;
      if (showHub) halo(HUB_CY);
      halo(FOCUS_CY);

      const disc = (x: number, y: number, r: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = C.surface;
        ctx.shadowColor = "rgba(0, 0, 0, 0.03)";
        ctx.shadowBlur = 6 * k * dpr;
        ctx.shadowOffsetY = 3.5 * k * dpr;
        ctx.fill();
        ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
        ctx.shadowBlur = 2.4 * k * dpr;
        ctx.shadowOffsetY = 1.1 * k * dpr;
        ctx.fill();
        ctx.restore();
      };

      // Tools.
      for (const it of placeItems(T)) {
        const x = X(it.x);
        const y = Y(it.y);
        const r = DISC_R * it.s * k;
        if (y + r * 1.4 < oy + FR.t * k) continue;
        disc(x, y, r);
        const idx = mod(it.j, P.n);
        const item = P.items[idx];
        const p = paths[idx];
        const sz = ICON * it.s * k;
        ctx.save();
        ctx.translate(x - sz / 2, y - sz / 2);
        ctx.scale(sz / 24, sz / 24);
        ctx.fillStyle = C.color;
        if (p) ctx.fill(p, item?.fillRule ?? "evenodd");
        else {
          ctx.beginPath();
          ctx.arc(12, 12, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Hub.
      if (showHub) disc(X(CX), Y(HUB_CY), HUB_R * k);
      if (!P.showDetails && mark && markBox.length === 4) {
        const [mx, my, mw, mh] = markBox;
        const hgt = 48.5 * k;
        const sc = hgt / mh;
        ctx.save();
        ctx.translate(X(CX) - (mw * sc) / 2, Y(HUB_CY) - hgt / 2);
        ctx.scale(sc, sc);
        ctx.translate(-mx, -my);
        ctx.fillStyle = C.accent;
        ctx.fill(mark);
        ctx.restore();
      }

      if (!L.reduced) {
        const cycle = mod(T, P.interval);
        const cf = (cycle / P.interval) * 66;
        // Code glyphs.
        const fi = Math.floor(cf);
        ctx.fillStyle = C.signal;
        ctx.font = `400 ${Math.max(6, 10 * k)}px ${C.monoFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const stepNo = mod(Math.floor(T / P.interval), P.n);
        TRACKS.forEach(([ang, r0, dr, mask], ti) => {
          if (mask[fi] !== "1") return;
          const rr = r0 + dr * cf;
          const a = (ang * Math.PI) / 180;
          const h = Math.imul(ti + 1, 73856093) ^ Math.imul(Math.floor(cf / 3) + 1 + stepNo * 31, 19349663);
          const ch = CHARS[(h >>> 0) % CHARS.length];
          ctx.fillText(ch, X(CX + rr * Math.cos(a)), Y(FOCUS_CY + rr * Math.sin(a)));
        });
        // Signal travelling hub ring, connector, slot ring, connector.
        const LOOP = 2 * Math.PI * HALO_R;
        const SEG = FOCUS_CY - HALO_R - (HUB_CY + HALO_R);
        const TOTAL = 2 * LOOP + 2 * SEG;
        const at = (s: number): [number, number] => {
          s = mod(s, TOTAL);
          if (s < LOOP) {
            const th = Math.PI / 2 - s / HALO_R;
            return [CX + HALO_R * Math.cos(th), HUB_CY + HALO_R * Math.sin(th)];
          }
          s -= LOOP;
          if (s < SEG) return [CX, HUB_CY + HALO_R + s];
          s -= SEG;
          if (s < LOOP) {
            const th = -Math.PI / 2 + s / HALO_R;
            return [CX + HALO_R * Math.cos(th), FOCUS_CY + HALO_R * Math.sin(th)];
          }
          s -= LOOP;
          return [CX, FOCUS_CY - HALO_R - s];
        };
        const head = (cycle / P.interval) * TOTAL + 3;
        ctx.strokeStyle = C.signal;
        ctx.lineWidth = Math.max(0.8, 1.25 * k);
        ctx.lineCap = "round";
        const steps = 12;
        for (let i = 0; i < steps; i++) {
          const s0 = head - COMET_LEN + (COMET_LEN * i) / steps;
          const s1 = head - COMET_LEN + (COMET_LEN * (i + 1)) / steps;
          const u = (i + 0.5) / steps;
          ctx.globalAlpha = 0.9 * Math.min(1, Math.sin(Math.PI * Math.min(1, u * 1.15)) * 1.6);
          const [ax, ay] = at(s0);
          const [bx, by] = at((s0 + s1) / 2);
          const [cx2, cy2] = at(s1);
          ctx.beginPath();
          ctx.moveTo(X(ax), Y(ay));
          ctx.quadraticCurveTo(X(2 * bx - (ax + cx2) / 2), Y(2 * by - (ay + cy2) / 2), X(cx2), Y(cy2));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      if (P.focusRing) {
        ctx.beginPath();
        ctx.arc(X(CX), Y(FOCUS_CY), (HALO_R + 4) * k, 0, Math.PI * 2);
        ctx.strokeStyle = C.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now() / 1000;
      const visible = typeof document === "undefined" || document.visibilityState !== "hidden";
      if (L.last < 0) L.last = now;
      const dt = Math.min(0.1, Math.max(0, now - L.last));
      L.last = now;
      if (!visible || !L.onscreen) return;
      L.T += dt;
      const P = props.current;
      const T = L.T;
      const held = (P.pauseOnHover && L.hover) || L.reduced || P.controlled || !P.autoplay;
      while (T >= L.nextStepAt) {
        const at = L.nextStepAt;
        L.nextStepAt += P.interval;
        const settled = L.animStart < 0 || at >= L.animStart + L.animDur;
        if (held || !settled || at - L.manualEnd < P.interval * 0.6) continue;
        L.rot0 = L.rot1;
        L.rot1 = L.rot1 + 1;
        L.animStart = at;
        L.animDur = ROT_DUR;
      }
      commitActive(T);
      draw(T);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, paths, mark, markBox, textExtra]);

  const hit = (e: React.PointerEvent | React.MouseEvent) => {
    const el = rootRef.current;
    if (!el) return null;
    const rc = el.getBoundingClientRect();
    const { k, ox, oy, dy } = layout(rc.width, rc.height);
    const px = (e.clientX - rc.left - ox) / k;
    const py = (e.clientY - rc.top - oy - dy) / k;
    if (py < FR.t) return null;
    let best: number | null = null;
    for (const it of placeItems(live.current.T)) {
      if (Math.hypot(px - it.x, py - it.y) <= DISC_R * it.s + 2) best = it.j;
    }
    return best;
  };

  const fontPx = (v: number, floor: number) => `${Math.max(floor, v * (layout(size.w || BOX_W, size.h || BOX_H).k)).toFixed(2)}px`;
  const { k, ox, oy, dy } = layout(size.w || BOX_W, size.h || BOX_H);
  const activeItem = items[mod(activeIndex, n)];

  return (
    <div
      ref={rootRef}
      className={className}
      tabIndex={0}
      role="group"
      aria-roledescription="tool wheel"
      aria-label={ariaLabel || title || "Tools"}
      onKeyDown={(e) => {
        const L = live.current;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const t = mod(L.rot1 + 1, n);
          if (controlled) onActiveChange?.(t);
          else goTo(t);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const t = mod(L.rot1 - 1, n);
          if (controlled) onActiveChange?.(t);
          else goTo(t);
        }
      }}
      onFocus={(e) => setFocusRing(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => setFocusRing(false)}
      onPointerEnter={(e) => (live.current.hover = e.pointerType === "mouse")}
      onPointerLeave={(e) => {
        live.current.hover = false;
        (e.currentTarget as HTMLDivElement).style.cursor = "default";
      }}
      onPointerMove={(e) => {
        (e.currentTarget as HTMLDivElement).style.cursor = hit(e) !== null ? "pointer" : "default";
      }}
      onClick={(e) => {
        const j = hit(e);
        if (j === null) return;
        const idx = mod(j, n);
        if (controlled) onActiveChange?.(idx);
        else goTo(idx);
      }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 360,
        overflow: "hidden",
        background,
        color,
        outline: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      <div ref={textRef} style={{ position: "absolute", left: 16, right: 16, top: oy + 31 * k, textAlign: "center", pointerEvents: "none" }}>
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: Math.max(16 * k, 13),
              fontFamily: uiFont,
              fontSize: fontPx(10.6, 11),
              fontWeight: 500,
              letterSpacing: "0.01em",
              lineHeight: 1,
              color,
            }}
          >
            <span style={{ color: mutedColor, fontWeight: 300 }}>[</span>
            <span style={{ width: Math.max(3, 4 * k), height: Math.max(3, 4 * k), background: accent, margin: `0 ${6 * k}px 0 ${7 * k}px` }} />
            <span>{eyebrow}</span>
            <span style={{ width: Math.max(3, 4 * k), height: Math.max(3, 4 * k), background: accent, margin: `0 ${7 * k}px 0 ${6 * k}px` }} />
            <span style={{ color: mutedColor, fontWeight: 300 }}>]</span>
          </div>
        ) : null}
        {title ? (
          <h2
            style={{
              margin: 0,
              marginTop: eyebrow ? 26.25 * k : 0,
              fontFamily: font,
              fontWeight: 400,
              fontSize: fontPx(37, 18),
              lineHeight: 1.1,
              letterSpacing: "0.004em",
              color,
              WebkitTextStroke: `${(0.12 * k).toFixed(2)}px ${color}`,
              textWrap: "balance",
            } as React.CSSProperties}
          >
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p
            style={{
              margin: "0 auto",
              marginTop: 7.35 * k,
              maxWidth: `${((440 * Math.max(11, 13 * k)) / 13).toFixed(1)}px`,
              fontFamily: uiFont,
              fontSize: fontPx(13, 11),
              lineHeight: fontPx(20.5, 15),
              color: mutedColor,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {showDetails && activeItem ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: ox + CX * k,
            top: oy + dy + HUB_CY * k,
            transform: "translate(-50%, -50%)",
            width: Math.min((size.w || BOX_W) * 0.86, Math.max(112, 124 * k)),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.max(2, 3.5 * k),
            textAlign: "center",
            pointerEvents: "none",
            textWrap: "balance",
          } as React.CSSProperties}
        >
          <span
            style={{
              fontFamily: monoFont,
              fontSize: Math.max(7.5, 8.5 * k),
              lineHeight: 1,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: mutedColor,
              opacity: 0.75,
            }}
          >
            {String(activeIndex + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          <span
            style={{
              fontFamily: uiFont,
              fontWeight: 600,
              fontSize: Math.max(13, 18 * k),
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color,
            }}
          >
            {activeItem.label}
          </span>
          {activeItem.description ? (
            <span
              style={{
                fontFamily: uiFont,
                fontSize: Math.max(9.5, 11.5 * k),
                lineHeight: 1.35,
                color: mutedColor,
              }}
            >
              {activeItem.description}
            </span>
          ) : null}
        </div>
      ) : null}
      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        {announce}
      </div>
    </div>
  );
}

export default ToolWheel;
