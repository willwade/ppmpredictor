import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'docs',
  base: './',
  build: {
    outDir: '../docs-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'docs/index.html'),
        demo: resolve(__dirname, 'docs/demo.html')
      }
    }
  },
  server: {
    port: 8080,
    open: '/demo.html'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'assert': resolve(__dirname, 'src/polyfills/assert.js')
    }
  }
});

