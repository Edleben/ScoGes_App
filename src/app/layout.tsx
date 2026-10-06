import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDXSTORE Scolarite",
  description: "Secure multi-tenant school management SaaS foundation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
