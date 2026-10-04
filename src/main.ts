import './styles.css';
import './responsive.css';
import { GestureController } from './gesture/GestureController';
import { FullscreenController } from './ui/FullscreenController';
import { BreathController, microphoneError } from './audio/BreathController';
import { MirrorRenderer } from './render/MirrorRenderer';
import { PointerBrush } from './input/PointerBrush';
import { CameraController, cameraError } from './camera/CameraController';

const icon = (body: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const cameraIcon = icon('<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>');
const fogIcon = icon('<path d="M3 8h12m-8 4h14M3 16h14"/><path d="M18 8h3M3 12h1m16 4h1"/>');
const cleanIcon = icon('<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3z"/>');
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header"><a class="brand" href="./" aria-label="Fog Mirror trang chủ"><span class="brand-mark">${icon('<path d="M6 21V9a6 6 0 0 1 12 0v12z"/><path d="m9 15 6-6m-6 10 6-6"/>')}</span>fog mirror<span class="brand-dot">.</span></a><span class="edition">A LITTLE SPACE FOR YOURSELF <span>—</span> 001</span></header>
  <main>
    <section class="intro"><div><p class="eyebrow">CHẠM NHẸ. VIẾT CHẬM. THỞ ĐỀU.</p><h1>Một chút <em>sương.</em><br class="mobile-break"/> Một chút riêng.</h1></div><p class="intro-copy">Biến màn hình thành chiếc gương phủ sương.<br/>Viết một điều nhỏ, chỉ dành cho bạn.</p></section>
    <section class="mirror-shell" aria-label="Gương phủ sương tương tác">
      <div class="mirror-stage">
        <canvas id="mirror" aria-label="Giữ và kéo chuột hoặc ngón tay để lau sương. Các nút Lau sạch và Phủ sương lại ở phía dưới." role="img"></canvas>
        <div class="stage-top"><span class="mode-pill"><i></i><span id="mode">KHÔNG GIAN DEMO</span></span><div class="stage-actions"><span class="stage-note">a moment, just for you</span><button id="toggle-controls" type="button" aria-pressed="false">Ẩn điều khiển</button><button id="fullscreen" type="button" aria-label="Toàn màn hình" title="Toàn màn hình" aria-pressed="false">${icon('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>')}<span>Toàn màn hình</span></button></div></div>
        <div class="invitation" id="invitation"><span class="handwritten">hello, you.</span><span class="invitation-rule"></span><p>Giữ & kéo để viết lên sương</p><span class="invitation-small">hoặc bật camera để thấy chính mình</span></div>
        <div id="brush-cursor" hidden></div>
        <div class="stage-bottom"><span id="stage-caption">Một góc bình yên để thử nét đầu tiên.</span><span class="corner-mark">FM / 01</span></div>
      </div>
      <div class="mirror-controls">
      <div class="toolbar">
        <div class="sliders"><label for="brush">NÉT CỌ <output id="brush-value" for="brush">36</output><input id="brush" type="range" min="8" max="80" value="36" aria-label="Kích thước cọ"/></label><span class="divider"></span><label for="fog">LỚP SƯƠNG <output id="fog-value" for="fog">70%</output><input id="fog" type="range" min="0" max="100" value="70" aria-label="Độ sương"/></label></div>
        <div class="tools"><button id="reset" title="Phủ sương lại">${fogIcon}<span>Phủ sương lại</span></button><button id="clear" title="Lau sạch">${cleanIcon}<span>Lau sạch</span></button><span class="divider"></span><button id="camera" class="camera-button">${cameraIcon}<span>Bật camera</span></button></div>
      </div>
      <div class="photo-tools" aria-label="Ảnh và camera"><button id="capture" type="button">Chụp & lưu ảnh</button><button id="switch-camera" type="button" disabled>Đổi camera trước/sau</button><span id="photo-status" role="status" aria-live="polite"></span></div>
      <div class="breath-panel" aria-label="Thổi để phủ sương">
        <div class="breath-heading"><span class="breath-symbol" aria-hidden="true">≈</span><div><strong>Thổi để phủ sương</strong><p id="breath-status" role="status">Bật micro rồi thổi nhẹ về phía micro của máy.</p></div></div>
        <div class="breath-controls"><div id="breath-settings" class="breath-settings" hidden><label for="sensitivity">Độ nhạy <output id="sensitivity-value">50%</output><input id="sensitivity" type="range" min="0" max="100" value="50" aria-label="Độ nhạy tiếng thổi"/></label><meter id="breath-level" min="0" max="1" value="0" aria-label="Mức âm thanh micro"></meter><button id="recalibrate" type="button">Đo lại nền</button></div><button id="breath-toggle" type="button" aria-pressed="false">Bật tiếng thổi</button></div>
      </div>
      <div class="gesture-panel" hidden><div><strong>Cử chỉ bàn tay</strong><p id="gesture-status" role="status">Bật camera, rồi nắm tay → mở xòe để phủ sương.</p></div><button id="gesture-toggle" type="button" aria-pressed="false" disabled>Bật cử chỉ bàn tay</button></div>
      <div id="error" class="error" role="alert" hidden></div>
      </div>
    </section>
    <div class="below-mirror"><p id="status" role="status" aria-live="polite">Đang dùng ảnh demo · Camera chưa bật</p><span class="privacy">${icon('<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')}Hình ảnh & âm thanh chỉ xử lý trên máy</span></div>

  </main>
  <footer><span>Một khoảng lặng giữa những tab đang mở.</span><span>MADE FOR SLOW MOMENTS <span class="footer-spark">✳</span></span></footer>
`;
const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = element<HTMLCanvasElement>('mirror');
const mirrorShell = document.querySelector<HTMLElement>('.mirror-shell')!;
const fullscreen = new FullscreenController(mirrorShell, element<HTMLButtonElement>('fullscreen'));
element('toggle-controls').addEventListener('click', () => {
  const hidden = mirrorShell.classList.toggle('controls-hidden');
  element('toggle-controls').textContent = hidden ? 'Hiện điều khiển' : 'Ẩn điều khiển';
  element('toggle-controls').setAttribute('aria-pressed', String(hidden));
});
const status = element('status'), errorBox = element('error'), mode = element('mode');
const cameraButton = element<HTMLButtonElement>('camera');
const switchButton = element<HTMLButtonElement>('switch-camera');
const captureButton = element<HTMLButtonElement>('capture');
const invitation = element('invitation');
const renderer = new MirrorRenderer(canvas);
const brush = new PointerBrush(renderer, element('brush-cursor'), () => invitation.classList.add('dismissed'));
const demo = new Image();
let active = false, pending = false, requestId = 0;
const camera = new CameraController(() => {
  showDemo(); showError('Kết nối camera đã ngắt. Bạn có thể bật lại khi sẵn sàng.');
});
demo.onload = () => { if (!active) renderer.setSource(demo); };
demo.onerror = () => showError('Không thể tải ảnh demo. Hãy tải lại trang hoặc bật camera.');
demo.src = `${import.meta.env.BASE_URL}demo/quiet-room.svg`;
function showError(message: string) { errorBox.textContent = message; errorBox.hidden = false; }
function hideError() { errorBox.hidden = true; errorBox.textContent = ''; }
function showDemo() {
  stopGesture(); gestureButton.disabled = true;
  requestId++; camera.stop(); active = false; pending = false;
  switchButton.disabled = true; captureButton.disabled = false;
  renderer.setSource(demo); renderer.reset();
  cameraButton.innerHTML = `${cameraIcon}<span>Bật camera</span>`;
  cameraButton.classList.remove('is-active'); cameraButton.setAttribute('aria-pressed', 'false');
  mode.textContent = 'KHÔNG GIAN DEMO'; document.querySelector('.mode-pill')?.classList.remove('live');
  status.textContent = 'Đang dùng ảnh demo · Camera đã tắt';
  element('stage-caption').textContent = 'Một góc bình yên để thử nét đầu tiên.';
}
cameraButton.setAttribute('aria-pressed', 'false');
async function openCamera(facing: 'user' | 'environment' = 'user', switching = false) {
  stopGesture(); gestureButton.disabled = true;
  hideError();
  active = false;
  pending = true; const thisRequest = ++requestId;
  switchButton.disabled = true; captureButton.disabled = true;
  cameraButton.innerHTML = `${cameraIcon}<span>Hủy bật camera</span>`;
  status.textContent = 'Đang chờ quyền camera từ trình duyệt…';
  try {
    if (!await camera.start(facing, switching) || thisRequest !== requestId) return;
    active = true; pending = false; renderer.setSource(camera.video, camera.facing === 'user');
    if (!switching) renderer.reset();
    switchButton.disabled = false; captureButton.disabled = false;
    gestureButton.disabled = false;
    cameraButton.innerHTML = `${cameraIcon}<span>Tắt camera</span>`;
    cameraButton.classList.add('is-active'); cameraButton.setAttribute('aria-pressed', 'true');
    mode.textContent = 'GƯƠNG CỦA BẠN'; document.querySelector('.mode-pill')?.classList.add('live');
    status.textContent = `${camera.facing === 'user' ? 'Camera trước' : 'Camera sau'} đang bật · Giữ và kéo để lau sương`;
    element('stage-caption').textContent = 'Không cần hoàn hảo. Chỉ cần là bạn.';
    invitation.classList.add('dismissed');
  } catch (error) {
    if (!pending || thisRequest !== requestId) return;
    showDemo(); showError(switching ? `Không đổi được camera; đã trở về demo. ${cameraError(error)}` : cameraError(error));
  }
}
cameraButton.addEventListener('click', () => {
  if (active || pending) { hideError(); showDemo(); return; }
  void openCamera();
});
switchButton.addEventListener('click', () => {
  if (active && !pending) void openCamera(camera.facing === 'user' ? 'environment' : 'user', true);
});
captureButton.addEventListener('click', async () => {
  captureButton.disabled = true; hideError();
  try {
    const blob = await renderer.snapshot();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `fog-mirror-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    element('photo-status').textContent = 'Đã tạo ảnh PNG · Xem mục tải xuống của trình duyệt.';
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Không thể lưu ảnh. Hãy thử lại.');
  } finally { captureButton.disabled = pending; }
});
element<HTMLInputElement>('brush').addEventListener('input', e => {
  const value = Number((e.target as HTMLInputElement).value); brush.setSize(value);
  element('brush-value').textContent = `${value}`;
});
element<HTMLInputElement>('fog').addEventListener('input', e => {
  const value = Number((e.target as HTMLInputElement).value); renderer.setFog(value / 100);
  element('fog-value').textContent = `${value}%`;
});
element('reset').addEventListener('click', () => { restoreFog(); status.textContent = 'Đã phủ sương lại · Bắt đầu một nét mới'; });
element('clear').addEventListener('click', () => { renderer.reset(true); invitation.classList.add('dismissed'); status.textContent = 'Đã lau sạch · Bấm Phủ sương lại để viết tiếp'; });
window.addEventListener('pagehide', () => { gesture.stop(); fullscreen.destroy(); breath.stop(); camera.stop(); renderer.destroy(); brush.destroy(); });
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });


