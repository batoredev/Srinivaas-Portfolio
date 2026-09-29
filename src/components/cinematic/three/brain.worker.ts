import { makeBrain } from "./brainGen";

self.onmessage = (e: MessageEvent<{ count: number }>) => {
  const data = makeBrain(e.data.count);
  (self as unknown as Worker).postMessage(data, [
    data.pos.buffer,
    data.nor.buffer,
    data.rnd.buffer,
    data.reg.buffer,
    data.groove.buffer,
    data.links.buffer,
    data.seeds.buffer,
    data.ends.buffer,
  ]);
};
