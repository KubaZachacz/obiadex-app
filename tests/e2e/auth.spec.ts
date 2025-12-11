import { test, expect } from "@playwright/test";

test.describe("Authentication - Route Protection", () => {
  test("should redirect to login when accessing home without auth", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /zaloguj się/i })).toBeVisible();
  });

  test("should redirect to login when accessing /dishes without auth", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dishes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show login page elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj się/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /nie masz konta/i })).toBeVisible();
  });

  test("should show signup page elements", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /załóż konto/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /załóż konto/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /masz już konto/i })).toBeVisible();
  });

  test("should navigate between login and signup pages", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /nie masz konta|załóż konto/i }).click();
    await expect(page).toHaveURL("/signup");
    await expect(page.getByRole("heading", { name: /załóż konto/i })).toBeVisible();
    await page.getByRole("link", { name: /masz już konto|zaloguj się/i }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: /zaloguj się/i })).toBeVisible();
  });
});

test.describe("Authentication - Form Validation", () => {
  test("should validate email format on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    // Wait for React to hydrate - wait for form to be ready
    await page.waitForSelector('[data-testid="login-form"]', { state: "visible" });

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    await emailInput.fill("not-an-email");
    await passwordInput.fill("password123");
    await submitButton.click();

    // Wait for error message to appear
    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/poprawny.*email/i);
  });

  test("should validate required email on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    await page.waitForSelector('[data-testid="login-form"]', { state: "visible" });

    const submitButton = page.getByRole("button", { name: /zaloguj się/i });
    await submitButton.click();

    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/wymagany/i);
  });

  test("should validate password length on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    await page.waitForSelector('[data-testid="login-form"]', { state: "visible" });

    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/hasło/i).fill("short");
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/8 znaków/i);
  });

  test("should validate password length on signup", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "networkidle" });

    await page.waitForSelector('[data-testid="signup-form"]', { state: "visible" });

    await page.getByLabel(/email/i).fill("new@example.com");
    await page.getByLabel(/hasło/i).fill("short");
    await page.getByRole("button", { name: /załóż konto/i }).click();

    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/8 znaków/i);
  });

  test("should validate required email on signup", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "networkidle" });

    await page.waitForSelector('[data-testid="signup-form"]', { state: "visible" });

    await page.getByLabel(/hasło/i).fill("Password123!");
    await page.getByRole("button", { name: /załóż konto/i }).click();

    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/wymagany/i);
  });
});
