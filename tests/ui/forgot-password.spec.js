// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

const INITIAL_PASSWORD = "Password123!";
const RESET_PASSWORD = "NewPassword123!";

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerUser(page, { email, password, address, answer }) {
  await page.goto("/register");

  await page.getByPlaceholder(/name/i).fill("Reset User");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByPlaceholder(/phone/i).fill("91234567");
  await page.getByPlaceholder(/address/i).fill(address);
  await page.locator('input[type="date"]').fill("1998-01-01");
  await page.getByPlaceholder(/favorite sports/i).fill(answer);
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page).toHaveURL(/\/login$/);
}

test.describe("Forgot Password Journey", () => {
  test("user can go from login to forgot password, reset password, and log in with the new password", async ({
    page,
  }) => {
    const email = uniqueEmail("forgot-password");
    const answer = "football";

    await registerUser(page, {
      email,
      password: INITIAL_PASSWORD,
      address: "123 Reset Street",
      answer,
    });

    await expect(page.getByText("LOGIN FORM")).toBeVisible();
    await page.getByRole("button", { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { name: "RESET PASSWORD" })
    ).toBeVisible();

    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(answer);
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill(RESET_PASSWORD);
    await page
      .getByRole("button", { name: /reset password/i })
      .click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Password Reset Successfully")).toBeVisible();

    await page.getByPlaceholder(/enter your email/i).fill(email);
    await page
      .getByPlaceholder(/enter your password/i)
      .fill(RESET_PASSWORD);
    await page.getByRole("button", { name: /^login$/i }).click();

    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
    await expect(page.getByText(/Reset User/)).toBeVisible();
  });
});
