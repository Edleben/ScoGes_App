import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      let hydrationErrors = 0;
      let runtimeErrors = 0;
      const policyViolations: Record<string, number> = {};
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) => {
          if (event.disposition === "enforce")
            console.error(`EDXSTORE_CSP_VIOLATION:${event.effectiveDirective}`);
        });
      });
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          message.text().startsWith("EDXSTORE_CSP_VIOLATION:")
        ) {
          const reported = message
            .text()
            .slice("EDXSTORE_CSP_VIOLATION:".length);
          const directive = /^[a-z-]+$/.test(reported) ? reported : "other";
          policyViolations[directive] = (policyViolations[directive] ?? 0) + 1;
        }
        if (
          message.type() === "error" &&
          /hydrat|server.rendered.*match|did not match/i.test(message.text())
        )
          hydrationErrors++;
      });
      page.on("pageerror", () => runtimeErrors++);
      await use();
      // Only counts enter reports: console payloads may contain sensitive DOM values.
      expect(hydrationErrors, "Browser hydration warnings").toBe(0);
      expect(runtimeErrors, "Uncaught browser exceptions").toBe(0);
      expect(policyViolations, "Enforced browser CSP violations").toEqual({});
    },
    { auto: true },
  ],
});
export { expect };
