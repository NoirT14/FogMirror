import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import simdLoader from '../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js?url';
import simdBinary from '../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm?url';
import plainLoader from '../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.js?url';
import plainBinary from '../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm?url';

export async function loadRecognizer() {
  const simd = await FilesetResolver.isSimdSupported();
  return GestureRecognizer.createFromOptions({
    wasmLoaderPath: simd ? simdLoader : plainLoader,
    wasmBinaryPath: simd ? simdBinary : plainBinary,
  }, {
    baseOptions: {modelAssetPath: `${import.meta.env.BASE_URL}models/gesture_recognizer.task`, delegate: 'CPU'},
    runningMode: 'VIDEO', numHands: 1,
    minHandDetectionConfidence: .65, minHandPresenceConfidence: .65, minTrackingConfidence: .65,
  });
}
