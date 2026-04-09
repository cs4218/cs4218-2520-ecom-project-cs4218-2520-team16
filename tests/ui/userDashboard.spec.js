// Written by Roger Yao A0340029N with the assistance of Copilot
// UI Test using Black-Box approach with Playwright
// User scenario: Login, update profile, and view orders

import { test, expect } from "@playwright/test";

const E2E_USER_EMAIL = process.env.PW_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.PW_USER_PASSWORD;

// Helper function to login a user
async function loginUser(page) {
  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill(E2E_USER_EMAIL);
  await page.getByPlaceholder(/password/i).fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for redirect to homepage after login
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
}

test.describe("User Dashboard Access Control", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "Requires PW_USER_EMAIL and PW_USER_PASSWORD for user dashboard tests"
  );

  test.describe("Unauthenticated Access Blocking", () => {
    test("unauthenticated user is blocked from dashboard landing page", async ({
      page,
    }) => {
      // Step 1: Clear all authentication data
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Step 2: Try to navigate to dashboard landing page
      await page.goto("/dashboard/user", { waitUntil: "networkidle" });

      // Step 3: Wait for spinner to finish and redirect to complete
      await page.waitForTimeout(4000);

      // Step 4: Verify user is redirected to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("unauthenticated user is blocked from profile page", async ({
      page,
    }) => {
      // Step 1: Clear all authentication data
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Step 2: Try to navigate to profile page
      await page.goto("/dashboard/user/profile", { waitUntil: "networkidle" });

      // Step 3: Wait for spinner to finish and redirect to complete
      await page.waitForTimeout(4000);

      // Step 4: Verify user is redirected to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("unauthenticated user is blocked from orders page", async ({
      page,
    }) => {
      // Step 1: Clear all authentication data
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Step 2: Try to navigate to orders page
      await page.goto("/dashboard/user/orders", { waitUntil: "networkidle" });

      // Step 3: Wait for spinner to finish and redirect to complete
      await page.waitForTimeout(4000);

      // Step 4: Verify user is redirected to login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Logged-in User Dashboard Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test in this group
      await loginUser(page);
    });

    test("logged-in user can open dashboard landing page", async ({ page }) => {
      // Step 1: Navigate to dashboard landing page
      await page.goto("/dashboard/user");

      // Step 2: Verify the dashboard page loads
      await expect(page).toHaveURL(/dashboard\/user(?:\/|$)/);

      // Step 3: Verify dashboard content is visible (check for typical dashboard elements)
      // Looking for either a heading or navigation that indicates we're on the dashboard
      const dashboardContent = await page
        .locator("h1, h2, [class*='dashboard']")
        .first();
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });

    test("logged-in user can open profile page", async ({ page }) => {
      // Step 1: Navigate to profile page
      await page.goto("/dashboard/user/profile");

      // Step 2: Verify we're on the profile page
      await expect(page).toHaveURL(/dashboard\/user\/profile/);

      // Step 3: Verify profile form is visible
      await expect(
        page.getByPlaceholder("Enter Your Name")
      ).toBeVisible();
    });
  });
});