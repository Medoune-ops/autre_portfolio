import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cerveau Immersif — Exploration 3D",
  description: "Une expérience de scroll immersive à l'intérieur d'un cerveau 3D, pièce par pièce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
