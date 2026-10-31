import { expect, test } from "@playwright/test";
for (const locale of ["fr", "en"] as const) {
  test(`public ${locale} landing page preserves language through login`, async ({
    page,
  }) => {
    await page.goto(`/?locale=${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(
      page.getByRole("heading", {
        name:
          locale === "fr"
            ? "EDXSTORE — Gestion scolaire"
            : "EDXSTORE School Management",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("link", {
        name:
          locale === "fr" ? "Accéder à la plateforme" : "Access the platform",
      })
      .click();
    await expect(page).toHaveURL(
      locale === "fr" ? /\/login$/ : /\/login\?locale=en$/,
    );
    await expect(
      page.getByRole("heading", {
        name: locale === "fr" ? "Connexion" : "Sign in",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page.goto(`/missing-foundation-page?locale=${locale}`);
    await expect(
      page.getByRole("heading", {
        name: locale === "fr" ? "Page introuvable" : "Page not found",
      }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page
      .getByRole("link", {
        name: locale === "fr" ? "Retour à l’accueil" : "Back to home",
      })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });
}
