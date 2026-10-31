import type { Locale } from "@/types/foundation";
import type { Route } from "next";

export const localeHeader = "x-edxstore-locale";

// Presentation only; callers must still validate protected return destinations.
export function localizedPath(path: string, locale: Locale) {
  const [beforeHash, hash] = path.split("#", 2);
  const [pathname, search = ""] = beforeHash.split("?", 2);
  const params = new URLSearchParams(search);
  if (locale === "en") params.set("locale", "en");
  else params.delete("locale");
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}` as Route;
}
