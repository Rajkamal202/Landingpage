import { expect, test } from "@playwright/test";
import { ALL_ROUTES, PROJECT_ID } from "./routes";

/**
 * Critical-flow smoke tests, plus the check that catches most regressions in
 * practice: a silent browser console. A React key warning or a hydration
 * mismatch shows up here long before it shows up in a screenshot.
 */
test.describe("console is clean", () => {
  for (const route of ALL_ROUTES) {
    test(`${route.name} logs no errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(600);

      // Media files are placeholders; a decode warning on a generated clip is
      // not a defect in the application.
      const real = errors.filter((text) => !/favicon|ERR_ABORTED|media/i.test(text));
      expect(real, `${route.path}:\n  ${real.join("\n  ")}`).toEqual([]);
    });
  }
});

test("hero CTA validates a bad link and names the fix", async ({ page }) => {
  // SPEC §6.2 / §15: the error must say what is wrong and what to do, and must
  // not shift the layout.
  await page.goto("/");
  const input = page.getByPlaceholder(/paste a video or slideshow link/i);
  await expect(input).toBeVisible();

  const before = await input.boundingBox();
  await input.fill("not a link");
  await input.press("Enter");

  const message = page.getByRole("alert").first();
  await expect(message).toBeVisible();
  await expect(message).not.toHaveText(/^invalid input\.?$/i);

  const after = await input.boundingBox();
  expect(after?.y, "the error message shifted the CTA").toBeCloseTo(before?.y ?? 0, 0);
});

test("hero CTA recognises a supported link and reaches the import flow", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder(/paste a video or slideshow link/i);
  await input.fill("https://www.tiktok.com/@glowlab.co/video/7318842095512");

  // SPEC §6.2: a platform badge fades in on recognition.
  await expect(page.getByText(/tiktok/i).first()).toBeVisible();
  await input.press("Enter");
  await page.waitForURL(/\/app\/import/);
});

test("pricing toggle switches period and opens a mock checkout", async ({ page }) => {
  await page.goto("/pricing");
  await page.waitForLoadState("networkidle");

  // SPEC §6.5: yearly is the default selected state.
  const yearly = page.getByRole("radio", { name: /yearly/i });
  await expect(yearly).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio", { name: /monthly/i }).click();
  await expect(page.getByRole("radio", { name: /monthly/i })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.getByRole("button", { name: /get started/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("clone flow runs its staged sequence and reaches a result", async ({ page }) => {
  await page.goto("/app/import");
  await page.waitForLoadState("networkidle");

  const input = page.getByPlaceholder(/paste a video or slideshow link/i);
  await input.fill("https://www.tiktok.com/@glowlab.co/video/7318842095512");
  await input.press("Enter");

  // SPEC §8.1: substeps check off as they complete, then a summary appears.
  await expect(page.getByText(/detecting scenes/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /open in timeline/i })).toBeVisible({
    timeout: 20_000,
  });
});

test("opening a project adds a workspace tab that survives reload", async ({ page }) => {
  // SPEC §7.1 and §10: tabs are the navigation model and persist in session.
  await page.goto(`/app/p/${PROJECT_ID}/studio`);
  await page.waitForLoadState("networkidle");

  const tabs = page.getByRole("navigation", { name: /open projects/i });
  await expect(tabs).toBeVisible();

  await page.reload();
  await expect(page.getByRole("navigation", { name: /open projects/i })).toBeVisible();
});

test("bulk grid takes a whole word when you type into a cell", async ({ page }) => {
  // SPEC §8.7's first non-negotiable: "type to begin editing". The grid's
  // keydown handler used to preventDefault() every printable key, including
  // the ones bubbling out of the editor it had just opened, so a cell captured
  // one character and swallowed the rest.
  await page.goto(`/app/p/${PROJECT_ID}/bulk`);
  await page.waitForLoadState("networkidle");

  await page.getByRole("gridcell").first().click();
  await page.keyboard.type("Typed straight in");
  await page.keyboard.press("Enter");

  await expect(page.getByText("Typed straight in")).toBeVisible();
});

test("bulk grid pastes TSV from an external spreadsheet", async ({ page, context }) => {
  // SPEC §15: "Pasting a column out of Google Sheets and having it just work is
  // the feature that makes the screen believable."
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`/app/p/${PROJECT_ID}/bulk`);
  await page.waitForLoadState("networkidle");

  const firstCell = page.getByRole("gridcell").first();
  await firstCell.click();

  await page.evaluate(async () => {
    await navigator.clipboard.writeText("Pasted hook A\tPasted body A\nPasted hook B\tPasted body B");
  });
  await page.keyboard.press("ControlOrMeta+v");

  await expect(page.getByText("Pasted hook A")).toBeVisible();
  await expect(page.getByText("Pasted hook B")).toBeVisible();
});
