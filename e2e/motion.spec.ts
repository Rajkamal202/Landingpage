import { expect, test } from "@playwright/test";
import { ALL_ROUTES } from "./routes";

/**
 * SPEC §4.6 and §13: "`prefers-reduced-motion` verified by actually toggling
 * it", and "Nothing transitions `all`."
 *
 * The first is checked by emulating the setting and asserting that no element
 * still carries a meaningful transition or animation duration. The second is
 * checked against computed styles, which catches a stray `transition: all`
 * arriving from a third-party stylesheet as well as from our own.
 */
test.describe("prefers-reduced-motion", () => {
  for (const route of ALL_ROUTES) {
    test(`${route.name} reduces motion to a 1ms fade`, async ({ page }) => {
      // Toggled explicitly rather than via a project-level option, so the test
      // reads as SPEC §13 asks: verified by actually toggling it.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const offenders = await page.evaluate(() => {
        const bad: string[] = [];
        const toMs = (value: string) =>
          value
            .split(",")
            .map((part) => {
              const trimmed = part.trim();
              if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed);
              if (trimmed.endsWith("s")) return Number.parseFloat(trimmed) * 1000;
              return 0;
            })
            .reduce((max, current) => Math.max(max, current), 0);

        for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
          if (el.closest("nextjs-portal")) continue;
          const style = getComputedStyle(el);
          const transition = toMs(style.transitionDuration);
          const animation = toMs(style.animationDuration);
          if (transition > 1 || animation > 1) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
            bad.push(
              `${el.tagName.toLowerCase()}.${cls} transition=${style.transitionDuration} animation=${style.animationDuration}`,
            );
          }
          if (bad.length >= 5) break;
        }
        return bad;
      });

      expect(offenders, `${route.path} still animates under reduced motion:\n  ${offenders.join("\n  ")}`).toEqual([]);
    });
  }
});

test.describe("transition discipline", () => {
  for (const route of ALL_ROUTES) {
    test(`${route.name} never transitions all`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const offenders = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
          if (el.closest("nextjs-portal")) continue;
          const property = getComputedStyle(el).transitionProperty;
          if (property === "all") {
            const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
            bad.push(`${el.tagName.toLowerCase()}.${cls}`);
          }
          if (bad.length >= 5) break;
        }
        return bad;
      });

      expect(offenders, `${route.path} has transition-property: all on:\n  ${offenders.join("\n  ")}`).toEqual([]);
    });
  }
});
