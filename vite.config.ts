import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'hls.js': path.resolve(__dirname, 'src/shims/hls.ts'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('1.1.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
