import { GestureSequence } from './GestureSequence.ts';
type Recognizer = Pick<Awaited<ReturnType<typeof import('./loadRecognizer').loadRecognizer>>, 'close' | 'recognizeForVideo'>;
type Callbacks = {onStatus: (message: string) => void; onTrigger: () => void; onError: () => void};
export class GestureController {
  private generation = 0;
  private recognizer: Recognizer | null = null;
  private timer = 0;
  private sequence = new GestureSequence();
  private callbacks: Callbacks;
  private load: () => Promise<Recognizer>;
  constructor(callbacks: Callbacks, load = async (): Promise<Recognizer> => (await import('./loadRecognizer')).loadRecognizer()) {
    this.callbacks = callbacks; this.load = load;
  }
  async start(video: HTMLVideoElement) {
    this.stop(); const generation = this.generation;
    const recognizer = await this.load();
    if (generation !== this.generation) { recognizer.close(); return false; }
    this.recognizer = recognizer;
    const frame = document.createElement('canvas');
    const context = frame.getContext('2d')!;
    let lastTime = -1, lastHint = '';
    const tick = () => {
      if (generation !== this.generation) return;
      try {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
          const width = Math.max(1, Math.round(video.videoWidth * scale));
          const height = Math.max(1, Math.round(video.videoHeight * scale));
          if (frame.width !== width || frame.height !== height) {frame.width = width; frame.height = height;}
          context.drawImage(video, 0, 0, width, height);
          const now = performance.now();
          const result = recognizer.recognizeForVideo(frame, now);
          const category = result.gestures[0]?.[0];
          const pose = category?.categoryName === 'Closed_Fist' || category?.categoryName === 'Open_Palm' ? category.categoryName : 'None';
          if (this.sequence.update(pose, category?.score ?? 0, now, result.landmarks.length > 0)) this.callbacks.onTrigger();
          const hint = {
            waiting: 'Đưa một bàn tay vào khung hình, nắm lại khoảng 0,5 giây.',
            holding: 'Đang thấy nắm tay · Giữ thêm một chút…',
            armed: 'Đã sẵn sàng · Mở xòe bàn tay trong 2 giây.',
            cooldown: 'Đã phủ sương · Chờ 3 giây trước lần tiếp theo.',
          }[this.sequence.phase];
          if (hint !== lastHint) { this.callbacks.onStatus(hint); lastHint = hint; }
        }
        // At most 8 inferences/sec, with no queued frames; low-resolution input.
        this.timer = window.setTimeout(tick, 125);
      } catch { this.stop(); this.callbacks.onError(); }
    };
    this.timer = window.setTimeout(tick, 0);
    return true;
  }
  stop() {
    this.generation++; window.clearTimeout(this.timer);
    this.recognizer?.close(); this.recognizer = null; this.sequence.reset();
  }
}
