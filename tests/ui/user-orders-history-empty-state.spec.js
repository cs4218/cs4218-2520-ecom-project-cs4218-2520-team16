// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

test("newly registered user sees the empty orders state", async ({ page }) => {
  const username = "newuser" + Math.random() + "_empty_order_list_test";
  const email = username + "@new.new";
  await page.goto("/register")
  await page.getByPlaceholder("Enter Your Name").fill(username);
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill("new");
  await page.getByPlaceholder("Enter Your Phone").fill("00000000");
  await page.getByPlaceholder("Enter Your Address").fill("NUS");
  await page.locator("input[type='date']").fill("2026-03-23");
  await page.getByPlaceholder("What is Your Favorite sports").fill("walking");
  await page.getByRole("button", { name: "REGISTER" }).click();
  await expect(page).toHaveURL("/login");

  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill("new");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page).not.toHaveURL("/login");

  await page.goto("/dashboard/user/orders");

  await expect(page).toHaveURL("/dashboard/user/orders");
  await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
  await expect(
    page.getByText("You have not placed any orders yet.")
  ).toBeVisible();
});
