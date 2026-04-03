import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:     resolve(__dirname, 'index.html'),
        login:    resolve(__dirname, 'login.html'),
        employee: resolve(__dirname, 'employee.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: '/login.html',
  },
});
