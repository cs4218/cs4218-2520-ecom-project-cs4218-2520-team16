// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

const RESET_PASSWORD = process.env.PW_USER_PASSWORD;

test.describe("Forgot Password Journey", () => {
  test("user can go from login to forgot password, reset password, and log in with the new password", async ({
    page,
  }) => {
    test.skip(!process.env.PW_USER_EMAIL || !process.env.PW_USER_PASSWORD, "process.env.PW_USER_EMAIL or process.env.PW_USER_PASSWORD is invalid");

    const username = "testuser" + Math.random();
    const email = username + "@test.test";
    await page.goto("/register")
    await page.getByPlaceholder("Enter Your Name").fill(username);
    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("originalpassword");
    await page.getByPlaceholder("Enter Your Phone").fill("00000000");
    await page.getByPlaceholder("Enter Your Address").fill("NUS");
    await page.locator("input[type='date']").fill("2026-03-23");
    await page.getByPlaceholder("What is Your Favorite sports").fill("walking");
    await page.getByRole("button", { name: "REGISTER" }).click();
    await expect(page).toHaveURL("/login");
  
    await page.goto("/login")
    await expect(page.getByText("LOGIN FORM")).toBeVisible();
    await page.getByRole("button", { name: "FORGOT PASSWORD" }).click();

    await expect(page).toHaveURL("/forgot-password");
    await expect(
      page.getByRole("heading", { name: "RESET PASSWORD" })
    ).toBeVisible();

    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill("walking");
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill("resetpassword");
    await page
      .getByRole("button", { name: "RESET PASSWORD" })
      .click();

    await expect(page).toHaveURL("/login");
    await expect(page.getByText("Password Reset Successfully")).toBeVisible();

    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill("resetpassword");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).not.toHaveURL("/login", { timeout: 10000 });
  });
});
