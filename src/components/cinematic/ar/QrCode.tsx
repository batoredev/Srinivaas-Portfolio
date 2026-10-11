"use client";

import qrcode from "qrcode-generator";
import { useMemo } from "react";

/** A crisp SVG QR code: one path, holographic colours, quiet zone included. */
export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let path = "";
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c + 2},${r + 2}h1v1h-1z`;
    return { d: path, n: count + 4 };
  }, [value]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={`QR code for ${value}`} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#e2fbff" />
      <path d={d} fill="#020409" />
    </svg>
  );
}
