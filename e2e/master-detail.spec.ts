/**
 * Cities, Drivers, Buses and Offices are all one module — `MasterDetailPage` —
 * so the CRUD lifecycle is tested once, against the shared interface, and each
 * page only gets tests for what is genuinely its own (Cities' default-city
 * invariant, Offices' duplicate-name mapping).
 */
import { test, expect } from "./fixtures/supabase";

test.beforeEach(async ({ app }) => {
  await app.goto("/#/dashboard");
});

const pages = [
  {
    route: "/#/drivers",
    title: "Drivers",
    entity: "Driver",
    table: "drivers" as const,
    existing: "Ramesh Patel",
    field: "Driver Name",
    value: "Naresh Trivedi",
    column: "name",
  },
  {
    route: "/#/buses",
    title: "Buses",
    entity: "Bus",
    table: "buses" as const,
    existing: "GJ-03-AB-1234",
    field: "Registration Number",
    value: "GJ-18-XY-9999",
    column: "registration_no",
  },
  {
    route: "/#/cities",
    title: "Cities",
    entity: "City",
    table: "cities" as const,
    existing: "Rajkot",
    field: "City Name",
    value: "Ahmedabad",
    column: "name",
  },
  {
    route: "/#/offices",
    title: "Offices",
    entity: "Office",
    table: "offices" as const,
    existing: "Rajkot Office",
    field: "Office Name",
    value: "Bhavnagar Office",
    column: "name",
  },
];

for (const page of pages) {
  test.describe(page.title, () => {
    test(`lists existing ${page.table}`, async ({ app }) => {
      await app.goto(page.route);

      await expect(app.getByRole("heading", { name: page.title })).toBeVisible();
      await expect(app.getByRole("cell", { name: page.existing })).toBeVisible();
    });

    test(`creates a ${page.entity.toLowerCase()}`, async ({ app, supabase }) => {
      await app.goto(page.route);
      await expect(app.getByRole("cell", { name: page.existing })).toBeVisible();

      await app.getByRole("button", { name: `Add ${page.entity}` }).click();
      await app.getByLabel(page.field).fill(page.value);
      await app
        .getByRole("dialog")
        .getByRole("button", { name: `Add ${page.entity}` })
        .click();

      await expect(app.getByRole("cell", { name: page.value })).toBeVisible();
      await expect
        .poll(() => supabase.rows(page.table).some((r) => r[page.column] === page.value))
        .toBe(true);
    });

    test(`edits a ${page.entity.toLowerCase()}`, async ({ app, supabase }) => {
      await app.goto(page.route);

      const row = app.getByRole("row").filter({ hasText: page.existing });
      await row.getByRole("button").first().click();

      await app.getByLabel(page.field).fill(page.value);
      await app
        .getByRole("dialog")
        .getByRole("button", { name: `Update ${page.entity}` })
        .click();

      await expect(app.getByRole("cell", { name: page.value })).toBeVisible();
      await expect(app.getByRole("cell", { name: page.existing })).toHaveCount(0);
      await expect
        .poll(() => supabase.rows(page.table).some((r) => r[page.column] === page.existing))
        .toBe(false);
    });

    test(`deletes a ${page.entity.toLowerCase()}`, async ({ app, supabase }) => {
      await app.goto(page.route);

      const before = supabase.rows(page.table).length;
      const row = app.getByRole("row").filter({ hasText: page.existing });
      await row.getByRole("button").nth(1).click();

      await app
        .getByRole("dialog")
        .getByRole("button", { name: `Delete ${page.entity}` })
        .click();

      await expect(app.getByRole("cell", { name: page.existing })).toHaveCount(0);
      // The row leaves the table optimistically, so poll the backing store
      // rather than reading it the instant the UI updates.
      await expect
        .poll(() => supabase.rows(page.table).length)
        .toBe(before - 1);
    });

    test(`filters ${page.table} by the search box`, async ({ app }) => {
      await app.goto(page.route);
      await expect(app.getByRole("cell", { name: page.existing })).toBeVisible();

      await app
        .getByPlaceholder(`Search ${page.table}...`)
        .fill("zzz-no-such-record");

      await expect(app.getByRole("cell", { name: page.existing })).toHaveCount(0);
      await expect(
        app.getByText(`No ${page.table} match your search.`)
      ).toBeVisible();
    });

    test(`will not save an empty ${page.entity.toLowerCase()}`, async ({ app }) => {
      await app.goto(page.route);

      await app.getByRole("button", { name: `Add ${page.entity}` }).click();
      const confirm = app
        .getByRole("dialog")
        .getByRole("button", { name: `Add ${page.entity}` });

      await expect(confirm).toBeDisabled();

      // Whitespace is not a name.
      await app.getByLabel(page.field).fill("   ");
      await expect(confirm).toBeDisabled();
    });

    test(`surfaces a backend failure when creating a ${page.entity.toLowerCase()}`, async ({
      app,
      supabase,
    }) => {
      await app.goto(page.route);
      await expect(app.getByRole("cell", { name: page.existing })).toBeVisible();

      supabase.failOn(page.table);

      await app.getByRole("button", { name: `Add ${page.entity}` }).click();
      await app.getByLabel(page.field).fill(page.value);
      await app
        .getByRole("dialog")
        .getByRole("button", { name: `Add ${page.entity}` })
        .click();

      // The dialog must not close on failure — a closed dialog reads as success.
      await expect(app.getByRole("dialog")).toBeVisible();
    });
  });
}

