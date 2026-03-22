// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

async function ensureCategoryExists(page) {
  await page.goto("/dashboard/admin/create-category");

  const categoryRows = page.locator("tbody tr");
  if ((await categoryRows.count()) > 0) {
    return;
  }

  const categoryName = `autocategory-${Date.now()}`;
  await page
    .getByPlaceholder(/enter new category/i)
    .first()
    .fill(categoryName);
  await page.getByRole("button", { name: "Submit" }).first().click();
  await expect(page.locator("tr", { hasText: categoryName })).toBeVisible();
}

async function ensureProductExists(page) {
  await page.goto("/dashboard/admin/products");
  await expect(
    page.getByRole("heading", { name: "All Products List" })
  ).toBeVisible();
  await page.waitForTimeout(1000);

  const productLinks = page.locator('a[href^="/dashboard/admin/product/"]');
  if ((await productLinks.count()) > 0) {
    return null;
  }

  await ensureCategoryExists(page);
  await page.goto("/dashboard/admin/create-product");

  const productName = `autoproduct-${Date.now()}`;

  await page.getByRole("combobox").first().click();
  await page.locator(".ant-select-item-option-content").first().click();

  await page.getByPlaceholder("write a name").fill(productName);
  await page
    .getByPlaceholder("write a description")
    .fill("Auto-created product for admin update page coverage");
  await page.getByPlaceholder("write a Price").fill("99.99");
  await page.getByPlaceholder("write a quantity").fill("10");
  await page.getByRole("button", { name: /create product/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin\/products$/);
  await expect(page.getByText(productName, { exact: true })).toBeVisible();
  return productName;
}

test.describe("Admin product edit entrypoint", () => {

  test("admin can open the update product page from the products list", async ({
    page,
  }) => {
    test.skip(!process.env.PW_ADMIN_EMAIL || !process.env.PW_ADMIN_PASSWORD, "process.env.PW_ADMIN_EMAIL or process.env.PW_ADMIN_PASSWORD is invalid");

    await page.goto("/login");
    await page.getByPlaceholder("Enter Your Email").fill(process.env.PW_ADMIN_EMAIL);
    await page.getByPlaceholder("Enter Your Password").fill(process.env.PW_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page).not.toHaveURL("/login", { timeout: 10000 });
    
    const createdProductName = await ensureProductExists(page);
    await page.goto("/dashboard/admin/products");
    await expect(
      page.getByRole("heading", { name: "All Products List" })
    ).toBeVisible();
    await page.waitForTimeout(1000);

    const targetProductLink = createdProductName
      ? page
          .locator('a[href^="/dashboard/admin/product/"]', {
            hasText: createdProductName,
          })
          .first()
      : page.locator('a[href^="/dashboard/admin/product/"]').first();

    await targetProductLink.click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/product\/.+$/);
    await expect(page.getByRole("heading", { name: "Update Product" })).toBeVisible();
    await expect(page.getByPlaceholder("write a name")).toHaveValue(/.+/);
    await expect(page.getByPlaceholder("write a description")).toHaveValue(/.+/);
    await expect(page.getByPlaceholder("write a Price")).toHaveValue(/.+/);
    await expect(page.getByPlaceholder("write a quantity")).toHaveValue(/.+/);
  });
});
