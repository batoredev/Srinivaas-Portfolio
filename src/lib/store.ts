"use client";

import { useSyncExternalStore } from "react";
import type { SectionId } from "@/data/content";
import type { ArId } from "@/components/cinematic/ar/arCatalog";

type State = {
  /** Section currently centred in the viewport. */
  active: SectionId;
  /** The prologue (between the hero and chapter one) is centred. */
  prologue: boolean;
  /** Visitor opted into sound. */
  audio: boolean;
  /** Boot gate dismissed and the interface engaged. */
  engaged: boolean;
  /** Professional-mode handoff dialog open. */
  handoff: boolean;
  /** Synapse pulses fired by the hero brain this session. */
  synapses: number;
  /** Chapters the visitor has reached so far. */
  visited: number;
  /** Prologue beat counter: each new beat makes the Core pulse. */
  beat: number;
  /** "Retrain the Core" presses: each one re-seeds its weights. */
  retrain: number;
  /** Replays: each one re-ignites the Core from scattered particles. */
  reignite: number;
  /** Hologram open in the "place it in your room" AR dialog. */
  ar: ArId | null;
};

const initial: State = {
  active: "hero",
  prologue: false,
  audio: false,
  engaged: false,
  handoff: false,
  synapses: 0,
  visited: 0,
  beat: 0,
  retrain: 0,
  reignite: 0,
  ar: null,
};

let state: State = initial;
const listeners = new Set<() => void>();

export function setStore(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getStore() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(initial),
  );
}
