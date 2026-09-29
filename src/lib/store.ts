"use client";

import { useSyncExternalStore } from "react";
import type { SectionId } from "@/data/content";

type State = {
  /** Section currently centred in the viewport. */
  active: SectionId;
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
};

const initial: State = {
  active: "hero",
  audio: false,
  engaged: false,
  handoff: false,
  synapses: 0,
  visited: 0,
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
