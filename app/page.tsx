"use client";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
      }}
    >
      <section style={{ width: "min(720px, 100%)", textAlign: "center" }}>
        <div
          className="glass3d"
          style={{
            borderRadius: 20,
            padding: "40px 32px",
            border: "1px solid rgba(0, 229, 255, 0.18)",
          }}
        >
          <p
            style={{
              color: "#00E5FF",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            Portfolio
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              fontWeight: 700,
              marginTop: 10,
            }}
          >
            Bienvenue sur mon portfolio
          </h1>
          <p
            style={{
              marginTop: 14,
              color: "rgba(234, 246, 255, 0.78)",
              lineHeight: 1.7,
              maxWidth: 560,
              marginInline: "auto",
            }}
          >
            Un espace pour présenter mes projets, mes compétences et mon parcours.
          </p>
          <a className="btn-neon" href="mailto:hello@example.com">
            Me contacter
          </a>
        </div>
      </section>
    </main>
  );
}
