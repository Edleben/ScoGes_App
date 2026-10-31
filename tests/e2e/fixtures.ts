import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      let hydrationErrors = 0;
      let runtimeErrors = 0;
      page.on("console", (message) => {
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
    },
    { auto: true },
  ],
});
export { expect };
