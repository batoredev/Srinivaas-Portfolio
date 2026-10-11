/*
 * The holograms a visitor can place in their own room. Models are generated
 * from code (see arModels.ts, `npm run ar:models`) and served as static GLB
 * files, which Android (WebXR / Scene Viewer) and iPhone (Quick Look, via an
 * on-the-fly USDZ) can both open.
 */

export const AR_IDS = ["core", "pss", "bites", "ourglass", "alpenglow"] as const;
export type ArId = (typeof AR_IDS)[number];

export const AR_MODELS: Record<ArId, { title: string; caption: string; src: string }> = {
  core: { title: "The Core", caption: "The neural mind from the hero, on your desk.", src: "/ar-models/core.glb" },
  pss: { title: "Perfect Study Space", caption: "Three floors of a multi-branch study space, desks lighting up.", src: "/ar-models/pss.glb" },
  bites: { title: "Bites by Batore", caption: "A city grid of places, each pin approved by a human.", src: "/ar-models/bites.glb" },
  ourglass: { title: "OurGlass", caption: "Loose conversation falls through; structure collects below.", src: "/ar-models/ourglass.glb" },
  alpenglow: { title: "Alpenglow Global", caption: "Leads arcing home from around the world.", src: "/ar-models/alpenglow.glb" },
};

export const isArId = (v: string): v is ArId => (AR_IDS as readonly string[]).includes(v);
