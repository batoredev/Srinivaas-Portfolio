// OpenNext adapter config for Cloudflare Workers (see wrangler.jsonc).
// Every page is static, so the default (no incremental cache) is enough.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