const breathButton = element<HTMLButtonElement>('breath-toggle');
const breathStatus = element('breath-status');
const breathSettings = element('breath-settings');
const breathMeter = element<HTMLMeterElement>('breath-level');
let breathActive = false, breathPending = false, breathRequest = 0;
let lastBreathHint = '', detectedUntil = 0;
function breathHint(message: string) {
  if (lastBreathHint !== message) { breathStatus.textContent = message; lastBreathHint = message; }
}
const breath = new BreathController({
  onReading(reading) {
    breathMeter.value = reading.level;
    if (performance.now() < detectedUntil && !reading.calibrating) return;
    breathHint(reading.calibrating
      ? 'Giữ yên 1,6 giây để đo tiếng nền…'
      : 'Đang nghe · Thổi nhẹ về phía micro khoảng nửa giây.');
  },
  onBlow() {
    restoreFog(); invitation.classList.add('dismissed');
    detectedUntil = performance.now() + 1700;
    breathHint('Đã nhận tiếng thổi · Sương đang trở lại.');
    status.textContent = 'Vừa phủ sương bằng tiếng thổi';
  },
  onEnded() { stopBreath(); breathHint('Micro đã ngắt kết nối. Bật lại để tiếp tục.'); },
});
function stopBreath() {
  breathRequest++; breath.stop(); breathActive = breathPending = false;
  breathButton.textContent = 'Bật tiếng thổi'; breathButton.setAttribute('aria-pressed', 'false');
  breathSettings.hidden = true; breathMeter.value = 0;
  breathHint('Micro đã tắt · Bạn vẫn có thể lau và vẽ.');
}
breathButton.addEventListener('click', async () => {
  if (breathActive || breathPending) { stopBreath(); return; }
  breathPending = true; const request = ++breathRequest;
  breathButton.textContent = 'Hủy bật micro';
  breathHint('Đang chờ quyền micro từ trình duyệt…');
  try {
    if (!await breath.start() || request !== breathRequest) return;
    breathActive = true; breathPending = false;
    breathButton.textContent = 'Tắt tiếng thổi'; breathButton.setAttribute('aria-pressed', 'true');
    breathSettings.hidden = false; detectedUntil = 0;
    breathHint('Giữ yên 1,6 giây để đo tiếng nền…');
  } catch (error) {
    if (request !== breathRequest) return;
    stopBreath(); breathHint(microphoneError(error));
  }
});
element<HTMLInputElement>('sensitivity').addEventListener('input', e => {
  const value = Number((e.target as HTMLInputElement).value);
  breath.setSensitivity(value / 100); element('sensitivity-value').textContent = `${value}%`;
});
element('recalibrate').addEventListener('click', () => {
  breath.calibrate(); detectedUntil = 0;
  breathHint('Giữ yên 1,6 giây để đo tiếng nền…');
});
// Stop the microphone when leaving the foreground; returning never silently reopens it.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (breathActive || breathPending)) stopBreath();
  if (document.hidden) stopGesture();
});

