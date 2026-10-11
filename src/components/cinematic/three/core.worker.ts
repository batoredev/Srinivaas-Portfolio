import { makeCore } from "./coreShapes";

self.onmessage = (e: MessageEvent<{ count: number }>) => {
  const data = makeCore(e.data.count);
  const { brain, shapes } = data;
  // the brain shape shares its buffer with brain.pos, so de-duplicate
  const buffers = new Set<ArrayBuffer>([
    brain.pos.buffer,
    brain.nor.buffer,
    brain.rnd.buffer,
    brain.reg.buffer,
    brain.groove.buffer,
    brain.links.buffer,
    brain.seeds.buffer,
    brain.ends.buffer,
    ...Object.values(shapes).map((a) => a.buffer),
  ] as ArrayBuffer[]);
  (self as unknown as Worker).postMessage(data, [...buffers]);
};
