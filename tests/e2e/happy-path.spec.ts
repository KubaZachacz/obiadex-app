import { expect, test } from "@playwright/test";

const dishName = "E2E Test Dish";
const tagName = "e2e-tag";

const formatLocalDateISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

test("happy path: create dish, plan it for today, clean up, logout", async ({ page }) => {
  const email = process.env.TEST_USER;
  const password = process.env.TEST_USER_PASSWORD;

  test.skip(!email || !password, "Missing TEST_USER or TEST_USER_PASSWORD in env.");

  if (!email || !password) {
    return;
  }

  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();

  await expect(page).toHaveURL(/\/(?:\?|$)/);

  const welcomeModal = page.getByTestId("welcome-modal");
  if ((await welcomeModal.count()) > 0 && (await welcomeModal.isVisible())) {
    await page.getByTestId("welcome-modal-close").click();
    await expect(welcomeModal).toBeHidden();
  }

  await page.getByTestId("nav-dishes").click();
  await expect(page).toHaveURL(/\/dishes(?:\?|$)/);

  await page.getByTestId("fab-button").click();
  await expect(page.getByTestId("dish-editor-overlay")).toBeVisible();

  await page.getByTestId("dish-name-input").fill(dishName);

  await page.getByTestId("dish-tags").click();
  await page.getByTestId("dish-tags-search").fill(tagName);

  const createTagOption = page.getByTestId("dish-tags-create");
  if ((await createTagOption.count()) > 0 && (await createTagOption.isVisible())) {
    await createTagOption.click();
  } else {
    await page.getByTestId(`dish-tags-option-${tagName}`).click();
  }

  await page.keyboard.press("Escape");
  await page.getByTestId("dish-submit").click();

  await expect(page.getByTestId("dish-editor-overlay")).toBeHidden();

  const dishCard = page.locator(`[data-testid="dish-card"][data-dish-name="${dishName}"]`);
  await expect(dishCard).toBeVisible();

  await page.getByTestId("nav-plan").click();
  await expect(page).toHaveURL(/\/(?:\?|$)/);

  const todayIso = formatLocalDateISO(new Date());
  const todayCard = page.locator(`[data-testid="day-card"][data-day="${todayIso}"]`);
  await expect(todayCard).toBeVisible();
  await todayCard.click();

  await expect(page.getByTestId("day-plan-overlay")).toBeVisible();

  const editButton = page.getByTestId("day-plan-edit");
  if ((await editButton.count()) > 0) {
    await editButton.click();
  }

  await page.getByTestId("day-plan-search").fill(dishName);
  const pickerItem = page.locator(`[data-testid="dish-picker-item"][data-dish-name="${dishName}"]`);
  await expect(pickerItem).toBeVisible();
  await pickerItem.click();

  await page.getByTestId("day-plan-save").click();
  await expect(page.getByTestId("day-plan-overlay")).toBeHidden();

  await expect(todayCard).toContainText(dishName);

  await todayCard.click();
  await expect(page.getByTestId("day-plan-overlay")).toBeVisible();
  await expect(page.getByTestId("day-plan-dish-name")).toHaveText(dishName);
  await page.getByTestId("day-plan-delete").click();
  await expect(page.getByTestId("day-plan-overlay")).toBeHidden();
  await expect(todayCard).not.toContainText(dishName);

  await page.getByTestId("nav-dishes").click();
  await expect(page).toHaveURL(/\/dishes(?:\?|$)/);

  const dishDeleteTrigger = dishCard.getByTestId("dish-delete-trigger");
  await dishDeleteTrigger.click();
  await expect(page.getByTestId("dish-delete-dialog")).toBeVisible();
  await page.getByTestId("dish-delete-confirm").click();
  await expect(dishCard).toHaveCount(0);

  await page.getByTestId("nav-logout").click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});
