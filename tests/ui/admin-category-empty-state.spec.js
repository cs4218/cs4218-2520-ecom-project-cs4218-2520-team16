// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";


async function loginAsAdmin(page) {
  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill("admin@admin.com");
  await page.getByPlaceholder(/password/i).fill("admin");
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
}

test.describe("Empty category storefront state", () => {

  test("a newly created category with no products shows the empty storefront fallback", async ({
    page,
  }) => {
    const categoryName = `empty-category-${Date.now()}`;

    await loginAsAdmin(page);

    try {
      await page.goto("/dashboard/admin/create-category");
      await page
        .getByPlaceholder(/enter new category/i)
        .first()
        .fill(categoryName);
      await page.getByRole("button", { name: "Submit" }).first().click();

      const categoryRow = page.locator("tr", { hasText: categoryName });
      await expect(categoryRow).toBeVisible();

      await page.goto("/categories");
      await page.getByRole("link", { name: categoryName }).last().click();

      await expect(page).toHaveURL(/\/category\//);
      await expect(
        page.getByText("No products found in this category yet.")
      ).toBeVisible();
    } finally {
      await page.goto("/dashboard/admin/create-category");
      const categoryRow = page.locator("tr", { hasText: categoryName });
      if (await categoryRow.count()) {
        await categoryRow.getByRole("button", { name: "Delete" }).click();
      }
    }
  });
});
