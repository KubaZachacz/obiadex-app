import { expect, test } from "@playwright/test";

test("unauthenticated users are redirected to /login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeVisible();
});
