import { expect, test } from "@playwright/test";

test.describe("marketing + auth entry", () => {
  test("home loads with main heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /welcome to living word memphis/i }),
    ).toBeVisible();
  });

  test("primary nav routes resolve", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: /about living word memphis/i }),
    ).toBeVisible();

    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /get in touch/i })).toBeVisible();
  });

  test("auth login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("member area redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/member/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
