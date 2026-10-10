import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/** Stage 1 — Phaser + TypeScript + Vite browser build */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@phaser': path.resolve(__dirname, 'src/phaser'),
    },
  },
  build: {
    outDir: 'dist-game',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'assets/**/*'],
      manifest: {
        name: 'The Great Invasion',
        short_name: 'Great Invasion',
        description: 'Hold the line. Claim the Well. Riftlands sector runner.',
        theme_color: '#060b1a',
        background_color: '#060b1a',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
      },
    }),
  ],
});
