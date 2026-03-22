// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

const INITIAL_PASSWORD = "Password123!";

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerUser(page, { email, password, address, answer }) {
  await page.goto("/register");

  await page.getByPlaceholder(/name/i).fill("Test User");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByPlaceholder(/phone/i).fill("91234567");
  await page.getByPlaceholder(/address/i).fill(address);
  await page.locator('input[type="date"]').fill("1998-01-01");
  await page.getByPlaceholder(/favorite sports/i).fill(answer);
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page).toHaveURL(/\/login$/);
}

test.describe("Login Redirect From Cart", () => {
  test("guest checkout login returns the user to the cart page", async ({
    page,
  }) => {
    const email = uniqueEmail("cart-login");
    const answer = "football";

    await registerUser(page, {
      email,
      password: INITIAL_PASSWORD,
      address: "123 Test Street",
      answer,
    });

    await page.goto("/");
    await expect(page.getByText("All Products")).toBeVisible();

    const firstCard = page.locator(".card").first();
    const productName =
      (await firstCard.locator(".card-title").first().textContent())?.trim() ||
      "";

    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await page.goto("/cart");

    await expect(
      page.getByText(/You Have 1 items in your cart/i)
    ).toBeVisible();

    await page
      .getByRole("button", { name: /plase login to checkout/i })
      .click();

    await expect(page).toHaveURL(/\/login$/);

    await page.getByPlaceholder(/enter your email/i).fill(email);
    await page
      .getByPlaceholder(/enter your password/i)
      .fill(INITIAL_PASSWORD);
    await page.getByRole("button", { name: /^login$/i }).click();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(/Hello Test User/i)).toBeVisible();
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
  });
});
