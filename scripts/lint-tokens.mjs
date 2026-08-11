#!/usr/bin/env node
/**
 * Token discipline check — SPEC §13 "Every value traces to a token."
 *
 * The Tailwind theme in `globals.css` already deletes the default palette,
 * spacing scale, shadows and type scale, so `bg-blue-500` and `p-7` cannot
 * compile. This catches what the compiler cannot:
 *
 *   1. raw hex colours in components
 *   2. arbitrary utility values — `p-[13px]`, `text-[#fff]`, `shadow-[...]`
 *   3. `transition-all` (SPEC §4.6 forbids it)
 *   4. emoji used as UI (SPEC §4.7 forbids it)
 *   5. `setInterval`-driven progress (SPEC §9 wants real progress streams)
 *   6. inline `style={{ ... }}` without a `// dynamic:` justification
 *
 * Exits non-zero on any finding. Escape hatches are per-line and must carry
 * a `token-lint-disable-next-line <rule> — <reason>` comment.
 */

import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

/** Files exempt from the hex rule: the token source and hand-drawn artwork. */
const HEX_EXEMPT = [
  path.join("src", "app", "globals.css"),
  path.join("src", "lib", "cn.ts"),
];

/**
 * Directories where a raw hex is data rather than styling:
 *
 * - `lib/fixtures` models *user content* — a brand palette, a caption fill, a
 *   layer colour. Those are values a user picks in a colour well; they cannot
 *   come from our token scale, and pretending otherwise would mean the brand
 *   kit could only hold four colours.
 * - the hero illustration is hand-drawn artwork with its own named palette.
 *
 * Components rendering these values still go through the inline-style rule,
 * which requires a `dynamic:` justification at the point of use.
 */
const HEX_EXEMPT_DIRS = [
  path.join("src", "lib", "fixtures"),
  path.join("src", "components", "marketing", "illustration"),
];

const RULES = [
  {
    id: "no-raw-hex",
    // #abc, #abcd, #aabbcc, #aabbccdd
    re: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
    message: "Raw hex colour. Use a token from globals.css (e.g. text-ink-500).",
    applies: (rel) =>
      !HEX_EXEMPT.includes(rel) && !HEX_EXEMPT_DIRS.some((d) => rel.startsWith(d)),
  },
  {
    id: "no-arbitrary-utility",
    // Arbitrary *values* — `p-[13px]`, `text-[#fff]`, `w-[calc(…)]`.
    // A trailing `:` means it is an arbitrary *variant* — `data-[state=open]:`,
    // `has-[input:focus]:`, `group-data-[…]:` — which is a selector, not a
    // hardcoded value, and is allowed.
    re: /(?:^|["'`\s:])(?:-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*)-\[[^\]]+\](?!:)/g,
    message: "Arbitrary utility value. Add a token to globals.css instead of a one-off.",
  },
  {
    id: "no-transition-all",
    re: /\btransition-all\b|transition-property:\s*all\b/g,
    message: "SPEC §4.6: hover transitions never animate `all`. Use `transition-ui`.",
  },
  {
    id: "no-emoji",
    re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,
    message: "SPEC §4.7: no emoji in the product UI. Use an icon from @/components/icons.",
  },
  {
    id: "no-fake-progress",
    re: /setInterval\s*\([^)]*(?:progress|percent|pct)\b/gi,
    message:
      "SPEC §9: progress comes from a real stream (api/client.ts), not a timer.",
  },
  {
    id: "no-unjustified-inline-style",
    re: /style=\{\{/g,
    message:
      "Inline style needs a `// dynamic:` comment on the line above explaining the computed value.",
    // Satisfied when the preceding two lines carry the justification.
    ok: (lines, i) =>
      (lines[i - 1] ?? "").includes("dynamic:") || (lines[i - 2] ?? "").includes("dynamic:"),
  },
];

const EXTS = new Set([".ts", ".tsx", ".css"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "build", "fonts"]);

/** @returns {Promise<string[]>} */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(full);
      return EXTS.has(path.extname(entry.name)) ? [full] : [];
    }),
  );
  return files.flat();
}

const findings = [];

for (const file of await walk(SRC)) {
  const rel = path.relative(ROOT, file);
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");

  /**
   * A file-level opt-out, for the rare module whose whole subject matter is
   * the thing a rule forbids — a colour picker deals in raw hex by definition.
   * It must state a reason, and it only ever disables one named rule.
   */
  const fileDisabled = new Set(
    [...source.matchAll(/token-lint-disable-file\s+([\w-]+)\s+—/g)].map((match) => match[1]),
  );

  lines.forEach((line, i) => {
    // Comments describe the rules; they don't break them.
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;

    // The directive may sit at the head of a multi-line justification comment,
    // so scan back through the contiguous comment block above this line.
    const disabled = new Set();
    for (let j = i - 1; j >= 0; j--) {
      const above = (lines[j] ?? "").trim();
      if (!above.startsWith("//") && !above.startsWith("/*") && !above.startsWith("*")) break;
      const directive = above.match(/token-lint-disable-next-line\s+([\w-]+)/);
      if (directive?.[1]) disabled.add(directive[1]);
    }

    for (const rule of RULES) {
      if (rule.applies && !rule.applies(rel)) continue;
      if (disabled.has(rule.id) || fileDisabled.has(rule.id)) continue;
      rule.re.lastIndex = 0;
      const match = rule.re.exec(line);
      if (!match) continue;
      if (rule.ok?.(lines, i)) continue;
      findings.push({
        file: rel,
        line: i + 1,
        rule: rule.id,
        message: rule.message,
        excerpt: line.trim().slice(0, 96),
      });
    }
  });
}

if (findings.length === 0) {
  console.log("token discipline: clean");
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);

console.error(`\ntoken discipline: ${findings.length} finding(s)\n`);
for (const [rule, items] of byRule) {
  console.error(`  ${rule} — ${items[0].message}`);
  for (const f of items) console.error(`    ${f.file}:${f.line}  ${f.excerpt}`);
  console.error("");
}
process.exit(1);
