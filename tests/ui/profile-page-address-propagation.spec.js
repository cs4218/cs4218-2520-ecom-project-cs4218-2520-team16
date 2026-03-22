// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

const INITIAL_PASSWORD = "Password123!";

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerUser(page, { email, password, address, answer }) {
  await page.goto("/register");

  await page.getByPlaceholder(/name/i).fill("Profile User");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByPlaceholder(/phone/i).fill("91234567");
  await page.getByPlaceholder(/address/i).fill(address);
  await page.locator('input[type="date"]').fill("1998-01-01");
  await page.getByPlaceholder(/favorite sports/i).fill(answer);
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page).toHaveURL(/\/login$/);
}

async function loginUser(page, { email, password }) {
  await page.getByPlaceholder(/enter your email/i).fill(email);
  await page.getByPlaceholder(/enter your password/i).fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
}

test.describe("Profile Page Address Propagation", () => {
  test("updating the profile address is reflected on the cart page", async ({
    page,
  }) => {
    const email = uniqueEmail("profile-user");
    const answer = "football";
    const updatedAddress = `987 Updated Avenue ${Date.now()}`;

    await registerUser(page, {
      email,
      password: INITIAL_PASSWORD,
      address: "Old Address",
      answer,
    });

    await loginUser(page, { email, password: INITIAL_PASSWORD });

    await page.goto("/");
    await expect(page.getByText("All Products")).toBeVisible();
    await page.getByRole("button", { name: /add to cart/i }).first().click();

    await page.goto("/dashboard/user/profile");
    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);

    const addressInput = page.getByPlaceholder("Enter Your Address");
    await addressInput.fill(updatedAddress);
    await page.getByRole("button", { name: "UPDATE" }).click();

    await expect(
      page.getByText("Profile Updated Successfully")
    ).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(/\/cart$/);

    await expect(page.getByText("Current Address")).toBeVisible();
    await expect(page.getByText(updatedAddress)).toBeVisible();
  });
});
