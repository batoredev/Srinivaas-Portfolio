/**
 * Renders /professional with print styles into public/Srinivaas-Vaibhav-Resume.pdf.
 *
 *   npm run dev            # in one terminal
 *   npm run resume:pdf     # in another (needs Playwright: npx playwright install chromium)
 *
 * Sample placeholders (data-sample) are excluded by the print stylesheet.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const url = process.env.RESUME_URL || "http://localhost:3000/professional";
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "Srinivaas-Vaibhav-Resume.pdf");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });
await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Résumé written to ${out}`);
