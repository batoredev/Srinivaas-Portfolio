// OpenNext adapter config for Cloudflare Workers (see wrangler.jsonc).
// Every page is static, so the default (no incremental cache) is enough.
//
// It lives here rather than in the project root on purpose: with an
// open-next.config.ts in the root, `wrangler deploy` hands off to
// `opennextjs-cloudflare deploy`, which skips wrangler.jsonc's build command
// and fails on Cloudflare with "did you run the build command?".
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
