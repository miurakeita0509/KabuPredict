import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/KabuPredict/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tensorflow: ['@tensorflow/tfjs'],
          recharts: ['recharts'],
        },
      },
    },
  },
});
