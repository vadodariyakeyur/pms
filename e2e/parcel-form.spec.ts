/**
 * Add and Edit share `ParcelForm`, so validation is tested once and each page
 * is tested for what it uniquely does: Add allocates a bill number and creates
 * a row; Edit loads an existing parcel and updates it in place.
 *
 * The save path is the one that used to fail silently — `onSubmit` was typed
 * `VoidFunction` and called without `await`, so a rejected save looked exactly
 * like a successful one. "Saving navigates to the receipt" is the assertion
 * that would have caught it.
 */
import { test, expect, type Page } from "./fixtures/supabase";

test.beforeEach(async ({ app }) => {
  await app.goto("/#/dashboard");
});

/**
 * Fills every field the form requires before it will submit.
 *
 * Order matters: blurring a mobile field looks the number up in the offline
 * customer cache and overwrites the matching name field with whatever it finds
 * — `undefined` when there is no match. So each mobile is committed and blurred
 * before its name is typed, which is also the order a user tabs through.
 */
async function fillRequiredFields(app: Page) {
  // The bus/driver assignment is auto-selected by the form.
  await app.locator("#sender-mobile").fill("9111100001");
  await app.locator("#receiver-mobile").fill("9111100002");
  await app.locator("#receiver-mobile").blur();

  await app.locator("#sender-name").fill("Test Sender");
  await app.locator("#receiver-name").fill("Test Receiver");

  await app.getByPlaceholder("Description").fill("Test box");
}

test.describe("Add Parcel", () => {
  test("renders the form with an auto-generated bill number", async ({ app }) => {
    await app.goto("/#/parcels/add");

    await expect(app.getByRole("heading", { name: "Add Parcel" })).toBeVisible();
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");
  });

  test("preselects the default origin and destination cities", async ({ app }) => {
    await app.goto("/#/parcels/add");

    // Rajkot is the default FROM city, Surat the default TO city.
    await expect(app.getByText("Rajkot", { exact: true }).first()).toBeVisible();
    await expect(app.getByText("Surat", { exact: true }).first()).toBeVisible();
  });

  test("refuses to save without a bus and driver", async ({ app, supabase }) => {
    // The form auto-selects the most recent assignment, so the only way to
    // reach this branch is for there to be none to select.
    supabase.data.bus_driver_assignments.length = 0;

    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(
      app.getByText("Please select a bus and driver assignment")
    ).toBeVisible();
    expect(supabase.rows("parcels")).toHaveLength(3);
  });

  test("refuses to save without sender and receiver details", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(
      app.getByText("Please fill in all sender and receiver details")
    ).toBeVisible();
    expect(supabase.rows("parcels")).toHaveLength(3);
  });

  test("refuses to save without parcel item details", async ({ app, supabase }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await app.locator("#sender-mobile").fill("9111100001");
    await app.locator("#receiver-mobile").fill("9111100002");
    await app.locator("#receiver-mobile").blur();
    await app.locator("#sender-name").fill("Test Sender");
    await app.locator("#receiver-name").fill("Test Receiver");

    // Description left blank.
    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(
      app.getByText("Please fill in all parcel item details")
    ).toBeVisible();
    expect(supabase.rows("parcels")).toHaveLength(3);
  });

  test("creates the parcel and goes to the receipt", async ({ app, supabase }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await fillRequiredFields(app);
    await app.getByRole("button", { name: "Save & Preview" }).click();

    // Bill numbers are allocated server-side; 103 is the highest seeded.
    await expect(app).toHaveURL(/#\/parcel\/4\/print/);

    const created = supabase.rows("parcels").find((p) => p.bill_no === 104);
    expect(created).toMatchObject({
      sender_name: "Test Sender",
      receiver_name: "Test Receiver",
      description: "Test box",
      office_id: 1,
    });
  });

  test("stores the money split the way the receipt reads it", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await fillRequiredFields(app);
    await app.getByPlaceholder("0").first().fill("750");
    await app.locator("#amount-given").fill("250");

    await app.getByRole("button", { name: "Save & Preview" }).click();
    await expect(app).toHaveURL(/#\/parcel\/4\/print/);

    const created = supabase.rows("parcels").find((p) => p.bill_no === 104);
    // amount_remaining is derived, never typed in — the receipt and the
    // unpaid badge both key off it.
    expect(created).toMatchObject({
      amount: 750,
      amount_given: 250,
      amount_remaining: 500,
    });
  });

  test("shows the remaining amount as the user types", async ({ app }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await app.getByPlaceholder("0").first().fill("900");
    await app.locator("#amount-given").fill("400");

    await expect(app.locator("#amount-remaining")).toHaveValue("500");
  });

  test("reports a failed save instead of silently pretending it worked", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await fillRequiredFields(app);
    supabase.failOn("parcels");

    await app.getByRole("button", { name: "Save & Preview" }).click();

    // The regression this guards: the save used to be fired without `await`,
    // so a rejected insert still navigated to the receipt.
    await expect(app).not.toHaveURL(/print/);
    await expect(app.getByRole("alert")).toBeVisible();
  });

  test("caps a mobile number at ten digits", async ({ app }) => {
    await app.goto("/#/parcels/add");
    await expect(app.locator("#bill-no")).toHaveValue("Auto-generated");

    await app.locator("#sender-mobile").fill("91111000019999");

    await expect(app.locator("#sender-mobile")).toHaveValue("");
  });
});

