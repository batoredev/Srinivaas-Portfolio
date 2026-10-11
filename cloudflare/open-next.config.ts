// OpenNext adapter config for Cloudflare Workers (see wrangler.jsonc).
// Pages are either static or rendered per request (the /ar pages), so the
// default (no incremental cache) is enough. Don't prerender a dynamic route
// (generateStaticParams): without a cache those pages 404 on Cloudflare.
//
// It lives here rather than in the project root on purpose: with an
// open-next.config.ts in the root, `wrangler deploy` hands off to
// `opennextjs-cloudflare deploy`, which skips wrangler.jsonc's build command
// and fails on Cloudflare with "did you run the build command?".
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
