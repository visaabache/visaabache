#!/usr/bin/env bash
# Safe production release on Cloudflare Workers (free plan friendly):
#   build → upload static files → upload the new Worker version (0 % traffic) → pre-render every public page into
#   the KV page cache from this machine → switch 100 % of traffic to the new version.
# Visitors never hit a cold cache, so a release no longer causes a burst of renders (error 1102).
# Needs: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, DATABASE_URL, SESSION_SECRET, DOCUMENT_ENCRYPTION_KEY.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run cf:build
STATIC_KV_ID=fb967ffb2e284be0b85b9080d8987d5f node scripts/cf-upload-assets.mjs
VERSION=$(npx wrangler versions upload --message "${1:-release}" 2>&1 | tee /dev/stderr | grep -oE 'Worker Version ID: [0-9a-f-]+' | awk '{print $4}')
[[ -n "$VERSION" ]] || { echo "could not read the new version id" >&2; exit 1; }
node scripts/cf-prerender.mjs "$VERSION"
npx wrangler versions deploy "$VERSION@100%" --yes --message "${1:-release}"
echo "released $VERSION"
