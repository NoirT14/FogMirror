export class CameraController {
  readonly video = document.createElement('video');
  private stream: MediaStream | null = null;
  private generation = 0;
  private onEnded: () => void;
  constructor(onEnded: () => void) { this.onEnded = onEnded; this.video.muted = true; this.video.playsInline = true; this.video.autoplay = true; }
  facing: 'user' | 'environment' = 'user';
  async start(facing: 'user' | 'environment' = 'user', exact = false) {
    this.stop();
    const generation = this.generation;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera cần HTTPS hoặc localhost. Bạn vẫn có thể thử bằng ảnh demo.');
    const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: exact ? {exact: facing} : {ideal: facing}, width: {ideal: 1280}, height: {ideal: 720}}, audio: false});
    if (generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false; }
    this.stream = stream; this.video.srcObject = stream;
    const actual = stream.getVideoTracks()[0]?.getSettings?.().facingMode;
    this.facing = actual === 'user' || actual === 'environment' ? actual : facing;
    stream.getVideoTracks().forEach(t => t.addEventListener('ended', () => {
      if (this.stream === stream) { this.stop(); this.onEnded(); }
    }, {once: true}));
    try {
      await this.video.play();
      if (generation !== this.generation) return false;
      return true;
    } catch (error) { if (generation === this.generation) this.stop(); throw error; }
  }
  stop() { this.generation++; this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.video.pause(); this.video.srcObject = null; }
}
export function cameraError(error: unknown) {
  if (error instanceof DOMException) {
    const messages: Record<string, string> = {
      NotAllowedError: 'Chưa được cấp quyền camera. Hãy cho phép camera trong trình duyệt rồi thử lại, hoặc tiếp tục với ảnh demo.',
      NotFoundError: 'Không tìm thấy camera. Bạn vẫn có thể viết trên ảnh demo.',
      NotReadableError: 'Camera đang bận hoặc không thể mở. Hãy đóng ứng dụng đang dùng camera rồi thử lại.',
      OverconstrainedError: 'Camera không đáp ứng được cấu hình. Hãy thử camera khác.',
      AbortError: 'Camera bị gián đoạn. Bạn có thể bật lại khi sẵn sàng.'
    };
    return messages[error.name] ?? 'Không thể mở camera. Hãy thử lại hoặc dùng ảnh demo.';
  }
  return error instanceof Error ? error.message : 'Không thể mở camera.';
}

