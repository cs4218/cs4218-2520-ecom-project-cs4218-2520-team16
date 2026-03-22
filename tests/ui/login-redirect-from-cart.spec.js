// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

test.describe("Login Redirect From Cart", () => {
  test("guest checkout login returns the user to the cart page", async ({
    page,
  }) => {
    test.skip(!process.env.PW_USER_EMAIL || !process.env.PW_USER_PASSWORD, "process.env.PW_USER_EMAIL or process.env.PW_USER_PASSWORD is invalid");

    await page.goto("/login");
    await page.goto("/");
    await expect(page.getByText("All Products")).toBeVisible();

    const firstCard = page.locator(".card").first();
    const productName =
      (await firstCard.locator(".card-title").first().textContent())?.trim() ||
      "";

    await page.getByRole("button", { name: "add to cart" }).first().click();
    await page.goto("/cart");

    await expect(
      page.getByText("You Have 1 items in your cart")
    ).toBeVisible();

    await page
      .getByRole("button", { name: "plase login to checkout" })
      .click();

    await expect(page).toHaveURL("/login");

    await page.getByPlaceholder("Enter Your Email").fill(process.env.PW_USER_EMAIL);
    await page
      .getByPlaceholder("Enter your password")
      .fill(process.env.PW_USER_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).toHaveURL("/cart");
    await expect(page.getByText("hello")).toBeVisible();
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
  });
});
