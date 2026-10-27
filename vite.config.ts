import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves project pages from /<repo>/; SW and manifest paths
// follow vite's base, so keep them in sync.
const base = process.env.VITE_BASE ?? '/mobileScanner/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        id: '/mobileScanner/',
        name: 'mobileScanner',
        short_name: 'Scanner',
        description: 'Reads QR, Data Matrix and product barcodes with the camera; NFC on Android.',
        scope: '/mobileScanner/',
        start_url: '/mobileScanner/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#101820',
        theme_color: '#101820',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,svg,png}'],
      },
    }),
  ],
});
