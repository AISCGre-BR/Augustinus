import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@augustinus/core': path.resolve(__dirname, '../core/src'),
    },
  },
  optimizeDeps: {
    include: ['separador-silabas'],
  },
  plugins: [
    vue(),
  ]
});