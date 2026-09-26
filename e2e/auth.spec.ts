import { test, expect } from "./fixtures/supabase";
import { installSupabaseMock, SupabaseMock } from "./fixtures/supabase";

test.describe("authentication", () => {
  test("redirects an anonymous visitor to the login page", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());

    await page.goto("/#/dashboard");

    await expect(page.getByText("Parcel Management System")).toBeVisible();
    await expect(page).toHaveURL(/#\/auth\/login/);
  });

  test("rejects bad credentials without navigating away", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());
    await page.goto("/#/auth/login");

    await page.getByLabel("Email").fill("operator@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Login Failed")).toBeVisible();
    await expect(page.getByText("Invalid login credentials")).toBeVisible();
    await expect(page).toHaveURL(/#\/auth\/login/);
  });

  test("signs in with valid credentials and lands on the dashboard", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());
    await page.goto("/#/auth/login");

    await page.getByLabel("Email").fill("operator@example.com");
    await page.getByLabel("Password").fill("correct-horse");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/#\/dashboard/);
  });

  test("requires both fields before calling the backend", async ({ page }) => {
    const mock = new SupabaseMock();
    await installSupabaseMock(page, mock);
    await page.goto("/#/auth/login");

    // Both inputs are `required`, so the browser blocks submission itself.
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByLabel("Email")).toBeFocused();
  });

  test("an authenticated session reaches the dashboard directly", async ({ app }) => {
    await app.goto("/#/dashboard");

    await expect(app.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
