import { pointerPoint } from '../utils/geometry.ts';
import type { Point } from '../utils/geometry';
import type { MirrorRenderer } from '../render/MirrorRenderer';

export class PointerBrush {
  size = 36;
  private pointer: number | null = null;
  private last: Point | null = null;
  private abort = new AbortController();
  private renderer: MirrorRenderer;
  private cursor: HTMLElement;
  private onDraw: () => void;
  constructor(renderer: MirrorRenderer, cursor: HTMLElement, onDraw: () => void) {
    this.renderer = renderer; this.cursor = cursor; this.onDraw = onDraw;
    const canvas = renderer.canvas, signal = this.abort.signal;
    canvas.addEventListener('pointerdown', e => {
      if (this.pointer !== null || e.button !== 0) return;
      this.pointer = e.pointerId; canvas.setPointerCapture(e.pointerId); this.last = this.point(e);
      this.paint(this.last, this.last); this.onDraw(); e.preventDefault();
    }, {signal});
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      cursor.style.left = `${e.clientX - r.left}px`; cursor.style.top = `${e.clientY - r.top}px`;
      cursor.hidden = e.pointerType === 'touch';
      if (this.pointer !== e.pointerId || !this.last) return;
      const events = e.getCoalescedEvents?.() ?? [e];
      for (const sample of events.length ? events : [e]) {
        const p = this.point(sample); this.paint(this.last, p); this.last = p;
      }
    }, {signal});
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) canvas.addEventListener(name, e => {
      if (e.pointerId !== this.pointer) return;
      this.pointer = null; this.last = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      cursor.hidden = true;
    }, {signal});
    canvas.addEventListener('pointerleave', () => { cursor.hidden = true; }, {signal});
    this.setSize(this.size);
  }
  private point(e: PointerEvent) { return pointerPoint(e.clientX, e.clientY, this.renderer.canvas.getBoundingClientRect(), this.renderer.canvas.width, this.renderer.canvas.height); }
  private paint(a: Point, b: Point) { this.renderer.mask.stroke(a, b, this.size * this.renderer.dpr); this.renderer.invalidate(); }
  setSize(value: number) { this.size = value; this.cursor.style.width = this.cursor.style.height = `${value}px`; }
  destroy() { this.abort.abort(); }
}
