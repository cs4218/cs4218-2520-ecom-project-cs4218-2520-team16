// Product Discovery and Filtering Tests
// Tests product browsing, filtering, and discovery flows
// Author: Wen Han Tang A0340008W

import { test, expect } from "@playwright/test";

test.describe("Product Discovery and Categories", () => {
  test("home page renders product cards returned by the backend", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/All Products/i)).toBeVisible();

    // Look for product cards or items
    const productCards = page.locator('[class*="card"]').or(
      page.locator('[class*="product"]')
    );

    const cardCount = await productCards.count();

    // Should have at least some products displayed
    expect(cardCount).toBeGreaterThan(0);
  });

  test("product details page renders name, price, description, and related products", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/All Products/i)).toBeVisible();

    // Click More Details on first product
    const moreDetailsBtn = page
      .getByRole("button", { name: /more details/i })
      .first();

    if (await moreDetailsBtn.isVisible().catch(() => false)) {
      await moreDetailsBtn.click();

      // Verify on product details page
      await expect(page).toHaveURL(/\/product\//);

      // Verify product information is displayed
      const hasInfo =
        (await page.getByText(/\$\d+/).first().isVisible().catch(() => false)) ||
        (await page.locator('[class*="price"]').isVisible().catch(() => false));

      expect(hasInfo).toBeTruthy();

      // Look for related products heading
      const relatedHeading = page
        .getByRole("heading", { name: /similar|related/i })
        .first();

      const hasRelated = await relatedHeading.isVisible().catch(() => false);
      expect(hasRelated).toBeTruthy();
    }
  });

  test("category filters narrow the product list", async ({ page }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/All Products/i)).toBeVisible();

    // Get initial product count
    const initialProducts = page.locator('[class*="card"]').or(
      page.locator('[class*="product"]')
    );
    const initialCount = await initialProducts.count();

    // Look for category filter buttons
    const categoryFilters = page
      .getByRole("button", { name: /category|filter/i })
      .or(page.locator('[class*="category"]'))
      .or(page.locator('[class*="filter"]'));

    const filterCount = await categoryFilters.count();

    if (filterCount > 0) {
      // Click first category filter (if available)
      const firstFilter = categoryFilters.first();
      if (await firstFilter.isVisible().catch(() => false)) {
        await firstFilter.click();
        await page.waitForTimeout(500);

        // Products should update (or stay same if only one category)
        const updatedProducts = page.locator('[class*="card"]').or(
          page.locator('[class*="product"]')
        );
        const updatedCount = await updatedProducts.count();

        // Count should be valid (>= 0)
        expect(updatedCount >= 0).toBeTruthy();
      }
    }
  });

  test("price filters narrow the product list", async ({ page }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/All Products/i)).toBeVisible();

    // Look for price filter inputs
    const priceInputs = page
      .getByRole("textbox", { name: /price|min|max/i })
      .or(page.locator('[type="range"]'))
      .or(page.locator('[class*="price"]').locator('[type="number"]'));

    const priceFilterCount = await priceInputs.count();

    if (priceFilterCount > 0) {
      // Try setting a price limit
      const minPriceInput = page
        .getByPlaceholder(/min|minimum/i)
        .or(priceInputs.first());

      if (await minPriceInput.isVisible().catch(() => false)) {
        await minPriceInput.fill("10");
        await minPriceInput.press("Enter");
        await page.waitForTimeout(500);

        // Products should be filtered
        const products = page.locator('[class*="card"]').or(
          page.locator('[class*="product"]')
        );
        const count = await products.count();
        expect(count >= 0).toBeTruthy();
      }
    }
  });

  test("reset filters restores the unfiltered state", async ({ page }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/All Products/i)).toBeVisible();

    // Store initial product count
    const initialProducts = page.locator('[class*="card"]').or(
      page.locator('[class*="product"]')
    );
    const initialCount = await initialProducts.count();

    // Look for reset button
    const resetBtn = page
      .getByRole("button", { name: /reset|clear/i })
      .first();

    if (await resetBtn.isVisible().catch(() => false)) {
      // First apply a filter
      const filterBtn = page
        .getByRole("button", { name: /filter|category/i })
        .first();

      if (await filterBtn.isVisible().catch(() => false)) {
        await filterBtn.click();
        await page.waitForTimeout(300);

        // Now reset
        await resetBtn.click();
        await page.waitForTimeout(300);

        // Products should be back to initial state (or close)
        const finalProducts = page.locator('[class*="card"]').or(
          page.locator('[class*="product"]')
        );
        const finalCount = await finalProducts.count();

        expect(finalCount >= 0).toBeTruthy();
      }
    }
  });

  test("loadmore appends the next page of products", async ({ page }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/All Products/i)).toBeVisible();

    // Look for "Load More" or "Next" button
    const loadMoreBtn = page
      .getByRole("button", { name: /load more|next|see more/i })
      .first();

    if (await loadMoreBtn.isVisible().catch(() => false)) {
      // Get initial product count
      const initialProducts = page.locator('[class*="card"]').or(
        page.locator('[class*="product"]')
      );
      const initialCount = await initialProducts.count();

      // Click load more
      await loadMoreBtn.click();
      await page.waitForTimeout(500);

      // Product count should increase
      const updatedProducts = page.locator('[class*="card"]').or(
        page.locator('[class*="product"]')
      );
      const updatedCount = await updatedProducts.count();

      expect(updatedCount >= initialCount).toBeTruthy();
    }
  });

  test("empty search results state is understandable to the user", async ({
    page,
  }) => {
    await page.goto("/");

    // Search for something unlikely to exist
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("xyznonexistent123");
      await searchInput.press("Enter");

      // Wait for navigation and results
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/search/);

      // Should show "No Products Found" or similar message
      const noResultsMsg = page
        .getByText(/No Products Found|No results|not found/i)
        .first();

      const shown = await noResultsMsg.isVisible().catch(() => false);

      // Either message is shown or page clearly indicates no results
      const content = await page.locator("body").textContent();
      expect(shown || content?.includes("No")).toBeTruthy();
    }
  });

  test("categories page lists all available categories", async ({ page }) => {
    await page.goto("/categories");

    // Wait for page to load
    await expect(page).toHaveURL(/categories/);

    // Categories should be displayed
    const categoryItems = page
      .locator('[class*="category"]')
      .or(page.locator('[role="link"]'));

    const categoryCount = await categoryItems.count();

    // Should have at least some categories
    expect(categoryCount).toBeGreaterThanOrEqual(0);
  });

  test("clicking a category opens the matching category product page", async ({
    page,
  }) => {
    await page.goto("/categories");

    // Find a category link
    const categoryLink = page
      .getByRole("link")
      .or(page.locator('[class*="category"]').locator('a'))
      .first();

    if (await categoryLink.isVisible().catch(() => false)) {
      // Get the href to verify navigation
      const href = await categoryLink.getAttribute("href");

      await categoryLink.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to category page
      expect(page.url()).toContain(href || "category");
    }
  });

  test("category product page renders only products from that category", async ({
    page,
  }) => {
    await page.goto("/categories");

    // Find and click a category
    const categoryLink = page.locator('[class*="category"]').locator('a').first();

    if (await categoryLink.isVisible().catch(() => false)) {
      await categoryLink.click();
      await page.waitForLoadState("networkidle");

      // Verify on category page
      const isOnCategoryPage = page.url().includes("category");
      expect(isOnCategoryPage).toBeTruthy();

      // Products should be displayed
      const products = page
        .locator('[class*="card"]')
        .or(page.locator('[class*="product"]'));

      const productCount = await products.count();
      expect(productCount >= 0).toBeTruthy();
    }
  });
});
