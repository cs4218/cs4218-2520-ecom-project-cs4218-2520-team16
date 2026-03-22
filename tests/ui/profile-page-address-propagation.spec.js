// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

test.describe("Profile Page Address Propagation", () => {
  test("updating the profile address is reflected on the cart page", async ({
    page,
  }) => {
    const username = "testuser" + Math.random() + "_profile_page_address_propagation_test";
    const email = username + "@test.test";
    await page.goto("/register")
    await page.getByPlaceholder("Enter Your Name").fill(username);
    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("testpassword");
    await page.getByPlaceholder("Enter Your Phone").fill("00000000");
    await page.getByPlaceholder("Enter Your Address").fill("OldAddress");
    await page.locator("input[type='date']").fill("2026-03-23");
    await page.getByPlaceholder("What is Your Favorite sports").fill("walking");
    await page.getByRole("button", { name: "REGISTER" }).click();
    await page.goto("/login")

    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("testpassword");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page).not.toHaveURL("/login");

    await page.goto("/");
    await expect(page.getByText("All Products")).toBeVisible();
    await page.getByRole("button", { name: "add to cart" }).first().click();

    await page.goto("/dashboard/user/profile");
    await expect(page).toHaveURL("dashboard/user/profile");

    const addressInput = page.getByPlaceholder("Enter Your Address");
    await addressInput.fill("NewAddress");
    await page.getByRole("button", { name: "UPDATE" }).click();

    await expect(
      page.getByText("Profile Updated Successfully")
    ).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");

    await expect(page.getByText("Current Address")).toBeVisible();
    await expect(page.getByText("NewAddress")).toBeVisible();
  });
});
