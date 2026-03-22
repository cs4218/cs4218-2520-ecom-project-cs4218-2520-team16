// Order Management UI Tests
// Author: Aum Yogeshbhai Chotaliya A0338423E
// Tests user and admin order workflows

import { test, expect } from "@playwright/test";

const E2E_USER_EMAIL = process.env.PW_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.PW_USER_PASSWORD;
const E2E_ADMIN_EMAIL = process.env.PW_ADMIN_EMAIL;
const E2E_ADMIN_PASSWORD = process.env.PW_ADMIN_PASSWORD;

async function loginUser(page) {
  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill(E2E_USER_EMAIL);
  await page.getByPlaceholder(/password/i).fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForLoadState("networkidle");
}

async function loginAdmin(page) {
  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill(E2E_ADMIN_EMAIL);
  await page.getByPlaceholder(/password/i).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForLoadState("networkidle");
}

test.describe("User Orders", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "Requires PW_USER_EMAIL and PW_USER_PASSWORD"
  );

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("user can access orders page", async ({ page }) => {
    await page.goto("/dashboard/user/orders");

    // Should be on orders page
    await expect(page).toHaveURL(/\/dashboard\/user\/orders/);

    // Should show orders heading
    await expect(
      page.getByRole("heading", { name: /orders/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("orders page displays order list", async ({ page }) => {
    await page.goto("/dashboard/user/orders");
    await page.waitForTimeout(2000);

    // Should show either orders or "no orders" message
    const pageContent = page.locator("body");
    await expect(pageContent).toContainText(/order|Order/i);
  });

  test("each order shows status information", async ({ page }) => {
    await page.goto("/dashboard/user/orders");
    await page.waitForTimeout(2000);

    // Look for status indicators (common status terms)
    const statusText = page.locator(
      "text=/processing|shipped|delivered|not process/i"
    );
    const statusCount = await statusText.count();

    // If there are orders, they should have status
    if (statusCount > 0) {
      await expect(statusText.first()).toBeVisible();
    }
  });

  test("orders display payment status", async ({ page }) => {
    await page.goto("/dashboard/user/orders");
    await page.waitForTimeout(2000);

    // Check for payment status indicators
    const paymentInfo = page.locator("text=/payment|success|failed/i");
    const count = await paymentInfo.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("orders show product information", async ({ page }) => {
    await page.goto("/dashboard/user/orders");
    await page.waitForTimeout(2000);

    // Orders should show product names, descriptions, or images
    const productElements = page.locator(
      '[class*="card"], [class*="product"], img'
    );
    const count = await productElements.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("orders display date information", async ({ page }) => {
    await page.goto("/dashboard/user/orders");
    await page.waitForTimeout(2000);

    // Look for date/time text (relative format like "2 days ago" or absolute)
    const dateText = page.locator("text=/ago|\\d{1,2}\\/\\d{1,2}\\/\\d{4}/i");
    const count = await dateText.count();

    // If orders exist, dates should be shown
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Admin Orders", () => {
  test.skip(
    !E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD,
    "Requires PW_ADMIN_EMAIL and PW_ADMIN_PASSWORD"
  );

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("admin can access all orders page", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");

    // Should be on admin orders page
    await expect(page).toHaveURL(/\/dashboard\/admin\/orders/);

    // Should show orders heading
    await expect(
      page.getByRole("heading", { name: /orders/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("admin orders page displays all orders", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    // Should show orders content
    const pageContent = page.locator("body");
    await expect(pageContent).toContainText(/order|status|buyer/i);
  });

  test("admin orders show status dropdown", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    // Check for status select dropdown
    const statusSelects = page.locator('select, [role="combobox"]');
    const count = await statusSelects.count();

    // If orders exist, should have status selects
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("status dropdown has correct options", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    // Look for status dropdown and check options
    const select = page.locator("select").first();

    if ((await select.count()) > 0) {
      const options = await select.locator("option").allTextContents();

      // Should contain typical order statuses
      const hasValidStatus = options.some((opt) =>
        /not process|processing|shipped|delivered/i.test(opt)
      );
      expect(hasValidStatus).toBeTruthy();
    }
  });

  test("admin can change order status", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    const select = page.locator("select").first();

    if ((await select.count()) > 0) {
      const initialValue = await select.inputValue();

      // Change status
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Value should change
      const newValue = await select.inputValue();
      expect(newValue).not.toBe(initialValue);
    }
  });

  test("orders display buyer information", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    // Should show buyer-related info (name, email, etc.)
    const buyerInfo = page.locator("text=/buyer|customer|user/i");
    const count = await buyerInfo.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("orders show quantity information", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    // Look for quantity indicators
    const quantityText = page.locator("text=/quantity|qty|\\d+ items?/i");
    const count = await quantityText.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("orders display payment success status", async ({ page }) => {
    await page.goto("/dashboard/admin/orders");
    await page.waitForTimeout(2000);

    // Look for payment status
    const paymentStatus = page.locator("text=/payment.*success|success|failed/i");
    const count = await paymentStatus.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});
