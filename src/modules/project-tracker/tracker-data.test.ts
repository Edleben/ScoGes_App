import { describe, expect, it } from "vitest";
import { getProjectTrackerSummary, sprintTrackers } from "@/modules/project-tracker/tracker-data";

describe("project tracker data", () => {
  it("tracks all roadmap sprints without starting Sprint 1 work", () => {
    const summary = getProjectTrackerSummary();

    expect(summary.totalSprints).toBe(6);
    expect(summary.doneFeatures).toBe(sprintTrackers[0].features.length);
    expect(sprintTrackers[1].status).toBe("planned");
  });

  it("computes a quantitative global progress from feature progress", () => {
    const summary = getProjectTrackerSummary();

    expect(summary.totalFeatures).toBeGreaterThan(summary.doneFeatures);
    expect(summary.progress).toBeGreaterThan(0);
    expect(summary.progress).toBeLessThan(100);
  });
});
