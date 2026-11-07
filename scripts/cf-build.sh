#!/usr/bin/env bash
# Builds the Cloudflare Workers bundle. OpenNext embeds .env* files into the bundle, so local
# development env files are moved aside during the build (production values come from Wrangler).
set -euo pipefail
cd "$(dirname "$0")/.."
moved=()
restore() { for f in "${moved[@]:-}"; do [[ -n "$f" && -f "$f.cf-build-bak" ]] && mv "$f.cf-build-bak" "$f"; done; }
trap restore EXIT
for f in .env .env.local .env.production .env.production.local; do
  if [[ -f "$f" ]]; then mv "$f" "$f.cf-build-bak"; moved+=("$f"); fi
done
npx prisma generate
node scripts/copy-flags.mjs
npx opennextjs-cloudflare build
