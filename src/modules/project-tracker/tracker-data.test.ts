import { describe, expect, it } from "vitest";
import {
  getProjectTrackerSummary,
  sprintTrackers,
} from "@/modules/project-tracker/tracker-data";

describe("project tracker data", () => {
  it("tracks all roadmap sprints without starting Sprint 1 work", () => {
    const summary = getProjectTrackerSummary();

    expect(summary.totalSprints).toBe(6);
    expect(summary.doneFeatures).toBe(
      sprintTrackers[0].features.filter((feature) => feature.status === "done")
        .length,
    );
    expect(sprintTrackers[1].status).toBe("planned");
  });

  it("keeps Sprint 0 open until remaining acceptance checks are complete", () => {
    const sprint = sprintTrackers[0];
    expect(sprint.status).toBe("in_progress");
    expect(sprint.progress).toBe(
      Math.round(
        sprint.features.reduce((sum, feature) => sum + feature.progress, 0) /
          sprint.features.length,
      ),
    );
    expect(
      sprint.features
        .filter((feature) => feature.status !== "done")
        .map((feature) => feature.id),
    ).toEqual(["bilingual-completion", "email-lifecycle-validation"]);
    expect(
      sprintTrackers
        .slice(1)
        .every(
          (sprint) => sprint.status === "planned" && sprint.progress === 0,
        ),
    ).toBe(true);
  });
  it("computes a quantitative global progress from feature progress", () => {
    const summary = getProjectTrackerSummary();

    expect(summary.totalFeatures).toBeGreaterThan(summary.doneFeatures);
    expect(summary.progress).toBeGreaterThan(0);
    expect(summary.progress).toBeLessThan(100);
  });
});
