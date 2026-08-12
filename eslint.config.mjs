import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  // `next/core-web-vitals` already registers eslint-plugin-jsx-a11y (with a
  // thin subset of its rules enabled), so the plugin is not re-declared here
  // — the rules we want beyond that subset are turned on below.
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      // SPEC "Code": no any, no ts-ignore.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 12,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // SPEC §11 — WCAG 2.1 AA "verified, not assumed". These catch the four
      // failures that actually happen: a <div> where a <button> belongs, an
      // unlabelled control, a mouse-only interaction, and a broken heading or
      // list structure.
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      // Drop targets are excluded from the handler list. A drag is inherently a
      // pointer gesture: the accessibility requirement (SPEC §11) is that an
      // equivalent path exists — every drop target in this product also opens
      // AssetPickerDialog from a real button — not that the drop zone itself
      // pretend to be a control. Every genuine interaction handler stays.
      "jsx-a11y/no-static-element-interactions": [
        "error",
        {
          handlers: [
            "onClick",
            "onMouseDown",
            "onMouseUp",
            "onKeyPress",
            "onKeyDown",
            "onKeyUp",
          ],
        },
      ],
      // The default handler list includes onLoad and onError, which are
      // lifecycle events rather than user interactions — an <img onLoad> that
      // swaps out a skeleton is not an accessibility problem. Everything that
      // is genuinely an interaction stays in the list.
      "jsx-a11y/no-noninteractive-element-interactions": [
        "error",
        {
          handlers: [
            "onClick",
            "onMouseDown",
            "onMouseUp",
            "onKeyPress",
            "onKeyDown",
            "onKeyUp",
          ],
        },
      ],
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either" }],
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/no-autofocus": ["warn", { ignoreNonDOM: true }],

      // SPEC §2: no component may reach past the API layer, and Lucide is
      // only ever consumed through the <Icon> wrapper so stroke width and
      // optical nudges stay consistent (SPEC §4.7).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/fixtures", "@/lib/fixtures/*", "**/lib/fixtures/*"],
              message:
                "Fixtures are only reachable from src/lib/api/*. Import the typed API function instead.",
            },
            {
              group: ["lucide-react"],
              message:
                "Import icons from @/components/icons so stroke width and optical alignment stay consistent.",
            },
          ],
        },
      ],
    },
  },

  // The API layer is the one place allowed to read fixtures.
  {
    files: ["src/lib/api/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },

  // The icon wrapper is the one place allowed to import Lucide.
  {
    files: ["src/components/icon.tsx", "src/components/icons.ts"],
    rules: { "no-restricted-imports": "off" },
  },

  {
    files: ["scripts/**/*.mjs", "e2e/**/*.ts", "*.config.{ts,mjs}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
