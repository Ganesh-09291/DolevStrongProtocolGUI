import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  // ⭐ REQUIRED FOR VERCEL
  // No subfolder, no trailing slash
  base: '',

  plugins: [react()],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'esnext',

    // ⭐ Vercel automatically serves this output
    outDir: 'build',

    // ⭐ Prevents root-file loading issues
    assetsDir: 'assets',
  },

  server: {
    port: 3000,
    open: true,
  },
});
