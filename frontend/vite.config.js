import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Au redéploiement, le nouveau service worker attend : le bandeau MiseAJour propose
      // de recharger (pas de rechargement surprise au milieu d'une saisie). L'élève n'a
      // jamais à réinstaller l'application.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],

      manifest: {
        name: 'Auto-École Khadija',
        short_name: 'Khadija',
        description: "Gestion de l'auto-école : élèves, leçons, examens et paiements.",
        lang: 'fr',
        dir: 'ltr',
        // L'app installée ouvre sur la connexion, pas sur la page vitrine.
        // LoginPage renvoie aussitôt vers le tableau de bord si la session tient.
        start_url: '/login',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f0f2f7',
        theme_color: '#1e3a5f',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Android recadre les icônes « maskable » : variante sans texte.
          { src: '/pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // SPA : toute navigation retombe sur index.html…
        navigateFallback: '/index.html',
        // …sauf l'API et les fichiers servis par Spring Boot.
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/h2-console/],
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // Les polices d'icônes pèsent lourd : on relève le plafond de précache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,

        runtimeCaching: [
          {
            // Photos et documents des élèves : le réseau d'abord, le cache
            // en secours quand la connexion lâche.
            urlPattern: /^\/uploads\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'uploads',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // L'API est authentifiée par JWT : jamais de mise en cache, on
        // risquerait de servir les données d'un autre compte.
      },

      devOptions: { enabled: false },
    }),
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // `vite preview` ne reprend pas le proxy de `server` : il lui faut le sien,
  // sinon les appels /api partent en 404 et la connexion échoue.
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
