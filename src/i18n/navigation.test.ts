import { describe, expect, it } from "vitest";
import { getLocale } from "./messages";
import { localizedPath } from "./navigation";
import { getLocalizedTrackers } from "@/modules/project-tracker/tracker-messages";
import { sprintTrackers } from "@/modules/project-tracker/tracker-data";

describe("foundation locale navigation", () => {
  it("defaults unsupported and missing locales to French", () => {
    for (const value of [undefined, null, "de", "EN", "en,fr"])
      expect(getLocale(value)).toBe("fr");
    expect(getLocale("en")).toBe("en");
  });
  it("preserves unrelated query parameters and fragments without duplicate locale", () => {
    expect(
      localizedPath("/dashboard/users?page=2&locale=fr#members", "en"),
    ).toBe("/dashboard/users?page=2&locale=en#members");
    expect(localizedPath("/dashboard?locale=en", "fr")).toBe("/dashboard");
  });
  it("translates all tracker content without changing status or progress", () => {
    for (const locale of ["fr", "en"] as const) {
      const localized = getLocalizedTrackers(locale);
      expect(
        localized.map((s) => [
          s.id,
          s.status,
          s.progress,
          ...s.features.map((f) => [f.id, f.status, f.progress]),
        ]),
      ).toEqual(
        sprintTrackers.map((s) => [
          s.id,
          s.status,
          s.progress,
          ...s.features.map((f) => [f.id, f.status, f.progress]),
        ]),
      );
      expect(
        localized.every(
          (s) =>
            s.objective &&
            s.summary &&
            s.features.every((f) => f.title && f.description && f.ownerArea),
        ),
      ).toBe(true);
    }
    expect(getLocalizedTrackers("en")[0].objective).toBe(
      "Platform foundations",
    );
    expect(sprintTrackers[0].objective).toBe("Fondations plateforme");
  });
});
