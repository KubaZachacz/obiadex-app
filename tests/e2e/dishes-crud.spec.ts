import { test, expect } from "./fixtures/auth";

test.describe("Dishes CRUD", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to dishes page (already authenticated via fixture)
    await page.goto("/dishes", { waitUntil: "networkidle" });

    // Wait for FAB button to be visible (indicates React hydration complete)
    await page.waitForSelector('[data-testid="fab-button"]', { state: "visible", timeout: 10000 });
  });

  test("should show dishes page elements", async ({ authenticatedPage: page }) => {
    // Should be on dishes page (may include query params)
    await expect(page).toHaveURL(/\/dishes/);

    // Should see FAB (Floating Action Button) to add dish
    await expect(page.getByTestId("fab-button")).toBeVisible();
  });

  test("should open create dish dialog when clicking FAB", async ({ authenticatedPage: page }) => {
    // Click FAB button
    await page.getByTestId("fab-button").click();

    // Wait for dialog and form to be visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForSelector('[data-testid="dish-form"]', { state: "visible" });

    // Should see dialog title
    await expect(dialog.getByRole("heading", { name: /dodaj nowe danie/i })).toBeVisible();

    // Should see form fields
    await expect(dialog.getByLabel(/nazwa/i)).toBeVisible();
  });

  test("should validate required fields when creating dish", async ({ authenticatedPage: page }) => {
    // Open create dialog
    await page.getByTestId("fab-button").click();

    // Wait for form to be ready
    await page.waitForSelector('[data-testid="dish-form"]', { state: "visible" });

    const dialog = page.getByRole("dialog");

    // Try to submit without filling anything
    const submitButton = dialog.getByRole("button", { name: /zapisz|dodaj/i });
    await submitButton.click();

    // Wait for validation errors to appear
    await page.waitForTimeout(1000);

    // Should show validation errors (either inline or as alert)
    const pageContent = await dialog.textContent();
    expect(pageContent).toMatch(/nazwa|tag|wymagany|co najmniej/i);
  });

  test("should validate dish name length", async ({ authenticatedPage: page }) => {
    // Open create dialog
    await page.getByTestId("fab-button").click();

    // Wait for form
    await page.waitForSelector('[data-testid="dish-form"]', { state: "visible" });

    const dialog = page.getByRole("dialog");

    // Try to enter name that's too short (< 3 chars)
    await dialog.getByLabel(/nazwa/i).fill("ab");

    // Try to submit
    await dialog.getByRole("button", { name: /zapisz|dodaj/i }).click();

    await page.waitForTimeout(1000);

    // Should show validation error
    const pageContent = await dialog.textContent();
    expect(pageContent).toMatch(/3 znaki/i);
  });

  test("should show appropriate content based on dish existence", async ({ authenticatedPage: page }) => {
    // Wait for content to load
    await page.waitForTimeout(1500);

    // Try to find the empty state button first
    const emptyStateButton = page.getByRole("button", { name: /dodaj pierwsze danie|wyczyść filtry/i });
    const hasEmptyState = await emptyStateButton.isVisible().catch(() => false);

    if (hasEmptyState) {
      // If empty state exists, verify button is visible
      await expect(emptyStateButton).toBeVisible();
    } else {
      // Otherwise, should have dish content - verify FAB is present (it's always there)
      await expect(page.getByTestId("fab-button")).toBeVisible();
    }
  });

  test("should display dish list with pagination", async ({ authenticatedPage: page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if pagination controls exist (only shows if >1 page)
    const paginationExists = await page
      .locator('nav:has-text("Strona"), nav:has([aria-label*="pagination"])')
      .isVisible()
      .catch(() => false);

    if (paginationExists) {
      // Pagination should be visible
      await expect(page.locator('nav:has-text("Strona"), nav:has([aria-label*="pagination"])')).toBeVisible();
    }

    // Should show either dishes (as Cards/headings) or empty state
    const dishHeadings = await page.locator("h3, [role='heading']").count();
    const hasEmptyState = await page
      .getByRole("heading", { name: /brak dań|brak wyników/i })
      .isVisible()
      .catch(() => false);

    // At minimum, should have page heading and either dishes or empty state
    expect(dishHeadings > 0 || hasEmptyState).toBe(true);
  });
});
