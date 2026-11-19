"use client";

export function ScrollHint() {
  return (
    <div className="scroll-hint" id="scroll-hint" aria-hidden>
      <span>Scroll</span>
      <span className="scroll-hint__line" />
    </div>
  );
}
