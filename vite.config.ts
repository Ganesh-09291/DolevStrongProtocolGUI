import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: '/', // Changed from '' to '/' for better compatibility

  plugins: [react()],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // FIX: Use relative path instead of __dirname
      '@': path.resolve('./src'), 
    },
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
  },

  server: {
    port: 3000,
    open: true,
  },
});