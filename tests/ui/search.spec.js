// Xiao Ao A0233705L
// UI Test using Black-Box approach with Playwright
// User scenario: Search for a product and view its details

import { test, expect } from "@playwright/test";

test.describe("Search and Product Detail User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for products to load
    await expect(page.getByText("All Products")).toBeVisible();
  });

  test("user can search for a product and see results", async ({ page }) => {
    // Step 1: Type keyword in search bar
    await page.getByPlaceholder("Search").fill("phone");

    // Step 2: Submit search via Enter (form uses onSubmit)
    await page.getByPlaceholder("Search").press("Enter");

    // Step 3: Verify navigated to search results page
    await expect(page).toHaveURL(/\/search/);

    // Step 4: Verify result count is displayed ("Found X" or "No Products Found")
    await expect(page.getByText(/Found|No Products Found/)).toBeVisible();
  });

  test("user can view product details from search results", async ({
    page,
  }) => {
    // Step 1: Search for a product
    await page.getByPlaceholder("Search").fill("phone");
    await page.getByPlaceholder("Search").press("Enter");

    // Step 2: Wait for search results
    await expect(page).toHaveURL(/\/search/);

    // Step 3: Verify result count shown
    await expect(page.getByText(/Found|No Products Found/)).toBeVisible();

    // Step 4: Click More Details on the first result
    const moreDetailsBtn = page.getByRole("button", { name: "More Details" }).first();
    await expect(moreDetailsBtn).toBeVisible();
    await moreDetailsBtn.click();

    // Step 5: Verify product details page loaded
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText("Product Details")).toBeVisible();

    // Step 6: Verify related products section is shown
    await expect(page.getByRole("heading", { name: /Similar Products/ })).toBeVisible();
  });
});