const gestureButton = element<HTMLButtonElement>('gesture-toggle');
const gestureStatus = element('gesture-status');
let gestureActive = false, gesturePending = false, gestureRequest = 0;
const gesture = new GestureController({
  onStatus(message) { gestureStatus.textContent = message; },
  onTrigger() { restoreFog(); invitation.classList.add('dismissed'); status.textContent = 'Vừa phủ sương bằng cử chỉ bàn tay'; },
  onError() { stopGesture(); gestureStatus.textContent = 'Không chạy được nhận diện trên thiết bị này. Bạn vẫn có thể dùng nút Phủ sương lại.'; },
});
function stopGesture() {
  gestureRequest++; gesture.stop(); gestureActive = gesturePending = false;
  gestureButton.textContent = 'Bật cử chỉ bàn tay'; gestureButton.setAttribute('aria-pressed', 'false');
  gestureStatus.textContent = 'Cử chỉ đã tắt · Bật camera rồi bật cử chỉ để dùng.';
}
gestureButton.addEventListener('click', async () => {
  if (gestureActive || gesturePending) { stopGesture(); return; }
  if (!active || pending) return;
  const request = ++gestureRequest; gesturePending = true;
  gestureButton.textContent = 'Hủy tải cử chỉ';
  gestureStatus.textContent = 'Đang tải nhận diện bàn tay…';
  try {
    if (!await gesture.start(camera.video) || request !== gestureRequest) return;
    gesturePending = false; gestureActive = true;
    gestureButton.textContent = 'Tắt cử chỉ bàn tay'; gestureButton.setAttribute('aria-pressed', 'true');
    gestureStatus.textContent = 'Đưa một bàn tay vào khung hình, nắm lại khoảng 0,5 giây.';
  } catch {
    if (request !== gestureRequest) return;
    stopGesture(); gestureStatus.textContent = 'Không tải được nhận diện. Hãy thử lại hoặc dùng nút Phủ sương lại.';
  }
});


function restoreFog() {
  if (renderer.amount < .35) {
    renderer.setFog(.7);
    element<HTMLInputElement>('fog').value = '70'; element('fog-value').textContent = '70%';
  }
  renderer.refog();
}

