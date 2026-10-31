"use client";

import { usePathname } from "next/navigation";
import { localizedPath } from "@/i18n/navigation";
import { useLocale } from "@/i18n/locale-context";

export function LanguageLinks() {
  const path = usePathname();
  const locale = useLocale();
  // Full navigation refreshes cached layouts and their document language together.
  return (
    <nav
      aria-label={locale === "fr" ? "Langue" : "Language"}
      className="flex gap-4 text-sm underline"
    >
      {(["fr", "en"] as const).map((language) => (
        <a
          href={localizedPath(path, language)}
          hrefLang={language}
          lang={language}
          aria-current={locale === language ? "true" : undefined}
          key={language}
        >
          {language === "fr" ? "Français" : "English"}
        </a>
      ))}
    </nav>
  );
}
