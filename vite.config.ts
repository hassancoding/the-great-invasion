import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico}',
          'assets/menu/**/*',
          'assets/sprites/arin/arin_sprites.png',
          'assets/sprites/arin/arin_atlas.json',
          'assets/sprites/arin/arin_portrait.png',
          'assets/env/halcyon/backgrounds/fortress/*.png',
          'assets/env/halcyon/props/fortress/*.png',
        ],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'The Great Invasion',
        short_name: 'TGI',
        description: 'Hold the line. Claim the Well.',
        theme_color: '#0a0620',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    host: true,
  },
});
