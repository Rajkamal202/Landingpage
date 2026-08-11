import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_ROUTES } from "./routes";

/**
 * SPEC §11: "WCAG 2.1 AA, verified not assumed."
 *
 * Axe cannot prove accessibility, but it reliably catches the four failures
 * that actually ship: missing names on controls, contrast below threshold,
 * broken landmark/heading structure, and ARIA that contradicts itself.
 * Keyboard operation is covered separately in keyboard.spec.ts.
 */
for (const route of ALL_ROUTES) {
  test(`a11y: ${route.name} has no axe violations`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // The Next.js dev/build overlay is not our markup.
      .exclude("nextjs-portal")
      .analyze();

    const summary = results.violations.map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n    ${violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(" "))
          .join("\n    ")}`,
    );

    expect(summary, `${route.path}\n${summary.join("\n")}`).toEqual([]);
  });
}

test.describe("document structure", () => {
  for (const route of ALL_ROUTES) {
    test(`${route.name} has exactly one h1 and a main landmark`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // SPEC §11: "one h1 per route, correct heading order."
      const h1Count = await page.locator("h1").count();
      expect(h1Count, `${route.path} should have exactly one h1`).toBe(1);

      const mainCount = await page.locator("main").count();
      expect(mainCount, `${route.path} should have exactly one main landmark`).toBe(1);
    });
  }
});

test.describe("focus visibility", () => {
  for (const route of ALL_ROUTES.slice(0, 8)) {
    test(`${route.name} shows a visible ring on the first focusable element`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.keyboard.press("Tab");

      const outline = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
      });

      expect(outline, `${route.path}: nothing received focus on first Tab`).not.toBeNull();
      // SPEC §11: 2px brand ring, never removed without replacement.
      expect(outline?.style).not.toBe("none");
      expect(Number.parseFloat(outline?.width ?? "0")).toBeGreaterThanOrEqual(2);
    });
  }
});
