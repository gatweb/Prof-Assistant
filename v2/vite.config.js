import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: '../public',
    emptyOutDir: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-firestore', test: /node_modules[\\/]@?firebase[\\/]firestore/ },
            { name: 'vendor-firebase', test: /node_modules[\\/]@?firebase/ },
            { name: 'vendor-katex', test: /node_modules[\\/]katex/ },
            { name: 'vendor-markdown', test: /node_modules[\\/](marked|dompurify)/ },
            { name: 'vendor-alpine', test: /node_modules[\\/]alpinejs/ },
            { name: 'data-fmttn', test: /src[\\/]data[\\/]/ },
            { name: 'workspace-teacher', test: /src[\\/](stores[\\/](teacher|classroom|studio)|services[\\/]classroomService)/ }
          ]
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
