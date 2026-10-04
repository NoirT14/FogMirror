import { defineConfig } from 'vite';

// GitHub Pages serves this repository below /FogMirror/; localhost stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/FogMirror/' : '/',
}));
