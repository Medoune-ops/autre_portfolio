import ShapeWaves from "./ShapeWaves";
import logo from "./bite.svg";

// Next.js renvoie un objet { src } pour les imports d'images : on accepte les deux formes.
const logoSrc: string = typeof logo === "string" ? logo : (logo?.src ?? "");

export default function BiteMark({ size = 480 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1 / 1",
        background: "#0c0b10",
        WebkitMaskImage: `url(${logoSrc})`,
        maskImage: `url(${logoSrc})`,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    >
      <ShapeWaves
        text=""
        shapes="mixed"
        cellSize={9}
        dotSize={0.8}
        color="#789a99"
        hoverColor="#cbdde9"
        backgroundColor="#0c0b10"
        speed={0.9}
        scale={1.15}
        contrast={1.15}
        brightness={0.46}
        fade={0.18}
        glow={0.5}
        intro
        introDuration={1.8}
        splashStrength={0.5}
      />
    </div>
  );
}
