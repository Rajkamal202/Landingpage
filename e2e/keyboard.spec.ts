import { expect, test } from "@playwright/test";
import { ALL_ROUTES, APP_ROUTES } from "./routes";

/**
 * SPEC §11: "Every screen fully operable by keyboard."
 *
 * Two things are checked. First, that tabbing through a screen never gets
 * stuck and never lands on something invisible — a focus trap or an offscreen
 * tab stop makes a screen unusable long before a contrast failure does.
 * Second, that the `?` shortcuts dialog exists wherever shortcuts are bound.
 */
const MAX_TABS = 60;

for (const route of ALL_ROUTES) {
  test(`keyboard: ${route.name} traverses without trapping focus`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState("networkidle");

    const seen: string[] = [];
    let stuckAt: string | null = null;

    for (let i = 0; i < MAX_TABS; i++) {
      await page.keyboard.press("Tab");
      const current = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        if (el.closest("nextjs-portal")) return "__overlay__";
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        // Position is part of the identity: two adjacent inputs can serialise
        // identically by tag and label while being genuinely different tab
        // stops, and comparing only the visible attributes reports a trap that
        // is not there.
        return JSON.stringify({
          tag: el.tagName.toLowerCase(),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          label:
            el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? el.id ?? "",
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none",
        });
      });

      if (current === null || current === "__overlay__") continue;

      const parsed: { tag: string; label: string; visible: boolean } = JSON.parse(current);
      expect(
        parsed.visible,
        `${route.path}: focus landed on an invisible ${parsed.tag} ("${parsed.label}")`,
      ).toBe(true);

      // Focus stuck on the same element three presses running means a trap.
      const last = seen[seen.length - 1];
      const beforeLast = seen[seen.length - 2];
      if (current === last && current === beforeLast) {
        stuckAt = parsed.label || parsed.tag;
        break;
      }
      seen.push(current);
    }

    expect(stuckAt, `${route.path}: focus trapped on "${stuckAt}"`).toBeNull();
    expect(seen.length, `${route.path}: nothing was focusable`).toBeGreaterThan(0);
  });
}

test.describe("shortcuts dialog", () => {
  for (const route of APP_ROUTES) {
    test(`${route.name} opens the ? shortcuts dialog`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.locator("body").click({ position: { x: 5, y: 200 } });
      await page.keyboard.press("?");

      // Match the dialog's own heading, not any text containing the phrase —
      // the shortcut list itself contains a row labelled "Show keyboard
      // shortcuts", which makes a plain text match ambiguous.
      await expect(
        page.getByRole("dialog").getByRole("heading", { name: "Keyboard shortcuts" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    });
  }
});

test("dialogs trap focus and restore it on close", async ({ page }) => {
  // SPEC §11: "Radix handles dialog/menu focus trapping; verify it rather than
  // trusting it."
  await page.goto("/_dev/components");
  await page.waitForLoadState("networkidle");

  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => {
      const el = document.activeElement;
      return Boolean(el?.closest('[role="dialog"]'));
    });
    expect(inside, "focus escaped the dialog").toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
