import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", ".next-dev/**", ".open-next/**", ".wrangler/**", "node_modules/**", "public/**", "tests/e2e/**", "cf-worker.ts"] },
  {
    rules: {
      // Plain <a> is required for file downloads served by API routes (CSV, ZIP, documents).
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];
