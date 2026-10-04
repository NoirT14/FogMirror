export type BreathFeatures = { rms: number; flatness: number; lowRatio: number; peakRatio: number };
export type BreathReading = { level: number; calibrating: boolean; triggered: boolean };

/** Local acoustic heuristic, not speech recognition. No audio is retained. */
export function analyseBreath(wave: Float32Array, spectrum: Float32Array, sampleRate: number): BreathFeatures {
  let sum = 0;
  for (const v of wave) sum += v * v;
  const binHz = sampleRate / (spectrum.length * 2);
  let total = 0, low = 0, peak = 0, logSum = 0, count = 0;
  for (let i = Math.max(1, Math.ceil(80 / binHz)); i < Math.min(spectrum.length, Math.ceil(5000 / binHz)); i++) {
    const amplitude = Math.pow(10, Math.max(-120, Number.isFinite(spectrum[i]) ? spectrum[i] : -120) / 20);
    total += amplitude; logSum += Math.log(amplitude); count++;
    if (i * binHz < 700) low += amplitude;
    peak = Math.max(peak, amplitude);
  }
  return {
    rms: Math.sqrt(sum / Math.max(1, wave.length)),
    flatness: count && total ? Math.exp(logSum / count) / (total / count) : 0,
    lowRatio: total ? low / total : 0,
    peakRatio: total ? peak / total : 0,
  };
}

export class BreathGate {
  sensitivity = .5;
  private started: number | null = null;
  private last: number | null = null;
  private baseline: number[] = [];
  private noiseFloor = .003;
  private sustained = 0;
  private quiet = 0;
  private latched = false;
  private cooldownUntil = 0;
  reset() {
    this.started = this.last = null; this.baseline = []; this.noiseFloor = .003;
    this.sustained = this.quiet = 0; this.latched = false; this.cooldownUntil = 0;
  }
  update(features: BreathFeatures, now: number): BreathReading {
    if (this.started === null) this.started = now;
    // A suspended tab must not turn one sample into a sustained blow.
    if (this.last !== null && now - this.last > 200) this.sustained = 0;
    const dt = this.last === null ? 0 : Math.max(0, Math.min(60, now - this.last));
    this.last = now;
    const { rms, flatness, lowRatio, peakRatio } = features;
    if (now - this.started < 1600) {
      this.baseline.push(rms);
      const sorted = [...this.baseline].sort((a, b) => a - b);
      this.noiseFloor = Math.max(.001, sorted[Math.floor(sorted.length * .65)] ?? .003);
      return {level: Math.min(1, rms * 10), calibrating: true, triggered: false};
    }
    const s = Math.max(0, Math.min(1, this.sensitivity));
    const threshold = Math.max(.045 - s * .037, this.noiseFloor * (4.5 - s * 2.8));
    const noiseLike = flatness > .22 || (lowRatio > .55 && peakRatio < .22);
    const candidate = rms > threshold && noiseLike;
    if (candidate) { this.sustained += dt; this.quiet = 0; }
    else {
      this.sustained = Math.max(0, this.sustained - dt * 2);
      this.quiet += dt;
      if (this.quiet >= 300) this.latched = false;
      if (rms < threshold * .7) this.noiseFloor += (rms - this.noiseFloor) * .006;
    }
    const triggered = candidate && this.sustained >= 240 && !this.latched && now >= this.cooldownUntil;
    if (triggered) { this.latched = true; this.cooldownUntil = now + 2000; this.sustained = 0; }
    return {level: Math.min(1, rms / threshold), calibrating: false, triggered};
  }
}
