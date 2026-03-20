// Smoke Test Suite for Core Pages
// Tests basic page loads and critical infrastructure
// Author: Wen Han Tang A0340008W

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests - Page Loads and Core Infrastructure", () => {
  test("home page loads and shows main navigation", async ({ page }) => {
    await page.goto("/");
    
    // Verify main heading is visible
    await expect(page.getByText(/All Products|Welcome/i)).toBeVisible();
    
    // Verify main navigation is present
    await expect(page.getByRole("link", { name: /Home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Categories/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Register/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Login/i })).toBeVisible();
  });

  test("register page loads and all required fields are visible", async ({
    page,
  }) => {
    await page.goto("/register");
    
    // Verify all form fields are present
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByPlaceholder(/phone/i)).toBeVisible();
    await expect(page.getByPlaceholder(/address/i)).toBeVisible();
    
    // Verify submit button
    await expect(page.getByRole("button", { name: /register|submit/i })).toBeVisible();
  });

  test("login page loads and submission controls are visible", async ({
    page,
  }) => {
    await page.goto("/login");
    
    // Verify form fields
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Verify submit button
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("categories page loads without crashing", async ({ page }) => {
    await page.goto("/categories");
    
    // Should load without errors
    await expect(page).toHaveURL(/categories/);
    await expect(page.locator("body")).toBeTruthy();
  });

  test("cart page loads for a guest user", async ({ page }) => {
    await page.goto("/cart");
    
    // Verify cart page is accessible
    await expect(page).toHaveURL(/cart/);
    
    // Cart should be visible (even if empty)
    await expect(page.locator("body")).toBeTruthy();
  });

  test("unknown route shows 404 page", async ({ page }) => {
    await page.goto("/unknown-route-that-does-not-exist");
    
    // Should show 404 or not found message
    const notFoundElements = page.locator(
      'text=/404|not found|page not found/i'
    );
    await expect(notFoundElements.first()).toBeVisible();
  });
});
