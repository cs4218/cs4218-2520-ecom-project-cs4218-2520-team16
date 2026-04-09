// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

test.describe("Create Category Page", () => {
  test("admin can edit a category and then delete it from the manage page", async ({
    page,
  }) => {
    test.skip(!process.env.PW_ADMIN_EMAIL || !process.env.PW_ADMIN_PASSWORD, "process.env.PW_ADMIN_EMAIL or process.env.PW_ADMIN_PASSWORD is invalid");

    const originalName = `Category${Date.now()}`;
    const updatedName = `${originalName}Updated`;

    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(process.env.PW_ADMIN_EMAIL);
    await page.getByPlaceholder(/password/i).fill(process.env.PW_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
    
    await page.goto("/dashboard/admin/create-category");

    await page
      .getByPlaceholder(/enter new category/i)
      .first()
      .fill(originalName);
    await page.getByRole("button", { name: "Submit" }).first().click();

    const originalRow = page.locator("tr", { hasText: originalName });
    await expect(originalRow).toBeVisible();

    await originalRow.getByRole("button", { name: "Edit" }).click();

    const modalInput = page.getByPlaceholder(/enter new category/i).last();
    await expect(modalInput).toBeVisible();
    await modalInput.fill(updatedName);
    await page.getByRole("button", { name: "Submit" }).last().click();

    const updatedRow = page.locator("tr", { hasText: updatedName });
    await expect(updatedRow).toBeVisible();

    await updatedRow.getByRole("button", { name: "Delete" }).click();

    await expect(page.locator("tr", { hasText: updatedName })).toHaveCount(0);
  });
});
