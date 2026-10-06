import { expect, test } from "@playwright/test";

test("public landing page links to login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /EDXSTORE School Management SaaS/i })).toBeVisible();
  await page.getByRole("link", { name: /Acceder a la plateforme/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Connexion/i })).toBeVisible();
});
