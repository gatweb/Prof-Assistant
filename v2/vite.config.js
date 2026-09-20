import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: '../public/v2',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true
  }
});
