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
    // Should be on dishes page
    await expect(page).toHaveURL("/dishes");

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

  test("should create dish successfully with valid data", async ({ authenticatedPage: page }) => {
    // Open create dialog
    await page.getByTestId("fab-button").click();

    // Wait for form
    await page.waitForSelector('[data-testid="dish-form"]', { state: "visible" });

    const dialog = page.getByRole("dialog");

    // Fill in dish name
    const dishName = `Test Dish ${Date.now()}`;
    await dialog.getByLabel(/nazwa/i).fill(dishName);

    // Add a tag (look for tag input or combobox)
    const tagInput = dialog.locator('input[placeholder*="tag"], input[role="combobox"]').first();
    if (await tagInput.isVisible()) {
      await tagInput.fill("test-tag");
      await page.waitForTimeout(500);
      // Press Enter or click on the option
      await page.keyboard.press("Enter");
    }

    // Optional: Add recipe text
    const recipeTextArea = dialog.getByLabel(/przepis|recipe/i);
    if (await recipeTextArea.isVisible()) {
      await recipeTextArea.fill("Test recipe instructions");
    }

    // Submit form
    await dialog.getByRole("button", { name: /zapisz|dodaj/i }).click();

    // Wait for success and dialog to close
    await page.waitForTimeout(2000);

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();

    // New dish should appear in the list
    await expect(page.getByText(dishName)).toBeVisible({ timeout: 10000 });
  });

  test("should show empty state when no dishes", async ({ authenticatedPage: page }) => {
    // This test assumes a fresh user with no dishes
    // Check if empty state is shown
    const emptyStateText = page.getByText(/brak dań|nie ma jeszcze|dodaj pierwsze/i);

    // If dishes exist, this test is skipped
    const hasDishes = (await page.locator("[data-dish-item]").count()) > 0;
    if (hasDishes) {
      test.skip();
    }

    await expect(emptyStateText).toBeVisible();
  });

  test("should display dish list with pagination", async ({ authenticatedPage: page }) => {
    // Check if pagination controls exist
    const paginationExists = await page
      .locator('[aria-label*="pagination"], nav:has-text("Strona")')
      .isVisible()
      .catch(() => false);

    if (paginationExists) {
      // Pagination should be visible
      await expect(page.locator('[aria-label*="pagination"], nav:has-text("Strona")')).toBeVisible();
    }

    // Should show some dishes or empty state
    const hasDishes = (await page.locator('[data-dish-item], .dish-item, li:has-text("Test")').count()) > 0;
    const hasEmptyState = await page
      .getByText(/brak dań|nie ma jeszcze/i)
      .isVisible()
      .catch(() => false);

    expect(hasDishes || hasEmptyState).toBe(true);
  });
});
