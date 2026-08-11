import { expect, test } from "@playwright/test";
import { ALL_ROUTES, VIEWPORTS } from "./routes";

/**
 * SPEC §13: "Verified at 390, 768, 1280, 1920. No horizontal scroll, no
 * clipped content, no overlap."
 *
 * On failure the test names the offending elements, because "the page scrolls
 * sideways" is not an actionable bug report.
 */
for (const viewport of VIEWPORTS) {
  for (const route of ALL_ROUTES) {
    test(`responsive: ${route.name} at ${viewport.name} has no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const report = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflows = doc.scrollWidth > doc.clientWidth;
        if (!overflows) return { overflows, offenders: [] as string[] };

        const offenders: string[] = [];
        for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
          if (el.closest("nextjs-portal")) continue;
          const rect = el.getBoundingClientRect();
          if (rect.right > doc.clientWidth + 1 && rect.width > 0) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 70) : "";
            offenders.push(`${el.tagName.toLowerCase()}.${cls} right=${Math.round(rect.right)}`);
          }
          if (offenders.length >= 5) break;
        }
        return { overflows, offenders };
      });

      expect(
        report.overflows,
        `${route.path} @ ${viewport.name}px overflows horizontally:\n  ${report.offenders.join("\n  ")}`,
      ).toBe(false);
    });
  }
}

test.describe("editors degrade honestly below lg", () => {
  const editors = ALL_ROUTES.filter((route) => route.desktopOnly);

  for (const route of editors) {
    test(`${route.name} shows a wider-screen notice at 390`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // SPEC §13: a clear "this needs a larger screen" state beats a broken
      // timeline. The copy is owned by SmallScreenNotice.
      await expect(page.getByText(/needs a wider screen/i)).toBeVisible();
    });
  }
});
