import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Strait Outta Hormuz',
        short_name: 'Strait Outta',
        description: 'Steer a tanker 167 km through the Strait of Hormuz in this arcade naval action game',
        theme_color: '#0a1628',
        background_color: '#0a1628',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
});
