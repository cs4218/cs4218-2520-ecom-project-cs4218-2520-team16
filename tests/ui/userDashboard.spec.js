// User Dashboard E2E Tests
// Tests user dashboard access control and navigation flows
// Author: Claude Code

import { test, expect } from "@playwright/test";

const E2E_USER_EMAIL = process.env.PW_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.PW_USER_PASSWORD;

async function loginAsUser(page, email, password) {
  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
}

test.describe("User Dashboard Access Control", () => {
  test("unauthenticated user is blocked from user dashboard routes", async ({
    page,
  }) => {
    // Attempt to navigate to dashboard without authentication
    await page.goto("/dashboard/user");

    // Should either see spinner/loading state or be redirected away from dashboard
    // The Spinner redirects to login after 3 seconds, so we check the final URL
    await page.waitForTimeout(4000);

    // After redirect, user should be on login page or home page, not dashboard
    const finalUrl = page.url();
    expect(!finalUrl.includes("/dashboard/user")).toBeTruthy();
  });

  test("unauthenticated user is blocked from profile page", async ({
    page,
  }) => {
    // Attempt to navigate to profile page without authentication
    await page.goto("/dashboard/user/profile");

    // Should be redirected away after 3 seconds
    await page.waitForTimeout(4000);

    // User should not be on the profile page
    const finalUrl = page.url();
    expect(!finalUrl.includes("/dashboard/user/profile")).toBeTruthy();
  });

  test("unauthenticated user is blocked from orders page", async ({
    page,
  }) => {
    // Attempt to navigate to orders page without authentication
    await page.goto("/dashboard/user/orders");

    // Should be redirected away after 3 seconds
    await page.waitForTimeout(4000);

    // User should not be on the orders page
    const finalUrl = page.url();
    expect(!finalUrl.includes("/dashboard/user/orders")).toBeTruthy();
  });
});

test.describe("Logged-in User Dashboard Access", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "Requires PW_USER_EMAIL and PW_USER_PASSWORD for authenticated dashboard tests"
  );

  test("logged-in user can open the dashboard landing page", async ({
    page,
  }) => {
    // Step 1: Login with valid credentials
    await loginAsUser(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);

    // Step 2: Navigate to dashboard user page
    await page.goto("/dashboard/user");

    // Step 3: Verify on dashboard page
    await expect(page).toHaveURL(/\/dashboard\/user$/);

    // Step 4: Verify dashboard content is visible
    // Dashboard should display user information
    await expect(page.locator(".dashboard")).toBeVisible();

    // Step 5: Verify user menu is rendered on sidebar
    await expect(page.getByRole("list")).toBeVisible();
  });

  test("logged-in user can open profile page", async ({ page }) => {
    // Step 1: Login with valid credentials
    await loginAsUser(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);

    // Step 2: Navigate to profile page
    await page.goto("/dashboard/user/profile");

    // Step 3: Verify on profile page
    await expect(page).toHaveURL(/\/dashboard\/user\/profile/);

    // Step 4: Verify profile form fields are visible
    await expect(
      page.getByPlaceholder("Enter Your Name")
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter Your Phone")
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter Your Address")
    ).toBeVisible();
  });

  test("logged-in user can navigate from dashboard to profile via menu", async ({
    page,
  }) => {
    // Step 1: Login with valid credentials
    await loginAsUser(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);

    // Step 2: Navigate to dashboard
    await page.goto("/dashboard/user");

    // Step 3: Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard\/user$/);

    // Step 4: Find and click profile link in menu
    const profileLink = page.getByRole("link", { name: /profile/i }).first();
    await profileLink.click();

    // Step 5: Verify navigation to profile page
    await expect(page).toHaveURL(/\/dashboard\/user\/profile/);

    // Step 6: Verify profile content is visible
    await expect(
      page.getByPlaceholder("Enter Your Name")
    ).toBeVisible();
  });

  test("logged-in user can navigate from dashboard to orders via menu", async ({
    page,
  }) => {
    // Step 1: Login with valid credentials
    await loginAsUser(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);

    // Step 2: Navigate to dashboard
    await page.goto("/dashboard/user");

    // Step 3: Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard\/user$/);

    // Step 4: Find and click orders link in menu
    const ordersLink = page.getByRole("link", { name: /orders/i }).first();
    await ordersLink.click();

    // Step 5: Verify navigation to orders page
    await expect(page).toHaveURL(/\/dashboard\/user\/orders/);

    // Step 6: Verify orders content is visible
    await expect(page.getByText("All Orders")).toBeVisible();
  });
});
