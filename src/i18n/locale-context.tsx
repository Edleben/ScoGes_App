"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/types/foundation";

export const LocaleContext = createContext<Locale>("fr");
export const useLocale = () => useContext(LocaleContext);
