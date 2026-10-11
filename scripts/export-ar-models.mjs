/**
 * Generates the AR models in public/ar-models/ by running the site's own
 * builder (src/components/cinematic/ar/arModels.ts) in a real browser.
 *
 *   npm run build && npm start      # terminal 1 (or npm run dev)
 *   npm run ar:models               # terminal 2 (needs Playwright, like resume:pdf)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.AR_URL || "http://localhost:3000";
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "ar-models");
// keep in sync with AR_IDS in arCatalog.ts
const ids = ["core", "pss", "bites", "ourglass", "alpenglow"];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const id of ids) {
  await page.goto(`${base}/ar/${id}?export=1`, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.__svExportGlb === "function");
  const b64 = await page.evaluate(() => window.__svExportGlb());
  const buf = Buffer.from(b64, "base64");
  writeFileSync(path.join(out, `${id}.glb`), buf);
  console.log(`${id}.glb  ${(buf.length / 1024).toFixed(0)} KB`);
}
await browser.close();
