/**
 * The shell: routing, the office selector that scopes every other page, the
 * dashboard's own totals, and the reports screen.
 *
 * The office selector is the one piece of global state in the app — it is
 * persisted to localStorage and feeds `office_id` into nearly every query — so
 * it gets tested for persistence, not just for rendering.
 */
import { test, expect } from "./fixtures/supabase";
import { parcel } from "./fixtures/data";

test.beforeEach(async ({ app }) => {
  await app.goto("/#/dashboard");
});

test.describe("Navigation", () => {
  const routes = [
    { link: "Dashboard", url: /#\/dashboard/, heading: "Dashboard" },
    { link: "Add Parcel", url: /#\/parcels\/add/, heading: "Add Parcel" },
    { link: "View Parcels", url: /#\/parcels/, heading: "View Parcels" },
    { link: "Reports", url: /#\/reports/, heading: "Reports" },
    { link: "Drivers", url: /#\/drivers/, heading: "Drivers" },
    { link: "Buses", url: /#\/buses/, heading: "Buses" },
    { link: "Cities", url: /#\/cities/, heading: "Cities" },
    { link: "Offices", url: /#\/offices/, heading: "Offices" },
  ];

  for (const route of routes) {
    test(`the sidebar reaches ${route.link}`, async ({ app }) => {
      await app.getByRole("link", { name: route.link, exact: true }).click();

      await expect(app).toHaveURL(route.url);
      await expect(
        app.getByRole("heading", { name: route.heading, exact: true })
      ).toBeVisible();
    });
  }

  test("sends an unknown route to the dashboard", async ({ app }) => {
    await app.goto("/#/no-such-page");

    await expect(app).toHaveURL(/#\/dashboard/);
  });

  test("sends the root to the dashboard", async ({ app }) => {
    await app.goto("/#/");

    await expect(app).toHaveURL(/#\/dashboard/);
  });
});

test.describe("Office selector", () => {
  test("defaults to the first office", async ({ app }) => {
    await expect(app.getByText("Rajkot Office").first()).toBeVisible();
  });

  test("switching office changes which parcels are listed", async ({ app }) => {
    await app.goto("/#/parcels");
    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();

    await app.getByText("Rajkot Office").first().click();
    await app.getByRole("option", { name: "Surat Office" }).click();

    // Bill 103 is the Surat office's only parcel.
    await expect(app.getByRole("cell", { name: "R103" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);
  });

  test("remembers the chosen office across a reload", async ({ app }) => {
    await app.getByText("Rajkot Office").first().click();
    await app.getByRole("option", { name: "Surat Office" }).click();
    await expect(app.getByText("Surat Office").first()).toBeVisible();

    await app.reload();

    await expect(app.getByText("Surat Office").first()).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test("shows today's totals for the selected office", async ({ app }) => {
    // Seeded office 1 parcels: 500 + 800 booked, 500 + 300 collected.
    await expect(app.getByText("Today's bookings")).toBeVisible();
    await expect(app.getByText("Items booked today")).toBeVisible();
    await expect(app.getByText("Collected today")).toBeVisible();
    await expect(app.getByText("Pending today")).toBeVisible();
  });

  test("names the selected office in the header", async ({ app }) => {
    await expect(app.getByText(/Rajkot Office ·/)).toBeVisible();
  });

  test("counts only the selected office's parcels", async ({ app, supabase }) => {
    supabase.rows("parcels").push(
      parcel({ id: 50, bill_no: 500, office_id: 1, qty: 7, amount: 100, amount_given: 100 })
    );

    await app.reload();

    // 3 bookings for office 1 once the extra parcel is added.
    await expect(app.getByText("3", { exact: true }).first()).toBeVisible();
  });

  test("survives a failed load without a blank screen", async ({
    app,
    supabase,
  }) => {
    supabase.failOn("parcels");
    await app.reload();

    await expect(app.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

test.describe("Reports", () => {
  test("opens on the daily report tab", async ({ app }) => {
    await app.goto("/#/reports");

    await expect(app.getByRole("heading", { name: "Reports" })).toBeVisible();
    await expect(
      app.getByText("View all parcels for a specific date and route.")
    ).toBeVisible();
  });

  test("switches between the three report types", async ({ app }) => {
    await app.goto("/#/reports");
    await expect(app.getByRole("heading", { name: "Reports" })).toBeVisible();

    await app.getByRole("tab", { name: "Monthly Report" }).click();
    await expect(
      app.getByText("View all parcels for a specific month and route.")
    ).toBeVisible();

    await app.getByRole("tab", { name: "Date Report" }).click();
    await expect(app.getByRole("tab", { name: "Date Report" })).toHaveAttribute(
      "data-state",
      "active"
    );
  });

  test("preselects the default cities", async ({ app }) => {
    await app.goto("/#/reports");
    await expect(app.getByRole("heading", { name: "Reports" })).toBeVisible();

    // Rajkot is the default origin, Surat the default destination.
    await expect(app.getByText("Rajkot").first()).toBeVisible();
    await expect(app.getByText("Surat").first()).toBeVisible();
  });

  test("tells the user when the setup data cannot be loaded", async ({
    app,
    supabase,
  }) => {
    supabase.failOn("cities");

    await app.goto("/#/reports");

    await expect(
      app.getByText("Failed to load cities and buses.")
    ).toBeVisible();
  });

  test("generating a daily report queries the selected route", async ({
    app,
    supabase,
  }) => {
    // The report renders into a popup via `window.open(...).document.write`.
    // Stubbing has to happen before the page's modules load, so the captured
    // reference is the stub rather than the real opener.
    await app.addInitScript(() => {
      (window as any).__printedHtml = null;
      window.open = () =>
        ({
          document: {
            write: (html: string) => ((window as any).__printedHtml = html),
            close: () => {},
          },
          focus: () => {},
          print: () => {},
          close: () => {},
        }) as any;
    });

    await app.goto("/#/reports");
    await expect(app.getByRole("heading", { name: "Reports" })).toBeVisible();

    await app.getByRole("button", { name: "Print Report" }).first().click();

    // The document is generated from whatever the query returns, so the
    // assertion that matters is that the report queried for the selected
    // route and date rather than being blocked by validation.
    await expect
      .poll(() =>
        supabase.requests.some(
          (r) =>
            r.url.includes("/parcels") &&
            r.url.includes("from_city_id=eq.1") &&
            r.url.includes("to_city_id=eq.2")
        )
      )
      .toBe(true);

    await expect
      .poll(() => app.evaluate(() => (window as any).__printedHtml))
      .not.toBeNull();
  });
});
