import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { shipPresetDefaults } from './src/studio/vite-plugin-ship-defaults.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const shippedFile = path.resolve(root, 'src/app/shippedDefaults.json');

export default defineConfig({
  base: '/coinsncards/',
  plugins: [react(), tailwindcss(), shipPresetDefaults({ root, file: shippedFile })],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
});
