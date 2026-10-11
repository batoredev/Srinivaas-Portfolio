/*
 * Brain-region callouts shown beside the Core in the hero. Kept free of three
 * so the hero can import it without pulling in the 3D bundle; the Core scene
 * positions the elements registered here every frame.
 */

/**
 * `normal` points out of the surface at the anchor; a label shows only while
 * it faces the camera. `side` pins which side of its dot the label sits on,
 * so neighbouring labels don't collide.
 */
export type BrainLabel = { name: string; note: string; anchor: [number, number, number]; normal: [number, number, number]; side?: "left" | "right" };

export const BRAIN_LABELS: BrainLabel[] = [
  { name: "Frontal lobe", note: "product thinking", anchor: [0.64, 0.24, 0.5], normal: [0.55, 0.3, 0.78] },
  { name: "Parietal lobe", note: "systems design", anchor: [0.65, 0.42, -0.3], normal: [0.62, 0.78, -0.1] },
  { name: "Temporal lobe", note: "listening to owners", anchor: [0.64, -0.32, 0.2], normal: [0.95, -0.25, 0.2], side: "left" },
  { name: "Occipital lobe", note: "interface design", anchor: [0.58, 0.06, -0.78], normal: [0.5, 0.15, -0.85] },
  { name: "Cerebellum", note: "infra & ops · balance", anchor: [0.4, -0.4, -0.66], normal: [0.7, -0.45, -0.55] },
  { name: "Brain stem", note: "keeps servers breathing", anchor: [0.06, -0.62, -0.27], normal: [0.55, -0.35, 0.75], side: "right" },
];

export const labelEls: (HTMLDivElement | null)[] = [];

/** Colours the Core can be retrained into; index = retrain count. */
export const CORE_TINTS = ["#4fe3ff", "#a78bfa", "#5dffb5", "#ff6b9a", "#ffd166", "#ffb547"];
