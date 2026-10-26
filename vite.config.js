import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        confirmar: resolve(__dirname, 'confirmar.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});