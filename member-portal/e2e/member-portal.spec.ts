import { expect, test } from "@playwright/test";

/**
 * Authenticated member portal tests.
 *
 * These tests require PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD
 * environment variables pointing to an existing test account. In CI, create
 * a dedicated test user in your Supabase project and set the env vars.
 *
 * If the env vars are missing, the suite is skipped gracefully.
 */

const email = process.env.PLAYWRIGHT_TEST_EMAIL;
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe("member portal (authenticated)", () => {
  test.skip(!email || !password, "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run");

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/member\/dashboard/);
  });

  test("dashboard loads with heading and cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
    await expect(page.getByText(/prayer requests/i)).toBeVisible();
    await expect(page.getByText(/giving notes/i)).toBeVisible();
  });

  test("profile page loads and shows form", async ({ page }) => {
    await page.goto("/member/profile");
    await expect(
      page.getByRole("heading", { name: /profile/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByLabel("Preferred Bible version")).toBeVisible();
  });

  test("prayer page loads with form", async ({ page }) => {
    await page.goto("/member/prayer");
    await expect(
      page.getByRole("heading", { name: /prayer request/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Request")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit request/i }),
    ).toBeVisible();
  });

  test("bulletin page loads", async ({ page }) => {
    await page.goto("/member/bulletin");
    await expect(
      page.getByRole("heading", { name: /bulletin board/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /new post/i }),
    ).toBeVisible();
  });

  test("forum page loads", async ({ page }) => {
    await page.goto("/member/forum");
    await expect(
      page.getByRole("heading", { name: /sermon forum/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /new topic/i }),
    ).toBeVisible();
  });

  test("bible page loads", async ({ page }) => {
    await page.goto("/member/bible");
    await expect(
      page.getByRole("heading", { name: /bible/i }),
    ).toBeVisible();
  });

  test("groups page loads", async ({ page }) => {
    await page.goto("/member/groups");
    await expect(
      page.getByRole("heading", { name: /groups/i }),
    ).toBeVisible();
  });

  test("study assistant page loads", async ({ page }) => {
    await page.goto("/member/study");
    await expect(
      page.getByRole("heading", { name: /study assistant/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /new session/i }),
    ).toBeVisible();
  });

  test("giving page loads with Tithe.ly link", async ({ page }) => {
    await page.goto("/member/giving");
    await expect(
      page.getByRole("heading", { name: /giving/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /open tithe.ly/i }),
    ).toBeVisible();
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /profile/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /prayer/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /giving/i })).toBeVisible();
  });

  test("sign out redirects to login", async ({ page }) => {
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/\/auth\/login/);
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
  });
});
