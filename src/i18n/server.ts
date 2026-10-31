import { headers } from "next/headers";
import { getLocale } from "./messages";
import { localeHeader } from "./navigation";

export async function getRequestLocale() {
  return getLocale((await headers()).get(localeHeader));
}
