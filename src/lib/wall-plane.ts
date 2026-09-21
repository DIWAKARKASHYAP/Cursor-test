export type Plane = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Fraction of the plane width removed from each side of the top edge. */
  topInset: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function wallToScreen(u: number, v: number, plane: Plane): ScreenPoint {
  const vv = clamp(v, 0, 1);
  const uu = clamp(u, 0, 1);
  const inset = plane.topInset * (1 - vv);
  const rowWidth = plane.width * (1 - inset * 2);
  const rowX = plane.x + plane.width * inset;
  return {
    x: rowX + uu * rowWidth,
    y: plane.y + vv * plane.height,
  };
}

export function screenToWall(
  x: number,
  y: number,
  plane: Plane,
): { u: number; v: number } | null {
  if (plane.width <= 0 || plane.height <= 0) return null;
  const v = (y - plane.y) / plane.height;
  if (v < -1e-6 || v > 1 + 1e-6) return null;
  const inset = plane.topInset * (1 - clamp(v, 0, 1));
  const rowWidth = plane.width * (1 - inset * 2);
  if (rowWidth <= 0) return null;
  const rowX = plane.x + plane.width * inset;
  const u = (x - rowX) / rowWidth;
  if (u < -1e-6 || u > 1 + 1e-6) return null;
  return { u: clamp(u, 0, 1), v: clamp(v, 0, 1) };
}

export function snapToCell(u: number, v: number, cols: number, rows: number) {
  return {
    col: Math.min(cols - 1, Math.max(0, Math.floor(u * cols))),
    row: Math.min(rows - 1, Math.max(0, Math.floor(v * rows))),
  };
}

export function coverSourceRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
) {
  const srcAspect = srcW / Math.max(1, srcH);
  const dstAspect = dstW / Math.max(1, dstH);
  if (srcAspect > dstAspect) {
    const h = srcH;
    const w = srcH * dstAspect;
    return { x: (srcW - w) / 2, y: 0, w, h };
  }
  const w = srcW;
  const h = srcW / dstAspect;
  return { x: 0, y: (srcH - h) / 2, w, h };
}

export function smoothBounds(
  previous: { x: number; y: number; width: number; height: number } | null,
  next: { x: number; y: number; width: number; height: number },
  alpha = 0.28,
) {
  if (!previous) return { ...next };
  const mix = (from: number, to: number) => from + (to - from) * alpha;
  return {
    x: mix(previous.x, next.x),
    y: mix(previous.y, next.y),
    width: mix(previous.width, next.width),
    height: mix(previous.height, next.height),
  };
}
