// TEMPORARY diagnostic (to be reverted): builds a trivial worker instead of the
// Next.js app, to tell whether Cloudflare preview builds fail in the build or
// in the upload step.
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync(".open-next/assets", { recursive: true });
writeFileSync(".open-next/worker.js", "export default { fetch() { return new Response('probe'); } };\n");
writeFileSync(".open-next/assets/probe.txt", "probe\n");
console.log("cf-probe: trivial worker written");
