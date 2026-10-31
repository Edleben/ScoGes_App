import type { Metadata } from "next";
import "./globals.css";
import { getRequestLocale } from "@/i18n/server";
import { LocaleContext } from "@/i18n/locale-context";

export const metadata: Metadata = {
  title: "EDXSTORE Scolarite",
  description: "Secure multi-tenant school management SaaS foundation.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleContext value={locale}>{children}</LocaleContext>
      </body>
    </html>
  );
}
