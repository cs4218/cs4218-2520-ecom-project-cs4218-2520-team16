// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

const PASSWORD = "Password123!";

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerUser(page, { email }) {
  await page.goto("/register");
  await page.getByPlaceholder(/name/i).fill("Orders User");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(PASSWORD);
  await page.getByPlaceholder(/phone/i).fill("91234567");
  await page.getByPlaceholder(/address/i).fill("123 Testing Lane");
  await page.locator('input[type="date"]').fill("1998-01-01");
  await page.getByPlaceholder(/favorite sports/i).fill("football");
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page).toHaveURL(/\/login$/);
}

async function loginUser(page, { email }) {
  await page.getByPlaceholder(/enter your email/i).fill(email);
  await page.getByPlaceholder(/enter your password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
}

test("newly registered user sees the empty orders state", async ({ page }) => {
  const email = uniqueEmail("orders-empty");

  await registerUser(page, { email });
  await loginUser(page, { email });

  await page.goto("/dashboard/user/orders");

  await expect(page).toHaveURL(/\/dashboard\/user\/orders$/);
  await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
  await expect(
    page.getByText("You have not placed any orders yet.")
  ).toBeVisible();
});
