import { describe, it, expect } from "vitest";
import { redact } from "../e2e/reporters/ci-reporter";

describe("CI browser diagnostics", () => {
  it("redacts callback codes and invitation fragments while preserving useful paths", () => {
    expect(
      redact(
        "http://127.0.0.1/auth/callback?code=private&next=/dashboard #token=private",
      ),
    ).toBe(
      "http://127.0.0.1/auth/callback?code=[redacted]&next=/dashboard #token=[redacted]",
    );
  });
  it("redacts keys and JWTs", () => {
    expect(redact("sb_" + "secret_fixture eyJfake.part.signature")).toBe(
      "[key redacted] [JWT redacted]",
    );
  });
});
