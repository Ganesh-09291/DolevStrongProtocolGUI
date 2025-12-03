import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: '',  // ⭐ VERY IMPORTANT for Vercel (no / at start or end)

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'build', // ✔ Vercel auto-detects
    assetsDir: 'assets',
  },
});
