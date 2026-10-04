// Smoke test for the server side of the one-way door (src/proxy.ts) and for
// links back to cinematic. Runs against a live server:
//
//   npm run build && npm start          # or: npx wrangler dev
//   BASE_URL=http://localhost:3000 node scripts/check-one-way-door.mjs
//
// Waits up to WAIT_SECONDS (default 180) for the server to come up.

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const WAIT_SECONDS = Number(process.env.WAIT_SECONDS ?? 180);
const LOCK = "sv_mode=professional";

// Any anchor that would take a visitor to the cinematic root of this site.
const host = new URL(BASE).host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LINK_TO_ROOT = new RegExp(`href="(?:https?://${host})?/(?:[?#][^"]*)?"`);

const get = (path, cookie) =>
  fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });

async function waitForServer() {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  for (;;) {
    try {
      await get("/professional");
      return;
    } catch {
      if (Date.now() > deadline) throw new Error(`${BASE} did not respond within ${WAIT_SECONDS}s`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

let failed = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
  if (!ok) failed++;
}

await waitForServer();
console.log(`One-way door checks against ${BASE}\n`);

{
  const res = await get("/");
  const html = await res.text();
  check("cinematic / loads for a new visitor", res.status === 200, `status ${res.status}`);
  check("cinematic / is never cached", /no-store/.test(res.headers.get("cache-control") ?? ""), res.headers.get("cache-control"));
  check("cinematic page carries the pre-paint guard", html.includes(LOCK) && html.includes("location.replace"));
}

{
  const res = await get("/professional");
  const html = await res.text();
  check("professional loads", res.status === 200, `status ${res.status}`);
  check("professional sets the lock cookie", (res.headers.get("set-cookie") ?? "").includes(LOCK), res.headers.get("set-cookie"));
  const link = html.match(LINK_TO_ROOT);
  check("professional has no link back to cinematic", !link, link?.[0]);
}

{
  const res = await get("/", LOCK);
  const to = res.headers.get("location") ?? "";
  check("locked visitor asking for / is redirected", res.status === 307 || res.status === 308, `status ${res.status}`);
  check("…to /professional", new URL(to, BASE).pathname === "/professional", `location ${to}`);
  check("…and the redirect is not cached", /no-store/.test(res.headers.get("cache-control") ?? ""), res.headers.get("cache-control"));
}

{
  const res = await get("/?utm_source=x#top", LOCK);
  check("query strings do not bypass the lock", res.status === 307 || res.status === 308, `status ${res.status}`);
}

{
  const res = await get("/this-page-does-not-exist");
  const html = await res.text();
  const link = html.match(LINK_TO_ROOT);
  check("404 page answers 404", res.status === 404, `status ${res.status}`);
  check("404 page has no link to cinematic", !link, link?.[0]);
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
