"use client";

import { SplineSceneBasic } from "@/components/ui/demo";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 20px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section style={{ width: "min(1100px, 100%)" }}>
        <SplineSceneBasic />
      </section>
    </main>
  );
}
