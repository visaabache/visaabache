// Copies country flag SVGs (MIT, country-flag-icons) into /public/flags so that
// any destination added from the admin panel has a flag without extra bundles.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules", "country-flag-icons", "3x2");
const dest = join(process.cwd(), "public", "flags");
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("[flags] copied to public/flags");
} else {
  console.warn("[flags] country-flag-icons not installed; skipping");
}
