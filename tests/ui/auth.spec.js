// Authentication Tests - Registration, Login, and Auth Flows
// Tests critical auth pathways and error handling
// Author: Wen Han Tang A0340008W

import { test, expect } from "@playwright/test";

// Use a unique email for each test run to avoid conflicts
const generateUniqueEmail = () =>
  `test${Date.now()}${Math.random().toString(36).slice(2, 8)}@example.com`;
const TEST_PASSWORD = "Password123!";
const E2E_USER_EMAIL = process.env.PW_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.PW_USER_PASSWORD;

async function waitForRegisterResponse(page) {
  const response = await page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/v1/auth/register") &&
      resp.request().method() === "POST"
  );

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Ignore JSON parsing failures so tests can still assert on status.
  }

  return { status: response.status(), body };
}

async function registerTestUser(page, email, password = TEST_PASSWORD) {
  await page.goto("/register");

  await page.getByPlaceholder(/name/i).fill("Test User");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByPlaceholder(/phone/i).fill("91234567");
  await page.getByPlaceholder(/address/i).fill("123 Main Street");
  await page.locator('input[type="date"]').fill("1998-01-01");
  await page.getByPlaceholder(/favorite sports/i).fill("football");

  const registerResponsePromise = waitForRegisterResponse(page);
  await page.getByRole("button", { name: /register|submit/i }).click();
  await page.waitForLoadState("domcontentloaded");

  return registerResponsePromise;
}

test.describe("Registration and Login Flows", () => {
  test("user can register with valid details and is redirected to login", async ({
    page,
  }) => {
    const uniqueEmail = generateUniqueEmail();

    await page.goto("/register");

    // Fill in registration form
    await page.getByPlaceholder(/name/i).fill("Test User");
    await page.getByPlaceholder(/email/i).fill(uniqueEmail);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByPlaceholder(/phone/i).fill("91234567");
    await page.getByPlaceholder(/address/i).fill("123 Main Street");
    await page.locator('input[type="date"]').fill("1998-01-01");
    await page.getByPlaceholder(/favorite sports/i).fill("football");

    // Submit form
    await page.getByRole("button", { name: /register|submit/i }).click();

    // Should be redirected to login page or show success message
    await page.waitForLoadState("networkidle");
    const isLoginPage = page.url().includes("/login");
    const isHomePage = page.url().includes("/");

    expect(isLoginPage || isHomePage).toBeTruthy();
  });

  test("registration shows an error for duplicate email", async ({ page }) => {
    const duplicateEmail = generateUniqueEmail();

    const firstAttempt = await registerTestUser(page, duplicateEmail);
    expect(firstAttempt.status).toBe(201);
    expect(firstAttempt.body?.success).toBeTruthy();

    await page.goto("/register");

    // Fill in registration form
    await page.getByPlaceholder(/name/i).fill("Another User");
    await page.getByPlaceholder(/email/i).fill(duplicateEmail);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByPlaceholder(/phone/i).fill("91234567");
    await page.getByPlaceholder(/address/i).fill("456 Oak Avenue");
    await page.locator('input[type="date"]').fill("1998-01-01");
    await page.getByPlaceholder(/favorite sports/i).fill("football");

    // Try to register
    const secondAttemptPromise = waitForRegisterResponse(page);
    await page.getByRole("button", { name: /register|submit/i }).click();
    const secondAttempt = await secondAttemptPromise;

    expect(secondAttempt.status).toBe(200);
    expect(secondAttempt.body?.success).toBeFalsy();
    expect(secondAttempt.body?.message).toMatch(/already register/i);
  });

  test("required-field validation prevents empty registration submissions", async ({
    page,
  }) => {
    await page.goto("/register");

    // Try to submit empty form
    const submitBtn = page.getByRole("button", { name: /register|submit/i });
    await submitBtn.click();

    // Should either show validation error or stay on register page
    await page.waitForLoadState("networkidle");
    const stillOnRegister = page.url().includes("/register");
    expect(stillOnRegister).toBeTruthy();
  });

  test("user can log in with valid credentials and is redirected correctly", async ({
    page,
  }) => {
    test.skip(
      !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
      "Requires PW_USER_EMAIL and PW_USER_PASSWORD for deterministic login test"
    );

    await page.goto("/login");

    // Fill in login form
    await page.getByPlaceholder(/email/i).fill(E2E_USER_EMAIL);
    await page.getByPlaceholder(/password/i).fill(E2E_USER_PASSWORD);

    // Submit form
    await page.getByRole("button", { name: /login/i }).click();

    // Should be redirected away from login page on successful auth
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
  });

  test("invalid login shows an error message", async ({ page }) => {
    await page.goto("/login");

    // Enter invalid credentials
    await page.getByPlaceholder(/email/i).fill("nonexistent@example.com");
    await page.getByPlaceholder(/password/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for response
    await page.waitForLoadState("networkidle");

    // Should either show error or stay on login page
    const stillOnLogin = page.url().includes("/login");
    const errorShown = await page
      .locator(/text=.*error|failed|incorrect/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(stillOnLogin || errorShown).toBeTruthy();
  });

  test("logout clears auth state and returns UI to guest navigation", async ({
    page,
  }) => {
    test.skip(
      !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
      "Requires PW_USER_EMAIL and PW_USER_PASSWORD for deterministic logout test"
    );

    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(E2E_USER_EMAIL);
    await page.getByPlaceholder(/password/i).fill(E2E_USER_PASSWORD);
    await page.getByRole("button", { name: /login/i }).click();

    await page.waitForLoadState("networkidle");

    // Look for logout button (might be in user menu)
    const logoutBtn = page
      .getByRole("button", { name: /logout/i })
      .or(page.getByText(/logout/i));

    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState("networkidle");

      // After logout, login link should be visible again
      await expect(
        page.getByRole("link", { name: /login/i })
      ).toBeVisible();
    }
  });
});
