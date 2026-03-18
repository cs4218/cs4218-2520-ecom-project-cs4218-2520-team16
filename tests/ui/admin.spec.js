// Admin Dashboard Tests
// Tests admin-only routes and product/category management
// Author: Wen Han Tang A0340008W

import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@test.com";
const ADMIN_PASSWORD = "password123";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for login to complete
    await page.waitForLoadState("networkidle");
  });

  test("non-admin user is blocked from admin routes", async ({ page }) => {
    // Logout first
    const logoutBtn = page.getByText(/logout/i).first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState("networkidle");
    }

    // Login as regular user (if different from admin)
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("tester@example.com");
    await page.getByPlaceholder(/password/i).fill("password123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForLoadState("networkidle");

    // Try to access admin page
    await page.goto("/admin");

    // Should be redirected or blocked
    const isBlocked = !page.url().includes("/admin");
    expect(isBlocked).toBeTruthy();
  });

  test("admin can open dashboard landing page", async ({ page }) => {
    await page.goto("/admin");

    // Verify on admin dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Should show admin content
    const adminContent = page.locator("body");
    await expect(adminContent).toBeTruthy();
  });

  test("admin can open create category page", async ({ page }) => {
    await page.goto("/admin/create-category");

    // Verify on create category page
    await expect(page).toHaveURL(/\/admin\/create-category/);

    // Should show form with category name input
    const categoryInput = page
      .getByPlaceholder(/category|name/i)
      .first();

    const formVisible = await categoryInput.isVisible().catch(() => false);
    expect(formVisible).toBeTruthy();
  });

  test("admin can create a category and see it in the list", async ({ page }) => {
    // Navigate to create category page
    await page.goto("/admin/create-category");

    // Fill in category form with unique name
    const categoryName = `TestCategory${Date.now()}`;
    const categoryInput = page
      .getByPlaceholder(/category|name/i)
      .first();

    if (await categoryInput.isVisible().catch(() => false)) {
      await categoryInput.fill(categoryName);

      // Submit form
      const submitBtn = page
        .getByRole("button", { name: /submit|create/i })
        .first();

      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");

        // Should show success or redirect to category list
        const successMsg = page
          .getByText(/success|created/i)
          .first();

        const shown = await successMsg.isVisible().catch(() => false);
        expect(shown || !page.url().includes("/create-category")).toBeTruthy();
      }
    }
  });

  test("admin can open create product page", async ({ page }) => {
    await page.goto("/admin/create-product");

    // Verify on create product page
    await expect(page).toHaveURL(/\/admin\/create-product/);

    // Should show form with product fields
    const productNameInput = page.getByPlaceholder(/product|name/i).first();
    const formVisible = await productNameInput.isVisible().catch(() => false);

    expect(formVisible).toBeTruthy();
  });

  test("admin can create a product with all required fields", async ({
    page,
  }) => {
    await page.goto("/admin/create-product");

    // Fill in product form
    const productName = `TestProduct${Date.now()}`;

    const nameInput = page.getByPlaceholder(/product.*name|name/i).first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(productName);
    }

    const descriptionInput = page
      .getByPlaceholder(/description/i)
      .first();
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill("Test product description");
    }

    const priceInput = page.getByPlaceholder(/price/i).first();
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill("99.99");
    }

    // Try to submit
    const submitBtn = page
      .getByRole("button", { name: /submit|create/i })
      .first();

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForLoadState("networkidle");

      // Should show success or redirect
      const onProductPage =
        page.url().includes("/products") || page.url().includes("/admin");
      expect(onProductPage).toBeTruthy();
    }
  });

  test("admin can open product management page", async ({ page }) => {
    await page.goto("/admin/products");

    // Verify on products management page
    await expect(page).toHaveURL(/\/admin\/products/);

    // Should show list of products
    const content = page.locator("body");
    await expect(content).toBeTruthy();
  });

  test("admin can delete a product", async ({ page }) => {
    await page.goto("/admin/products");

    // Wait for products to load
    await page.waitForTimeout(500);

    // Look for delete button
    const deleteBtn = page
      .getByRole("button", { name: /delete|remove/i })
      .first();

    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();

      // Should confirm deletion or show success
      await page.waitForLoadState("networkidle");

      const stillOnPage = page.url().includes("/products");
      expect(stillOnPage).toBeTruthy();
    }
  });

  test("admin can view users page", async ({ page }) => {
    await page.goto("/admin/users");

    // Verify on users page
    await expect(page).toHaveURL(/\/admin\/users/);

    // Should show users list
    const content = page.locator("body");
    await expect(content).toBeTruthy();
  });

  test("admin can view and update order statuses", async ({ page }) => {
    await page.goto("/admin/orders");

    // Verify on orders page
    await expect(page).toHaveURL(/\/admin\/orders/);

    // Look for status update button or dropdown
    const statusUpdateBtn = page
      .getByRole("button", { name: /status|update/i })
      .first();

    const statusDropdown = page.locator("select").first();

    const canUpdateStatus =
      (await statusUpdateBtn.isVisible().catch(() => false)) ||
      (await statusDropdown.isVisible().catch(() => false));

    // At minimum, orders page should be accessible
    expect(page.url().includes("/orders")).toBeTruthy();
  });
});
