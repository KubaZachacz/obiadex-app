import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEST_USER = {
  email: "test@obiadex.test",
  password: "TestPassword123!",
};

export const TEST_USER_2 = {
  email: "test2@obiadex.test",
  password: "TestPassword456!",
};

const authDir = path.join(__dirname, "../.auth");
const userAuthFile = path.join(authDir, "user.json");

type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Extended test fixture that provides an authenticated page context
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    // Try to load existing auth state
    try {
      const authState = JSON.parse(fs.readFileSync(userAuthFile, "utf-8"));
      if (authState.cookies) {
        await context.addCookies(authState.cookies);
      }
    } catch (error) {
      // Auth file doesn't exist yet, will need to login
      console.log("No existing auth state found, will need to login");
    }

    // Navigate to home to check auth
    await page.goto("/");

    // If redirected to login, we need to authenticate
    if (page.url().includes("/login")) {
      await performLogin(page, TEST_USER.email, TEST_USER.password);
    }

    // Use the authenticated page
    await use(page);
  },
});

/**
 * Perform login via UI
 */
export async function performLogin(page: Page, email: string, password: string) {
  // Should be on login page
  await expect(page).toHaveURL(/\/login/);

  // Fill in the form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/hasło/i).fill(password);

  // Submit form
  await page.getByRole("button", { name: /zaloguj się/i }).click();

  // Wait for redirect to home
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

/**
 * Perform signup via UI
 */
export async function performSignup(page: Page, email: string, password: string) {
  await page.goto("/signup");

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/hasło/i).fill(password);

  await page.getByRole("button", { name: /załóż konto/i }).click();
}

/**
 * Logout via UI or API
 */
export async function performLogout(page: Page) {
  // Call logout API endpoint
  await page.request.post("/api/auth/logout");

  // Navigate to login
  await page.goto("/login");
  await expect(page).toHaveURL("/login");
}

/**
 * Check if user is authenticated by attempting to access protected route
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const response = await page.goto("/");
  return !page.url().includes("/login");
}

/**
 * Save authentication state to file
 */
export async function saveAuthState(page: Page, filename: string = userAuthFile) {
  const cookies = await page.context().cookies();
  const storage = await page.context().storageState();

  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, JSON.stringify({ cookies, ...storage }), "utf-8");
}

export { expect };
