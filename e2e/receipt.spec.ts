/**
 * Two receipt views with very different trust levels:
 *
 * - `/parcel/:id/print` is behind auth and reads the parcel directly.
 * - `/reciept/:token` is public, opened from a WhatsApp link by a customer,
 *   and goes through an RPC. Its token is base64 only to keep the bill number
 *   non-obvious in a shared link — the route must not treat that as security,
 *   and a malformed token must not crash the page.
 */
import { test, expect } from "./fixtures/supabase";
import { installSupabaseMock, SupabaseMock } from "./fixtures/supabase";

test.describe("Print receipt (authenticated)", () => {
  test.beforeEach(async ({ app }) => {
    await app.goto("/#/dashboard");
  });

  test("renders the parcel's receipt", async ({ app }) => {
    await app.goto("/#/parcel/1/print");

    await expect(app.getByText("R101").first()).toBeVisible();
    await expect(app.getByText("Anil Mehta").first()).toBeVisible();
    await expect(app.getByText("Bhavna Joshi").first()).toBeVisible();
  });

  test("shows the parcel's route and bus", async ({ app }) => {
    await app.goto("/#/parcel/1/print");

    await expect(app.getByText("R101").first()).toBeVisible();
    await expect(app.getByText("GJ-03-AB-1234").first()).toBeVisible();
  });

  test("shows the money split", async ({ app }) => {
    await app.goto("/#/parcel/2/print");

    await expect(app.getByText("R102").first()).toBeVisible();
    // 800 total, 300 paid, 500 outstanding.
    await expect(app.getByText("500").first()).toBeVisible();
  });

  test("prints the office's own contact number", async ({ app }) => {
    await app.goto("/#/parcel/1/print");

    // Parcel 101 belongs to the Rajkot office, which has its own number.
    await expect(app.getByText("9876500001").first()).toBeVisible();
  });

  test("falls back to the default contact when the office has none", async ({
    app,
  }) => {
    // Parcel 103 belongs to the Surat office, whose mobile_no is null.
    await app.goto("/#/parcel/3/print");

    await expect(app.getByText("84019 39945 / 81550 66443").first()).toBeVisible();
  });
});

test.describe("Public receipt (customer link)", () => {
  /** The same encoding `receiptUrl` produces. */
  const token = (id: number) => Buffer.from(String(id)).toString("base64");

  test("renders a receipt from a valid link", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());

    await page.goto(`/#/reciept/${token(1)}`);

    await expect(page.getByText("R101").first()).toBeVisible();
    await expect(page.getByText("Anil Mehta").first()).toBeVisible();
  });

  test("does not require a signed-in session", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());

    await page.goto(`/#/reciept/${token(1)}`);

    // A customer opening this from WhatsApp has no session — the page must
    // render rather than bouncing to the login screen.
    await expect(page.getByText("R101").first()).toBeVisible();
    await expect(page).not.toHaveURL(/auth\/login/);
  });

  test("rejects a hand-edited link without crashing", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());

    await page.goto("/#/reciept/not-valid-base64!!");

    // `atob` throws on malformed base64. The page must land on the "not found"
    // state rather than crashing or hanging on the loading spinner.
    await expect(page.getByText("Receipt not found.")).toBeVisible();
    await expect(page.getByText("Loading Receipt...")).toHaveCount(0);
  });

  test("reports a token that decodes to a non-numeric bill", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());

    await page.goto(`/#/reciept/${Buffer.from("abc").toString("base64")}`);

    await expect(page.getByText("Receipt not found.")).toBeVisible();
    await expect(page.getByText("Loading Receipt...")).toHaveCount(0);
  });

  test("reports a receipt that does not exist", async ({ page }) => {
    await installSupabaseMock(page, new SupabaseMock());

    await page.goto(`/#/reciept/${token(99999)}`);

    await expect(
      page.getByText("Receipt not found or access denied.")
    ).toBeVisible();
  });

  test("stays open when the lookup fails", async ({ page }) => {
    const mock = new SupabaseMock();
    mock.failOn("rpc:get_parcel_details_by_id");
    await installSupabaseMock(page, mock);

    await page.goto(`/#/reciept/${token(1)}`);

    // No window.close() here: the page opens from a WhatsApp link, so closing
    // would no-op and strand the customer on a blank tab.
    await expect(page.getByText("Receipt not found.")).toBeVisible();
  });
});
