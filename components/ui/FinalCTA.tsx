"use client";

export function FinalCTA() {
  return (
    <section className="final-cta" id="final-cta" aria-label="Contact">
      <div className="final-cta__inner">
        <p style={{ color: "#2872a1", letterSpacing: "0.18em", textTransform: "uppercase", fontSize: 12 }}>Connexion établie</p>
        <h2 style={{ fontSize: "clamp(30px,5vw,56px)", fontWeight: 700, marginTop: 8 }}>Entrons en contact</h2>
        <p style={{ marginTop: 10, color: "rgba(22,35,44,0.75)", maxWidth: 520 }}>
          Le cerveau se reforme. Une idée, un projet, une collaboration — ouvrons le dialogue.
        </p>
        <a className="btn-neon" href="mailto:hello@example.com">Démarrer une conversation</a>
      </div>
    </section>
  );
}
