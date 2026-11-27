/**
 * Fond de site statique, léger et performant.
 */
export default function SiteBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-[#f1f5f9]"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(203,221,233,0.45), transparent 70%), radial-gradient(ellipse 45% 35% at 85% 60%, rgba(120,154,153,0.10), transparent 70%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #edf3f8 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#16232c 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
