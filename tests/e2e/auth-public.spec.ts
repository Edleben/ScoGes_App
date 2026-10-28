import { expect, test } from "@playwright/test";

test("authentication pages support French and English", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toBeVisible();
});

test("signup rejects password mismatch without sending an email", async ({
  page,
}) => {
  await page.goto("/signup?locale=en");
  await page.getByLabel("Email address").fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("different123");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "both passwords must match",
  );
});

test("recovery has a real email field and unauthenticated reset cannot update a password", async ({
  page,
}) => {
  await page.goto("/auth/forgot-password?locale=en");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await page.goto("/auth/reset-password?locale=en");
  await expect(page.getByRole("status")).toContainText(
    "invalid, expired or already used",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
});

test("invalid invitation has no enabled acceptance action", async ({
  page,
}) => {
  await page.goto("/invitations/accept?locale=en");
  await expect(page.getByRole("status")).toContainText(
    "invalid, expired or already used",
  );
  await expect(
    page.getByRole("button", { name: "Open invitation" }),
  ).toBeDisabled();
});
