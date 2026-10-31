import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getProjectTrackerSummary,
  sprintTrackers,
  trackerCheckpoint,
} from "@/modules/project-tracker/tracker-data";

describe("project tracker data", () => {
  it("keeps the Markdown tracker and UI data synchronized", () => {
    const markdown = readFileSync(
      new URL("../../../docs/PROJECT_TRACKER.md", import.meta.url),
      "utf8",
    );
    const rows = markdown
      .split("\n")
      .filter((line) => line.startsWith("|"))
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim()),
      )
      .filter((cells) =>
        /^(done|in_progress|planned|blocked)$/.test(cells[1] ?? ""),
      )
      .map((cells) => ({
        id: cells[0],
        status: cells[1],
        progress: Number(cells[2].replace("%", "")),
      }));
    const expected = [
      ...sprintTrackers,
      ...sprintTrackers.flatMap((sprint) => sprint.features),
    ].map(({ id, status, progress }) => ({ id, status, progress }));
    expect(rows).toEqual(expected);
    expect(markdown).toContain(trackerCheckpoint.validatedOn);
    expect(markdown).toContain(trackerCheckpoint.validationPr);
  });

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
    ).toEqual(["email-lifecycle-validation"]);
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
