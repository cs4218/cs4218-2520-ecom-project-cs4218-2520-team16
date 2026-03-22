// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

const RESET_PASSWORD = process.env.PW_USER_PASSWORD;

test.describe("Forgot Password Journey", () => {
  test("user can go from login to forgot password, reset password, and log in with the new password", async ({
    page,
  }) => {
    test.skip(!process.env.PW_USER_EMAIL || !process.env.PW_USER_PASSWORD, "process.env.PW_USER_EMAIL or process.env.PW_USER_PASSWORD is invalid")

    await page.goto("/login")
    await expect(page.getByText("LOGIN FORM")).toBeVisible();
    await page.getByRole("button", { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { name: "RESET PASSWORD" })
    ).toBeVisible();

    await page.getByPlaceholder("Enter Your Email").fill(process.env.PW_USER_EMAIL);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(process.env.PW_USER_ANSWER);
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill(RESET_PASSWORD);
    await page
      .getByRole("button", { name: /reset password/i })
      .click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Password Reset Successfully")).toBeVisible();

    await page.getByPlaceholder(/enter your email/i).fill(process.env.PW_USER_EMAIL);
    await page
      .getByPlaceholder(/enter your password/i)
      .fill(RESET_PASSWORD);
    await page.getByRole("button", { name: /^login$/i }).click();

    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10000 });
  });
});
