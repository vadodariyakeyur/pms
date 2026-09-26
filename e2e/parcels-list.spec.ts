/**
 * ListParcels drives `findPage`, which is where the pagination/ordering bug
 * lived: the filter block was written out twice and the two copies drifted.
 * These tests exercise it through the UI, so a re-drift fails here even if the
 * unit tests for the filter still pass.
 */
import { test, expect } from "./fixtures/supabase";
import { parcel } from "./fixtures/data";

test.beforeEach(async ({ app }) => {
  await app.goto("/#/dashboard");
});

test.describe("View Parcels", () => {
  test("lists this office's parcels and hides other offices'", async ({ app }) => {
    await app.goto("/#/parcels");

    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R102" })).toBeVisible();
    // Bill 103 belongs to the Surat office.
    await expect(app.getByRole("cell", { name: "R103" })).toHaveCount(0);
  });

  test("shows sender, receiver and route for each parcel", async ({ app }) => {
    await app.goto("/#/parcels");

    const row = app.getByRole("row").filter({ hasText: "R101" });
    await expect(row.getByText("Anil Mehta")).toBeVisible();
    await expect(row.getByText("Bhavna Joshi")).toBeVisible();
    await expect(row.getByText("Rajkot")).toBeVisible();
    await expect(row.getByText("Surat")).toBeVisible();
  });

  test("marks a partly-paid parcel as unpaid and a settled one as paid", async ({
    app,
  }) => {
    await app.goto("/#/parcels");

    const paid = app.getByRole("row").filter({ hasText: "R101" });
    const unpaid = app.getByRole("row").filter({ hasText: "R102" });

    await expect(paid.locator(".text-green-400")).toBeVisible();
    await expect(unpaid.locator(".text-destructive")).toBeVisible();
  });

  test("searches by sender name", async ({ app }) => {
    await app.goto("/#/parcels");
    await expect(app.getByRole("cell", { name: "R102" })).toBeVisible();

    await app
      .getByPlaceholder("Search by sender/receiver name or phone...")
      .fill("Chirag");

    await expect(app.getByRole("cell", { name: "R102" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);
  });

  test("searches by receiver mobile number", async ({ app }) => {
    await app.goto("/#/parcels");
    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();

    await app
      .getByPlaceholder("Search by sender/receiver name or phone...")
      .fill("9000000002");

    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R102" })).toHaveCount(0);
  });

  test("finds a parcel by bill number", async ({ app }) => {
    await app.goto("/#/parcels");

    await app.getByPlaceholder("Bill No.").fill("102");

    await expect(app.getByRole("cell", { name: "R102" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);
  });

  test("accepts the R-prefixed bill number customers paste back", async ({ app }) => {
    await app.goto("/#/parcels");

    // The WhatsApp receipt emits `R-102`; parseBillNo has to strip it.
    await app.getByPlaceholder("Bill No.").fill("R-102");

    await expect(app.getByRole("cell", { name: "R102" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);
  });

  test("a bill-number lookup ignores the date filter", async ({ app, supabase }) => {
    // Dated well outside the default from/to range, which is today..today.
    supabase.rows("parcels").push(
      parcel({ id: 9, bill_no: 900, parcel_date: "2020-01-15", office_id: 1 })
    );

    await app.goto("/#/parcels");
    await app.getByPlaceholder("Bill No.").fill("900");

    await expect(app.getByRole("cell", { name: "R900" })).toBeVisible();
  });

  test("shows an empty state when nothing matches", async ({ app }) => {
    await app.goto("/#/parcels");

    await app
      .getByPlaceholder("Search by sender/receiver name or phone...")
      .fill("nobody-by-that-name");

    await expect(
      app.getByText("No parcels found matching your criteria.")
    ).toBeVisible();
  });

  test("resets every filter", async ({ app }) => {
    await app.goto("/#/parcels");

    const search = app.getByPlaceholder("Search by sender/receiver name or phone...");
    await search.fill("Chirag");
    await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);

    await app.getByRole("button", { name: "Reset" }).click();

    await expect(search).toHaveValue("");
    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();
  });

  test("filters by destination city", async ({ app }) => {
    await app.goto("/#/parcels");
    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();

    await app.getByRole("button", { name: "Show Filters" }).click();
    // These Labels carry no `htmlFor` and the Radix trigger has no id, so the
    // only stable handle is the trigger inside the labelled block.
    await app
      .locator("div", { has: app.getByText("To City", { exact: true }) })
      .last()
      .getByRole("combobox")
      .click();
    await app.getByRole("option", { name: "Surat", exact: true }).click();

    // R101 goes to Surat; R102 goes to Rajkot.
    await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "R102" })).toHaveCount(0);
  });

  test("orders newest bill first within a day", async ({ app }) => {
    await app.goto("/#/parcels");
    await expect(app.getByRole("cell", { name: "R102" })).toBeVisible();

    // First cell of every data row, in render order.
    const bills = await app
      .getByRole("row")
      .filter({ hasText: /R\d+/ })
      .locator("td:first-child")
      .allInnerTexts();

    expect(bills).toEqual(["R102", "R101"]);
  });

  test.describe("pagination", () => {
    test("pages through more parcels than fit on one page", async ({
      app,
      supabase,
    }) => {
      // 10 rows per page; 12 total gives exactly two pages.
      for (let i = 0; i < 10; i++) {
        supabase.rows("parcels").push(
          parcel({ id: 100 + i, bill_no: 200 + i, office_id: 1 })
        );
      }

      await app.goto("/#/parcels");
      await expect(app.getByText("Page 1 of 2")).toBeVisible();

      // Highest bill number sorts first.
      await expect(app.getByRole("cell", { name: "R209" })).toBeVisible();
      await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);

      await app.getByRole("button", { name: "Next Page" }).click();

      await expect(app.getByText("Page 2 of 2")).toBeVisible();
      await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();
    });

    test("hides the pager when everything fits on one page", async ({ app }) => {
      await app.goto("/#/parcels");
      await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();

      await expect(app.getByText(/Page \d+ of \d+/)).toHaveCount(0);
    });
  });

  test.describe("deleting", () => {
    test("removes a parcel after confirmation", async ({ app, supabase }) => {
      await app.goto("/#/parcels");
      await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();

      const row = app.getByRole("row").filter({ hasText: "R101" });
      await row.getByRole("button", { name: "Open menu" }).click();
      await app.getByRole("menuitem", { name: "Delete" }).click();
      await app.getByRole("button", { name: "Delete", exact: true }).click();

      await expect(app.getByRole("cell", { name: "R101" })).toHaveCount(0);
      await expect
        .poll(() => supabase.rows("parcels").some((p) => p.bill_no === 101))
        .toBe(false);
    });

    test("keeps the parcel and says so when the delete fails", async ({
      app,
      supabase,
    }) => {
      await app.goto("/#/parcels");
      await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();

      supabase.failOn("parcels");

      const row = app.getByRole("row").filter({ hasText: "R101" });
      await row.getByRole("button", { name: "Open menu" }).click();
      await app.getByRole("menuitem", { name: "Delete" }).click();
      await app.getByRole("button", { name: "Delete", exact: true }).click();

      // This used to fail silently: the dialog stayed open with no explanation,
      // so a failed delete looked identical to an unresponsive button.
      await expect(
        app.getByText("Could not delete the parcel. Please try again.")
      ).toBeVisible();
      expect(supabase.rows("parcels").some((p) => p.bill_no === 101)).toBe(true);
    });

    test("cancelling leaves the parcel alone", async ({ app, supabase }) => {
      await app.goto("/#/parcels");

      const row = app.getByRole("row").filter({ hasText: "R101" });
      await row.getByRole("button", { name: "Open menu" }).click();
      await app.getByRole("menuitem", { name: "Delete" }).click();
      await app.getByRole("button", { name: "Cancel" }).click();

      await expect(app.getByRole("cell", { name: "R101" })).toBeVisible();
      expect(supabase.rows("parcels").some((p) => p.bill_no === 101)).toBe(true);
    });
  });

  test("tells the user when the list cannot be loaded", async ({ app, supabase }) => {
    supabase.failOn("parcels");

    await app.goto("/#/parcels");

    await expect(
      app.getByText("Could not load parcels. Please try again.")
    ).toBeVisible();
  });

  test("navigates to the add-parcel form", async ({ app }) => {
    await app.goto("/#/parcels");

    await app.getByRole("button", { name: "Add New Parcel" }).click();

    await expect(app).toHaveURL(/#\/parcels\/add/);
    await expect(app.getByRole("heading", { name: "Add Parcel" })).toBeVisible();
  });

  test("opens a parcel for editing from the row menu", async ({ app }) => {
    await app.goto("/#/parcels");

    const row = app.getByRole("row").filter({ hasText: "R101" });
    await row.getByRole("button", { name: "Open menu" }).click();
    await app.getByRole("menuitem", { name: "Edit" }).click();

    await expect(app).toHaveURL(/#\/parcel\/1\/edit/);
  });

  test("opens the print view from the row menu", async ({ app }) => {
    await app.goto("/#/parcels");

    const row = app.getByRole("row").filter({ hasText: "R101" });
    await row.getByRole("button", { name: "Open menu" }).click();
    await app.getByRole("menuitem", { name: "Print" }).click();

    await expect(app).toHaveURL(/#\/parcel\/1\/print/);
  });
});
