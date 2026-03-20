// Xiao Ao A0233705L
// UI Test using Black-Box approach with Playwright
// User scenario: Search for a product and view its details

import { test, expect } from "@playwright/test";

const MOCK_SEARCH_RESULTS = [
  {
    _id: "search-mock-1",
    name: "Phone Alpha",
    slug: "phone-alpha",
    description: "Mocked phone search result",
    price: 199,
    category: { _id: "cat-1", name: "Electronics" },
  },
];

test.describe("Search and Product Detail User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/product/search/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_RESULTS),
      });
    });

    await page.goto("/");
    // Wait for products to load
    await expect(page.getByText("All Products")).toBeVisible();
  });

  test("user can search for a product and see results", async ({ page }) => {
    // Step 1: Type keyword in search bar
    await page.getByPlaceholder("Search").fill("phone");

    // Step 2: Submit search using the explicit submit button for CI stability.
    await page.getByRole("button", { name: /^Search$/ }).click();

    // Step 3: Verify navigated to search results page
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });

    // Step 4: Verify result count is displayed ("Found X" or "No Products Found")
    await expect(page.getByText(/Found|No Products Found/)).toBeVisible();
  });

  test("user can view product details from search results", async ({
    page,
  }) => {
    // Step 1: Search for a product
    await page.getByPlaceholder("Search").fill("phone");
    await page.getByRole("button", { name: /^Search$/ }).click();

    // Step 2: Wait for search results
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });

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
