/**
 * Bus/driver assignments are the one master-data page that did NOT move to
 * `MasterDetailPage` — it has its own dialogs and its own fetch/refresh cycle.
 * That makes it the page most likely to drift from the others, so it gets its
 * own coverage rather than riding on the shared suite.
 */
import { test, expect } from "./fixtures/supabase";

test.beforeEach(async ({ app }) => {
  await app.goto("/#/dashboard");
});

test.describe("Bus & Driver assignments", () => {
  test("lists the existing assignment with its bus and driver", async ({ app }) => {
    await app.goto("/#/assignments");

    await expect(app.getByRole("cell", { name: "GJ-03-AB-1234" })).toBeVisible();
    await expect(app.getByRole("cell", { name: "Ramesh Patel" })).toBeVisible();
  });

  test("creates an assignment", async ({ app, supabase }) => {
    await app.goto("/#/assignments");
    await expect(app.getByRole("cell", { name: "GJ-03-AB-1234" })).toBeVisible();

    await app.getByRole("button", { name: "Add Assignment" }).click();

    const dialog = app.getByRole("dialog");
    await dialog.getByRole("combobox").first().click();
    await app.getByRole("option", { name: "GJ-05-CD-5678" }).click();
    await dialog.getByRole("combobox").nth(1).click();
    await app.getByRole("option", { name: "Suresh Shah" }).click();

    await dialog.getByRole("button", { name: "Add Assignment" }).click();

    await expect(app.getByRole("cell", { name: "GJ-05-CD-5678" })).toBeVisible();
    await expect
      .poll(() => supabase.rows("bus_driver_assignments").length)
      .toBe(2);
  });

  test("edits an assignment's driver", async ({ app, supabase }) => {
    await app.goto("/#/assignments");
    await expect(app.getByRole("cell", { name: "Ramesh Patel" })).toBeVisible();

    const row = app.getByRole("row").filter({ hasText: "Ramesh Patel" });
    await row.getByRole("button").first().click();

    const dialog = app.getByRole("dialog");
    await dialog.getByRole("combobox").nth(1).click();
    await app.getByRole("option", { name: "Suresh Shah" }).click();
    await dialog.getByRole("button", { name: "Update Assignment" }).click();

    await expect(app.getByRole("cell", { name: "Suresh Shah" })).toBeVisible();
    await expect
      .poll(
        () => supabase.rows("bus_driver_assignments")[0]?.driver_id
      )
      .toBe(2);
  });

  test("deletes an assignment", async ({ app, supabase }) => {
    await app.goto("/#/assignments");
    await expect(app.getByRole("cell", { name: "Ramesh Patel" })).toBeVisible();

    const row = app.getByRole("row").filter({ hasText: "Ramesh Patel" });
    await row.getByRole("button").nth(1).click();

    await app
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Assignment" })
      .click();

    await expect(app.getByText("No assignments found")).toBeVisible();
    await expect
      .poll(() => supabase.rows("bus_driver_assignments").length)
      .toBe(0);
  });

  test("filters assignments by search", async ({ app }) => {
    await app.goto("/#/assignments");
    await expect(app.getByRole("cell", { name: "Ramesh Patel" })).toBeVisible();

    await app.getByPlaceholder("Search assignments...").fill("nothing-matches");

    await expect(app.getByRole("cell", { name: "Ramesh Patel" })).toHaveCount(0);
  });

  test("surfaces a failure instead of closing the dialog", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/assignments");
    await expect(app.getByRole("cell", { name: "GJ-03-AB-1234" })).toBeVisible();

    supabase.failOn("bus_driver_assignments");

    await app.getByRole("button", { name: "Add Assignment" }).click();
    const dialog = app.getByRole("dialog");
    await dialog.getByRole("combobox").first().click();
    await app.getByRole("option", { name: "GJ-05-CD-5678" }).click();
    await dialog.getByRole("combobox").nth(1).click();
    await app.getByRole("option", { name: "Suresh Shah" }).click();
    await dialog.getByRole("button", { name: "Add Assignment" }).click();

    await expect(app.getByRole("dialog")).toBeVisible();
  });
});
