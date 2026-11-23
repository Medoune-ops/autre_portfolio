import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medoune Seck — Web Designer & Developer",
  description: "Développeur & Designer diplômé Licence Génie Informatique. Full-stack, UI/UX Design et communication digitale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
