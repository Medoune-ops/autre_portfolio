/**
 * Fond de site ultra performant :
 * Halos ambiants doux et grille tech en pur CSS accéléré par le GPU (0% CPU, 60-120 FPS constant).
 */
export default function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f1f5f9]" aria-hidden="true">
      {/* Halos ambiants optimisés */}
      <div className="absolute -top-32 left-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-[#cbdde9]/50 to-transparent blur-[110px]" />
      <div className="absolute top-[35%] -right-24 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-[#789a99]/20 via-[#2872a1]/10 to-transparent blur-[130px]" />
      <div className="absolute top-[70%] -left-28 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-[#2872a1]/15 to-transparent blur-[130px]" />
      
      {/* Grille tech discrète pour le style d'ingénierie */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(#16232c 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
