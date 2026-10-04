import { buffer, context } from './canvas';

export class FogLayer {
  readonly canvas = buffer();
  private ctx = context(this.canvas);
  private tiny = buffer();
  private tinyCtx = context(this.tiny);
  private noise = buffer(160, 160);
  constructor() {
    const c = context(this.noise), data = c.createImageData(160, 160);
    for (let i = 0; i < data.data.length; i += 4) {
      const value = Math.random() > .5 ? 255 : 90;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
      data.data[i + 3] = Math.floor(Math.random() * 6);
    }
    c.putImageData(data, 0, 0);
  }
  resize(w: number, h: number) { this.canvas.width = Math.max(1, Math.round(w / 3)); this.canvas.height = Math.max(1, Math.round(h / 3)); }
  draw(source: HTMLCanvasElement, amount: number, dpr: number) {
    const c = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const blur = amount * 24 * dpr / 3;
    c.fillStyle = '#c7cec4'; c.fillRect(0, 0, w, h);
    if (amount === 0) { c.drawImage(source, 0, 0, w, h); return; }
    if (typeof c.filter === 'string') {
      c.filter = `blur(${blur}px)`;
      // Keep exactly the same crop as the sharp source; underlying opaque source fills edges.
      c.drawImage(source, 0, 0, w, h);
      c.filter = 'none';
    } else {
      this.tiny.width = Math.max(8, Math.round(w / 16)); this.tiny.height = Math.max(8, Math.round(h / 16));
      this.tinyCtx.drawImage(source, 0, 0, this.tiny.width, this.tiny.height);
      c.drawImage(this.tiny, 0, 0, w, h);
    }
    c.fillStyle = `rgba(229,235,232,${amount * .7})`; c.fillRect(0, 0, w, h);
    const pattern = c.createPattern(this.noise, 'repeat');
    if (pattern) { c.fillStyle = pattern; c.fillRect(0, 0, w, h); }
  }
}



