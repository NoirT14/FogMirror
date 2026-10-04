export type Point = { x: number; y: number };
export function coverRect(sw: number, sh: number, dw: number, dh: number) {
  if (Math.min(sw, sh, dw, dh) <= 0) throw new RangeError('Dimensions must be positive');
  const scale = Math.max(dw / sw, dh / sh);
  return { x: (dw - sw * scale) / 2, y: (dh - sh * scale) / 2, width: sw * scale, height: sh * scale };
}
export function pointerPoint(clientX: number, clientY: number, rect: {left: number; top: number; width: number; height: number}, width: number, height: number): Point {
  return { x: (clientX - rect.left) * width / rect.width, y: (clientY - rect.top) * height / rect.height };
}
export function segmentPoints(a: Point, b: Point, spacing: number): Point[] {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1, spacing)));
  return Array.from({length: steps}, (_, i) => ({x: a.x + (b.x - a.x) * (i + 1) / steps, y: a.y + (b.y - a.y) * (i + 1) / steps}));
}
