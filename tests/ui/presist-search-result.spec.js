// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

test.describe("Search Page Cart Journey", () => {
  const mockSearchResult = {
    _id: "persist-search-1",
    name: "Product Name",
    slug: "product-name",
    description: "Mocked phone search result for cart persistence coverage",
    price: 199,
    category: { _id: "cat-1", name: "Electronics" },
  };

  test("adding to cart from search results persists after a refresh", async ({
    page,
  }) => {
    // Arrange
    await page.route("**/api/v1/product/search/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockSearchResult]),
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("All Products")).toBeVisible();
    await page.getByPlaceholder("Search").fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    // Act
    await expect(page).toHaveURL("/search");
    await expect(page.getByText("Found 1")).toBeVisible();
    await expect(page.getByText(mockSearchResult.name, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "add to cart" }).click();
    await page.goto("/cart");

    // Assert
    await expect(
      page.getByText(mockSearchResult.name, { exact: true })
    ).toBeVisible();
    await page.reload();

    await expect(
      page.getByText(mockSearchResult.name, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("You Have 1 items in your cart")
    ).toBeVisible();
  });
});
