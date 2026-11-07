// OpenNext adapter config for Cloudflare Workers.
// All pages are rendered on demand (force-dynamic), so no incremental cache (R2) is needed.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
