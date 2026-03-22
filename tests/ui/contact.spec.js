// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import { test, expect } from "@playwright/test";

test.describe("Contact Page", () => {
  test("loads without error and keeps the placeholder contact details", async ({
    page,
  }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/contact");

    await expect(
      page.getByRole("heading", { name: "CONTACT US" })
    ).toBeVisible();
    await expect(
      page.getByText(
        /For any query or info about product, feel free to call anytime\./i
      )
    ).toBeVisible();
    await expect(
      page.getByText("www.help@ecommerceapp.com")
    ).toBeVisible();
    await expect(page.getByText("012-3456789")).toBeVisible();
    await expect(
      page.getByText("1800-0000-0000 (toll free)")
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