test.describe("Cities — default origin/destination invariant", () => {
  test("shows which city is the current default", async ({ app }) => {
    await app.goto("/#/cities");

    const rajkot = app.getByRole("row").filter({ hasText: "Rajkot" });
    const surat = app.getByRole("row").filter({ hasText: "Surat" });

    await expect(rajkot.getByText("Default")).toHaveCount(1);
    await expect(surat.getByText("Default")).toHaveCount(1);
  });

  test("moving the default FROM city clears it on the previous holder", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/cities");

    const baroda = app.getByRole("row").filter({ hasText: "Baroda" });
    await baroda.getByRole("button").first().click();

    await app.getByLabel("Set as Default FROM City").click();
    await app.getByRole("button", { name: "Update City" }).click();

    await expect(app.getByRole("dialog")).toHaveCount(0);

    const cities = supabase.rows("cities");
    expect(cities.find((c) => c.name === "Baroda")?.is_default_from).toBe(true);
    // The invariant: at most one default origin.
    expect(cities.filter((c) => c.is_default_from)).toHaveLength(1);
  });

  test("moving the default TO city clears it on the previous holder", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/cities");

    const baroda = app.getByRole("row").filter({ hasText: "Baroda" });
    await baroda.getByRole("button").first().click();

    await app.getByLabel("Set as Default TO City").click();
    await app.getByRole("button", { name: "Update City" }).click();

    await expect(app.getByRole("dialog")).toHaveCount(0);

    const cities = supabase.rows("cities");
    expect(cities.find((c) => c.name === "Baroda")?.is_default_to).toBe(true);
    expect(cities.filter((c) => c.is_default_to)).toHaveLength(1);
  });
});

test.describe("Offices", () => {
  test("shows a readable message when the name is already taken", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/offices");
    await expect(app.getByRole("cell", { name: "Rajkot Office" })).toBeVisible();

    supabase.failWithDuplicate("offices");

    await app.getByRole("button", { name: "Add Office" }).click();
    await app.getByLabel("Office Name").fill("Rajkot Office");
    await app
      .getByRole("dialog")
      .getByRole("button", { name: "Add Office" })
      .click();

    await expect(app.getByText("Office name already exists")).toBeVisible();
  });

  test("stores a blank mobile number as null rather than an empty string", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/offices");

    await app.getByRole("button", { name: "Add Office" }).click();
    await app.getByLabel("Office Name").fill("Nadiad Office");
    await app
      .getByRole("dialog")
      .getByRole("button", { name: "Add Office" })
      .click();

    await expect(app.getByRole("cell", { name: "Nadiad Office" })).toBeVisible();

    const created = supabase.rows("offices").find((o) => o.name === "Nadiad Office");
    // The receipt's contact fallback keys off null, so "" would break it.
    expect(created?.mobile_no).toBeNull();
  });

  test("renders a dash for an office with no mobile number", async ({ app }) => {
    await app.goto("/#/offices");

    const surat = app.getByRole("row").filter({ hasText: "Surat Office" });
    // Columns: #, Name, Mobile, Address — address is empty too, so pin the Mobile cell.
    await expect(surat.getByRole("cell").nth(2)).toHaveText("—");
  });
});