test.describe("Edit Parcel", () => {
  test("loads the existing parcel into the form", async ({ app }) => {
    await app.goto("/#/parcel/1/edit");

    await expect(app.getByRole("heading", { name: "Edit Parcel" })).toBeVisible();
    await expect(app.locator("#bill-no")).toHaveValue("R101");
    await expect(app.locator("#sender-name")).toHaveValue("Anil Mehta");
    await expect(app.locator("#receiver-name")).toHaveValue("Bhavna Joshi");
  });

  test("saves an edit and goes to the receipt", async ({ app, supabase }) => {
    await app.goto("/#/parcel/1/edit");
    await expect(app.locator("#sender-name")).toHaveValue("Anil Mehta");

    // Edits the description rather than a name: blurring a mobile field
    // re-reads the name from the offline cache, so a name edit made while a
    // mobile field still holds focus would be overwritten before submit.
    await app.getByPlaceholder("Description").fill("Repacked documents");
    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(app).toHaveURL(/#\/parcel\/1\/print/);
    await expect
      .poll(
        () => supabase.rows("parcels").find((p) => p.bill_no === 101)?.description
      )
      .toBe("Repacked documents");
  });

  test("recomputes the remaining amount on edit", async ({ app, supabase }) => {
    await app.goto("/#/parcel/2/edit");
    await expect(app.locator("#bill-no")).toHaveValue("R102");

    await app.locator("#amount-given").fill("800");
    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(app).toHaveURL(/#\/parcel\/2\/print/);
    await expect
      .poll(
        () =>
          supabase.rows("parcels").find((p) => p.bill_no === 102)
            ?.amount_remaining
      )
      .toBe(0);
  });

  test("does not create a second parcel when editing", async ({
    app,
    supabase,
  }) => {
    const before = supabase.rows("parcels").length;

    await app.goto("/#/parcel/1/edit");
    await expect(app.locator("#sender-name")).toHaveValue("Anil Mehta");

    await app.locator("#sender-name").fill("Renamed Sender");
    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(app).toHaveURL(/#\/parcel\/1\/print/);
    expect(supabase.rows("parcels")).toHaveLength(before);
  });

  test("reports a failed update instead of navigating away", async ({
    app,
    supabase,
  }) => {
    await app.goto("/#/parcel/1/edit");
    await expect(app.locator("#sender-name")).toHaveValue("Anil Mehta");

    supabase.failOn("parcels");
    await app.locator("#sender-name").fill("Will Not Save");
    await app.getByRole("button", { name: "Save & Preview" }).click();

    await expect(app).not.toHaveURL(/print/);
    await expect(app.getByRole("alert")).toBeVisible();
  });
});
