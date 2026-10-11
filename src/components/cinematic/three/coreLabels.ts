/*
 * Brain-region callouts shown beside the Core in the hero. Kept free of three
 * so the hero can import it without pulling in the 3D bundle; the Core scene
 * positions the elements registered here every frame.
 */

export type BrainLabel = { name: string; note: string; anchor: [number, number, number] };

export const BRAIN_LABELS: BrainLabel[] = [
  { name: "Frontal lobe", note: "product thinking", anchor: [0.22, 0.34, 0.8] },
  { name: "Parietal lobe", note: "systems design", anchor: [0.34, 0.6, -0.2] },
  { name: "Temporal lobe", note: "listening to owners", anchor: [0.66, -0.26, 0.28] },
  { name: "Occipital lobe", note: "interface design", anchor: [0.24, 0.16, -0.9] },
  { name: "Cerebellum", note: "infra & ops · balance", anchor: [0.3, -0.46, -0.66] },
  { name: "Brain stem", note: "keeps servers breathing", anchor: [0.0, -0.86, -0.38] },
];

export const labelEls: (HTMLDivElement | null)[] = [];

/** Colours the Core can be retrained into; index = retrain count. */
export const CORE_TINTS = ["#4fe3ff", "#a78bfa", "#5dffb5", "#ff6b9a", "#ffd166", "#ffb547"];
