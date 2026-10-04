import { buffer, context } from './canvas';
import { segmentPoints } from '../utils/geometry';
import type { Point } from '../utils/geometry';

export class MaskCanvas {
  readonly canvas = buffer();
  private ctx = context(this.canvas);
  private brush = buffer(128, 128);
  constructor() {
    const c = context(this.brush);
    const g = c.createRadialGradient(64, 64, 48, 64, 64, 64);
    g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  }
  resize(width: number, height: number) {
    const old = buffer(this.canvas.width, this.canvas.height);
    context(old).drawImage(this.canvas, 0, 0);
    this.canvas.width = width; this.canvas.height = height;
    this.ctx.drawImage(old, 0, 0, width, height);
  }
  stroke(from: Point, to: Point, diameter: number) {
    for (const p of segmentPoints(from, to, diameter / 5)) {
      this.ctx.drawImage(this.brush, p.x - diameter / 2, p.y - diameter / 2, diameter, diameter);
    }
  }
  fade(alpha: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, alpha))})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
  reset(clear = false) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (clear) { this.ctx.fillStyle = '#fff'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
  }
}

