# Srinivaas Vaibhav · Portfolio

Two portfolios in one Next.js 16 app, built from a single content file.

| Mode | URL | What it is |
|------|-----|------------|
| **Cinematic** | `/` | A 15-chapter interactive story: the lifecycle of a model named Srinivaas, told through a JARVIS-style holographic interface with WebGL, motion and optional sound. |
| **Professional** | `/professional` | A calm, typographic résumé for interviewers, with a two-page print/PDF layout. |

Cinematic can hand a visitor to Professional. **Professional can never lead back to Cinematic** (see [The one-way door](#the-one-way-door)).

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start            # http://localhost:3000
```

Requires Node.js 20.9+ (Node 22 recommended).

## Editing content

Everything both modes say lives in **`src/data/content.ts`**: profile, projects, experience, the commit graph, skills, numbers, case studies, education, writing, testimonials, and the story chapters with their narrator lines.

Entries marked `sample: true` are placeholders (certifications, testimonials, write-ups). They show a small **Sample** tag on screen and are **never printed** into the résumé PDF. Replace them with real entries and delete the flag.

Contact details (email, LinkedIn, GitHub, studio link) are at the top of `profile`.

### Regenerating the résumé PDF

`public/Srinivaas-Vaibhav-Resume.pdf` is rendered from `/professional` using its print layout.

```bash
npm i -D playwright && npx playwright install chromium   # one-off
npm run dev                                               # terminal 1
npm run resume:pdf                                        # terminal 2
```

Printing `/professional` from any browser gives the same two-page résumé.

## The story (cinematic mode)

The section order is a narrative arc. A narrator (SV-OS) opens each chapter with a typed line, which is also spoken aloud if sound is on.

| # | Chapter | Section | Signature effect | Title effect |
|---|---------|---------|------------------|--------------|
| 00 | Boot | Hero | Arc-reactor boot sequence, WebGL neural brain (16k-point SDF, synapse pulses, scan plane, cursor-reactive), brain regions mapped to skills | Glyph decode |
| 01 | Identity | About Me | Projected ID hologram with a name-seeded "neural fingerprint", scroll-scrubbed statement, Talk → Model → Build → Run loop | Letters assemble from scatter |
| 02 | Training | Education | Loss/accuracy curves drawn by scroll, checkpoints, model card with hyperparameters | Loading-bar fill |
| 03 | Weights | Tech Stack | Live feed-forward neural network: languages in, products out, hover to trace synapses | Neurons fire letter by letter |
| 04 | Validation | Certifications | Holographic foil cards with pointer tilt and resolving checksums | Stamp slam + "Verified" |
| 05 | Deployment | Experience | `git log --graph` with branch lanes that draw as you scroll | Diff (– cliché / + Experience) |
| 06 | Inference | Featured Projects | Holo-projector table: each project materialises as its own 3D model | Hologram flicker |
| 07 | Interpretability | Case Studies | X-ray lens revealing the architecture blueprint under the product UI | Blueprint dimension lines |
| 08 | Evaluation | Achievements | Arc-reactor gauges that power up and count | Odometer roll |
| 09 | Open weights | GitHub / Coding | Interactive terminal (try `help`, `repos`, `sudo hire srinivaas`) + 3D activity skyline | Shell prompt |
| 10 | Papers | Research & Writing | Transformer-style attention arcs between words | Redaction → declassified |
| 11 | Human feedback | Testimonials | Voiceprint visualiser with streaming transcript | Waveform settle |
| 12 | Next epoch | Currently Building | Tilted holo-screens streaming live build logs | Typewriter |
| 13 | Model card | Resume | Laser-traced page printed by a scan head, compression report | Scan-line print |
| 14 | Handshake | Contact | "Creation of Adam": a procedural robotic hand reaches for your cursor, an energy arc closes the gap | Signal lock |
| 15 | Shutdown | Footer | Session stats (uptime, synapses fired, chapters completed), cursor-lit wordmark | CRT power-on |

Global chrome: target-lock reticle cursor (brackets snap to what you hover), chapter HUD with live IST clock, chapter rail, Lenis smooth scroll, synthesised sound (opt-in, no audio files), reduced-motion support.

## The one-way door

Four independent layers stop any route from Professional back to Cinematic (`src/lib/mode.ts`):

1. **No links.** Professional has its own root layout and renders nothing that points to `/`.
2. **History is rewritten.** Leaving cinematic uses `location.replace()`, so Back cannot return to it.
3. **Server lock.** `src/proxy.ts` stamps a session cookie on `/professional` and redirects any later request for `/` there (HTTP 307).
4. **Client guards.** An inline pre-paint script and a `pageshow` listener in the cinematic layout catch back-forward-cache restores and stale tabs.

The 404 page only offers "Go back". The lock lasts for the browser session. To see Cinematic again while developing, use a private window or clear the site's cookies.

`scripts/check-one-way-door.mjs` tests the server half against a running site (redirect, cookie, caching, no links back):

```bash
npm run build && npm start                 # terminal 1
node scripts/check-one-way-door.mjs        # terminal 2 (BASE_URL=… to test another host)
```

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and every push to `main`:

| Job | What it checks |
|-----|----------------|
| Lint, build, one-way door | ESLint, `next build` (includes the TypeScript check), then the one-way-door tests on the Node server |
| Cloudflare worker | Bundles the worker exactly as Cloudflare deploys it, then runs the one-way-door tests on the Cloudflare runtime (`wrangler dev`) |

## Deploying

The site deploys to **Cloudflare Workers** through the [OpenNext adapter](https://opennext.js.org/cloudflare). Pushing to `main` deploys production.

`wrangler.jsonc` builds the worker itself (`build.command`), so the Cloudflare dashboard needs no build command: the default deploy command (`npx wrangler deploy`) and non-production command (`npx wrangler versions upload`) are enough. The adapter and Wrangler are pinned to exact versions so a new release can't break deploys unannounced.

**Pull-request previews.** Cloudflare's non-production (branch) builds currently fail before uploading anything, even for a minimal test worker with no bindings or dependencies, so the cause is in the Cloudflare project's build settings rather than in this repo. Fix it in the Cloudflare dashboard (Workers & Pages → `srinivaas-portfolio` → Settings → Build): check that the non-production branch deploy command is `npx wrangler versions upload`, and if the build log says the Worker name doesn't match, disconnect and reconnect the Git repository there. If previews aren't needed, turn off *Builds for non-production branches* under Branch control. GitHub Actions CI covers every pull request either way.

```bash
npm run cf:preview   # build and serve the worker locally on the Cloudflare runtime
npm run cf:deploy    # build and deploy (needs `npx wrangler login`)
```

It also runs anywhere with a Node server (Vercel, a VPS with `npm start`). The one-way-door proxy needs a server, so `output: "export"` (static hosting) is not supported.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · three.js, React Three Fiber, drei, postprocessing · Motion · Lenis · custom GLSL.

## Project structure

```
src/
  app/
    (cinematic)/         layout (fonts, pre-paint guard), page, cinematic.css
    (professional)/      layout, /professional page, professional.css
    global-not-found.tsx
  components/
    cinematic/
      CinematicApp.tsx   story order, Lenis, HUD, boot gate
      hud/               BootSequence, Hud + chapter rail, Reticle, Handoff
      sections/          one file per chapter
      three/             Stage (lazy canvas), NeuralBrain (+ worker), ProjectHologram, Skyline, RoboticHand
      ui/                SectionTitle (16 title effects), Chapter, Counter
    professional/        ProfessionalPage, PrintResume, client islands
  data/content.ts        all copy and data
  lib/                   mode lock, store, audio, hooks
  proxy.ts               server half of the one-way door
scripts/generate-resume-pdf.mjs
```
