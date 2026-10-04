import { analyseBreath, BreathGate } from './breathSignal.ts';
import type { BreathReading } from './breathSignal.ts';

type Callbacks = { onReading: (reading: BreathReading) => void; onBlow: () => void; onEnded: () => void };
export class BreathController {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frame = 0;
  private generation = 0;
  private gate = new BreathGate();
  private callbacks: Callbacks;
  constructor(callbacks: Callbacks) { this.callbacks = callbacks; }
  setSensitivity(value: number) { this.gate.sensitivity = Math.max(0, Math.min(1, value)); }
  calibrate() { this.gate.reset(); }
  async start() {
    this.stop();
    const generation = this.generation;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      throw new Error('Micro cần HTTPS hoặc localhost và trình duyệt hỗ trợ Web Audio.');
    }
    // Create/resume within the button gesture, before awaiting permission.
    const context = new AudioContext();
    this.context = context;
    try {
      await context.resume();
      if (generation !== this.generation) return false;
      const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: {
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      }});
      if (generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false; }
      this.stream = stream;
      stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => {
        if (this.stream === stream) { this.stop(); this.callbacks.onEnded(); }
      }, {once: true}));
      const source = context.createMediaStreamSource(stream), analyser = context.createAnalyser();
      this.source = source; this.analyser = analyser;
      analyser.fftSize = 2048; analyser.smoothingTimeConstant = .25;
      source.connect(analyser); // Deliberately no speaker/destination connection.
      const wave = new Float32Array(analyser.fftSize);
      const spectrum = new Float32Array(analyser.frequencyBinCount);
      let lastSample = -Infinity;
      const sample = (now: number) => {
        if (generation !== this.generation) return;
        if (!document.hidden && now - lastSample >= 30 && context.state === 'running') {
          lastSample = now;
          analyser.getFloatTimeDomainData(wave); analyser.getFloatFrequencyData(spectrum);
          const reading = this.gate.update(analyseBreath(wave, spectrum, context.sampleRate), now);
          this.callbacks.onReading(reading);
          if (reading.triggered) this.callbacks.onBlow();
        }
        this.frame = requestAnimationFrame(sample);
      };
      this.frame = requestAnimationFrame(sample);
      return true;
    } catch (error) {
      if (generation !== this.generation) return false;
      this.stop(); throw error;
    }
  }
  stop() {
    this.generation++; cancelAnimationFrame(this.frame);
    this.source?.disconnect(); this.analyser?.disconnect();
    this.source = null; this.analyser = null;
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = null;
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.context = null; this.gate.reset();
  }
}
export function microphoneError(error: unknown) {
  if (error instanceof DOMException) {
    const messages: Record<string, string> = {
      NotAllowedError: 'Chưa được cấp quyền micro. Cho phép micro trong trình duyệt rồi bấm Bật tiếng thổi để thử lại.',
      NotFoundError: 'Không tìm thấy micro. Bạn vẫn có thể dùng nút Phủ sương lại.',
      NotReadableError: 'Micro đang bận hoặc không mở được. Hãy kiểm tra thiết bị thu âm rồi thử lại.',
    };
    return messages[error.name] ?? 'Không mở được micro. Bạn vẫn có thể lau và vẽ bình thường.';
  }
  return error instanceof Error ? error.message : 'Không mở được micro.';
}
