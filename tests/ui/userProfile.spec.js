// Xiao Ao A0233705L
// UI Test using Black-Box approach with Playwright
// User scenario: Login, update profile, and view orders

import { test, expect } from "@playwright/test";

const E2E_USER_EMAIL = process.env.PW_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.PW_USER_PASSWORD;

test.describe("User Profile and Orders Journey", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "Requires PW_USER_EMAIL and PW_USER_PASSWORD for user profile tests"
  );

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(E2E_USER_EMAIL);
    await page.getByPlaceholder(/password/i).fill(E2E_USER_PASSWORD);
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for redirect to homepage after login
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
  });

  test("logged-in user can update their profile successfully", async ({
    page,
  }) => {
    // Step 1: Navigate to profile page
    await page.goto("/dashboard/user/profile");

    // Step 2: Verify profile form is visible
    await expect(
      page.getByPlaceholder("Enter Your Name")
    ).toBeVisible();

    // Step 3: Update the phone number
    await page.getByPlaceholder("Enter Your Phone").clear();
    await page.getByPlaceholder("Enter Your Phone").fill("91234567");

    // Step 4: Submit the form
    await page.getByRole("button", { name: "UPDATE" }).click();

    // Step 5: Verify success toast appears
    await expect(
      page.getByText("Profile Updated Successfully")
    ).toBeVisible();
  });

  test("logged-in user can view their orders page", async ({ page }) => {
    // Step 1: Navigate to orders page
    await page.goto("/dashboard/user/orders");

    // Step 2: Verify the orders page loads with its heading
    await expect(page.getByText("All Orders")).toBeVisible();

    // Step 3: Verify page is accessible (not redirected to login)
    await expect(page).toHaveURL(/dashboard\/user\/orders/);
  });
});
