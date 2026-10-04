import { buffer, context } from './canvas';
import { MaskCanvas } from './MaskCanvas';
import { FogLayer } from './FogLayer';
import { coverRect } from '../utils/geometry';

export class MirrorRenderer {
  readonly mask = new MaskCanvas();
  private ctx: CanvasRenderingContext2D;
  private clear = buffer();
  private clearCtx = context(this.clear);
  private reveal = buffer();
  private revealCtx = context(this.reveal);
  private fog = new FogLayer();
  private source: HTMLImageElement | HTMLVideoElement | null = null;
  private mirrored = false;
  private frame = 0;
  private dirty = true;
  private sourceDirty = true;
  private fogDirty = true;
  private lastVideoTime = -1;
  private observer: ResizeObserver;
  private refogStarted: number | null = null;
  private refogLast = 0;
  amount = .7;
  dpr = 1;
  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = context(canvas);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    document.addEventListener('visibilitychange', this.visibility);
    this.resize(); this.start();
  }
  private visibility = () => { if (document.hidden) cancelAnimationFrame(this.frame); else this.start(); };
  private start() { cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(this.tick); }
  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(devicePixelRatio || 1, 2, 1800 / Math.max(1, r.width));
    const w = Math.max(1, Math.round(r.width * this.dpr)), h = Math.max(1, Math.round(r.height * this.dpr));
    if (w === this.canvas.width && h === this.canvas.height) return;
    for (const c of [this.canvas, this.clear, this.reveal]) { c.width = w; c.height = h; }
    this.mask.resize(w, h); this.fog.resize(w, h);
    this.sourceDirty = this.fogDirty = true; this.invalidate();
  }
  setSource(source: HTMLImageElement | HTMLVideoElement, mirrored = false) {
    this.source = source; this.mirrored = mirrored; this.lastVideoTime = -1; this.sourceDirty = true; this.invalidate();
  }
  invalidate() { this.dirty = true; }
  async snapshot(): Promise<Blob> {
    const s = this.source;
    if (!s || (s instanceof HTMLVideoElement ? s.readyState < 2 : !s.complete || !s.naturalWidth)) {
      throw new Error('Hình ảnh chưa sẵn sàng. Hãy đợi một chút rồi chụp lại.');
    }
    cancelAnimationFrame(this.frame);
    this.dirty = true;
    this.tick(performance.now());
    return new Promise((resolve, reject) => this.canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Không thể tạo ảnh. Hãy thử lại.'));
    }, 'image/png'));
  }
  setFog(value: number) { this.amount = value; this.fogDirty = true; this.invalidate(); }
  reset(clear = false) { this.refogStarted = null; this.mask.reset(clear); this.invalidate(); }
  refog() {
    this.refogStarted = this.refogLast = performance.now();
    this.invalidate();
  }
  private tick = (now: number) => {
    if (document.hidden) return;
    if (this.refogStarted !== null) {
      const dt = Math.max(0, now - this.refogLast);
      this.refogLast = now;
      if (now - this.refogStarted >= 1100) { this.mask.reset(); this.refogStarted = null; }
      else this.mask.fade(1 - Math.exp(-dt / 240));
      this.dirty = true;
    }
    const s = this.source;
    if (s) {
      const video = s instanceof HTMLVideoElement;
      const ready = video ? s.readyState >= 2 : s.complete && s.naturalWidth > 0;
      const changed = this.sourceDirty || (video && s.currentTime !== this.lastVideoTime);
      if (ready && (this.dirty || changed)) {
        const w = this.canvas.width, h = this.canvas.height;
        if (changed) {
          const sw = video ? s.videoWidth : s.naturalWidth, sh = video ? s.videoHeight : s.naturalHeight;
          const r = coverRect(sw, sh, w, h), c = this.clearCtx;
          c.save(); c.clearRect(0, 0, w, h);
          if (this.mirrored) { c.translate(w, 0); c.scale(-1, 1); }
          c.drawImage(s, r.x, r.y, r.width, r.height); c.restore();
        }
        // Mask changes alone do not recompute blur. Both layers use the same video frame.
        if (changed || this.fogDirty) this.fog.draw(this.clear, this.amount, this.dpr);
        const t = this.revealCtx;
        t.clearRect(0, 0, w, h); t.drawImage(this.clear, 0, 0);
        t.globalCompositeOperation = 'destination-in'; t.drawImage(this.mask.canvas, 0, 0);
        t.globalCompositeOperation = 'source-over';
        if (this.amount === 0) this.ctx.drawImage(this.clear, 0, 0);
        else { this.ctx.drawImage(this.fog.canvas, 0, 0, w, h); this.ctx.drawImage(this.reveal, 0, 0); }
        if (video) this.lastVideoTime = s.currentTime;
        this.dirty = this.sourceDirty = this.fogDirty = false;
      }
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  destroy() { cancelAnimationFrame(this.frame); this.observer.disconnect(); document.removeEventListener('visibilitychange', this.visibility); }
}


