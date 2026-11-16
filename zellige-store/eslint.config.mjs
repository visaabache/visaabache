import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // App Router only: plain <a> is used on purpose for file downloads (/api/admin/export) and new-tab previews.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];
