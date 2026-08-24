import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Flat config (ESLint 9). `eslint-config-next` v16 ships flat config arrays
 * directly, so they're spread in rather than bridged through FlatCompat.
 */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The studio narrows `kind → config` by hand at a few boundaries; those
      // casts are reviewed rather than inferred.
      "@typescript-eslint/no-explicit-any": "warn",
      // Leading-underscore names are deliberate discards, mostly from
      // destructuring props out of a spread.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Every remaining hit is a client-only read that cannot happen during
      // render — localStorage hydration, an IntersectionObserver callback, a
      // scroll position, a DOM measurement. Kept visible as a warning so a
      // genuine cascading-render bug still shows up in review.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
