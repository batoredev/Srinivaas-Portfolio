# Srinivaas Vaibhav · Portfolio

Two portfolios in one Next.js 16 app, built from a single content file.

| Mode | URL | What it is |
|------|-----|------------|
| **Cinematic** | `/` | A short interactive story in chapters: the lifecycle of a model named Srinivaas, told through a JARVIS-style holographic interface with WebGL, motion and optional sound. |
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

Entries marked `sample: true` are placeholders (certifications, testimonials, write-ups). While a section has only samples it stays hidden in both modes and never reaches the résumé PDF. Add one real entry (no `sample` flag) and its chapter appears on its own, with chapter numbers closing up around it.

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

The whole page is one world. A single WebGL particle form, **the Core**, lives behind every chapter (`three/CoreWorld.tsx`). It starts as a neural brain and re-forms into each chapter's shape as you scroll: a fingerprint for Identity, a network for Weights, a DNA helix of commits for Deployment, a lattice for Inference, a tensor for Open weights, orbiting processes for Next epoch, two reaching streams for Handshake, and a single point at Shutdown. Scroll position drives every change, so scrolling back plays it in reverse.

- **Prologue.** Before the first chapter, six short beats decode word by word over the Core ("Every business runs on a story…", Talk, Model, Build, Run, "One person. End to end."). If a visitor waits at the top, a slow guided glide plays the prologue once per session; any scroll, key or touch hands control back.
- **Interludes.** Between chapters the Core takes centre stage and re-forms while the narrator (SV-OS) names the next chapter. The text decodes from tokens as it scrolls in and dissolves as the chapter begins; the line is also spoken if sound is on. In the chapter itself the Core steps back to the emptier side of the screen.
- **Colour.** The world is cool training light until Deployment, then turns to warm production light.
- **Retrain the Core.** The refresh button in the HUD (or the R key) re-initialises its weights: it bursts apart and re-forms in a new colour.
- **Replay.** The footer's replay button scrolls back to the start and powers the Core up again.
- **Adaptive quality.** If frames run long, it lowers resolution, then turns off bloom, then halves the particles.

| # | Chapter | Section | Signature effect | Title effect |
|---|---------|---------|------------------|--------------|
| 00 | Boot | Hero | Arc-reactor power-up that opens on its own, the Core as an anatomical neural brain (lobes, fissures and folds, 16k points, synapse pulses, scan plane, cursor-reactive), brain regions mapped to skills | Glyph decode |
| 01 | Identity | About Me (with Education) | Projected ID hologram with a name-seeded "neural fingerprint", training card | Letters assemble from scatter |
| 02 | Weights | Tech Stack | Live feed-forward neural network: languages in, products out, hover to trace synapses | Neurons fire letter by letter |
| 03 | Deployment | Experience (with key numbers) | Arc-reactor gauges that power up and count, then `git log --graph` with branch lanes that draw as you scroll | Diff (– cliché / + Experience) |
| 04 | Inference | Featured Projects (with case studies) | Holo-projector: each project materialises as its own 3D model; an X-ray lens reveals the architecture blueprint underneath | Hologram flicker |
| 05 | Open weights | GitHub / Coding | Interactive terminal (try `help`, `repos`, `sudo hire srinivaas`) + 3D activity skyline | Shell prompt |
| 06 | Next epoch | Currently Building | Tilted holo-screens streaming live build logs | Typewriter |
| 07 | Handshake | Contact (with résumé) | A synthetic hand of light over a visible robotic skeleton reaches in; as your cursor nears its fingertip a stream of particles reaches out to meet it, and touching the tip locks on | Signal lock |
| 08 | Shutdown | Footer | Session stats (uptime, synapses fired, chapters completed), cursor-lit wordmark | CRT power-on |

Waiting in the wings, shown once they have real entries: Certifications (Validation, holographic foil cards), Research & Writing (Papers, attention arcs) and Testimonials (Human feedback, voiceprint visualiser).

Project holograms: Perfect Study Space (floors of live desks), Bites by Batore (a city grid where pins wait for human review inside a 2 km radius), OurGlass (an hourglass: loose conversation falls through and settles as structure), Alpenglow Global (a globe with leads arcing home).

Each project hologram, and the Core itself, can also be placed in your room in AR (see [AR projector](#ar-projector)).

Global chrome: target-lock reticle cursor (brackets snap to what you hover), chapter HUD with live IST clock, chapter rail, Lenis smooth scroll, synthesised sound (opt-in, no audio files), reduced-motion support.

## AR projector

"View in AR" on the hero and on each project opens a 3D preview (Google's [`<model-viewer>`](https://modelviewer.dev), self-hosted in `public/vendor/` because its npm package pins an older three.js). On a phone it places the model in the room: WebXR or Scene Viewer on Android, Quick Look on iPhone. On a desktop the dialog shows a QR code that opens the same model on a phone at `/ar/<model>` (`core`, `pss`, `bites`, `ourglass`, `alpenglow`).

The models in `public/ar-models/` are generated from code (`src/components/cinematic/ar/arModels.ts`) at real table-top scale. After changing that file, regenerate them:

```bash
npm run build && npm start      # terminal 1
AR_URL=http://localhost:3000 npm run ar:models   # terminal 2 (needs Playwright, like resume:pdf)
```

## The one-way door

Four independent layers stop any route from Professional back to Cinematic (`src/lib/mode.ts`):

1. **No links.** Professional has its own root layout and renders nothing that points to `/`.
2. **History is rewritten.** Leaving cinematic uses `location.replace()`, so Back cannot return to it.
3. **Server lock.** `src/proxy.ts` stamps a session cookie on `/professional` and redirects any later request for `/` or an `/ar/…` page there (HTTP 307).
4. **Client guards.** An inline pre-paint script and a `pageshow` listener in the cinematic layout catch back-forward-cache restores and stale tabs.

The 404 page only offers "Go back". The lock lasts for the browser session. To see Cinematic again while developing, use a private window or clear the site's cookies.

`scripts/check-one-way-door.mjs` tests the server half against a running site (redirect, cookie, caching, AR pages, no links back):

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

The OpenNext config lives in `cloudflare/open-next.config.ts`, not the project root. With it in the root, a real `wrangler deploy` hands off to `opennextjs-cloudflare deploy`, which skips `build.command` and fails with *did you run the build command?* (`--dry-run` doesn't hand off, so it can't catch this). CI runs a real `wrangler deploy` without credentials to guard that path.

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
    (cinematic)/         layout (fonts, pre-paint guard), page, cinematic.css, ar/[model] (AR projector page)
    (professional)/      layout, /professional page, professional.css
    global-not-found.tsx
  components/
    cinematic/
      CinematicApp.tsx   renders the chapters in story order, Lenis, HUD, boot, guided glide
      ar/                AR dialog and page, model-viewer wrapper, QR code, AR model builder
      hud/               BootSequence, Hud + chapter rail, Reticle, Handoff, Retrain
      sections/          Prologue, then one file per chapter
      three/             CoreWorld (the Core, its shapes, storyline and worker), Stage, ProjectHologram, Skyline, HoloHand
      ui/                SectionTitle (title effects), Chapter (interludes), Decode, Counter, Gauge
    professional/        ProfessionalPage, PrintResume, client islands
  data/content.ts        all copy and data
  lib/                   mode lock, store, audio, hooks
  proxy.ts               server half of the one-way door
scripts/                generate-resume-pdf, export-ar-models, check-one-way-door
```
