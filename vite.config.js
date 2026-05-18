import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      /**
       * Mantiene el código de la app al día. Los datos offline siguen viviendo
       * en Dexie; el bundle JS no debería quedar atascado con bugs ya corregidos.
       */
      registerType: "autoUpdate",

      /** Incluir assets que deben pre-cachearse junto al bundle */
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "favicon.ico"],

      /**
       * Manifest completo de la PWA
       */
      manifest: {
        name: "Tienda Nancy POS",
        short_name: "Tienda Nancy",
        description: "Sistema POS offline-first para gestión de ventas, inventario y clientes",
        theme_color: "#4f46e5",
        background_color: "#020617",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "es",
        orientation: "any",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [],
      },

      /**
       * Configuración de Workbox
       * IMPORTANTE: Supabase NO debe cachearse para no contaminar ventas con datos obsoletos.
       */
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        /** Precacheo del build completo (JS/CSS/HTML estático) */
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        /**
         * NavigationFallback: cuando el usuario navega offline
         * devuelve el index.html cacheado para que React tome el control.
         */
        navigateFallback: "index.html",

        /** Rutas que NUNCA deben ir al caché. Primordialmente Supabase. */
        navigateFallbackDenylist: [
          /^\/api\//,
          /supabase\.co/,
        ],

        /**
         * Runtime caching: estrategias por tipo de recurso
         */
        runtimeCaching: [
          /**
           * Supabase API: SIEMPRE va por red, nunca de caché.
           * Si falla => el código de Dexie maneja el fallback offline.
           */
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },

          /**
           * Imágenes de productos (pueden estar en Storage de Supabase o locales):
           * StaleWhileRevalidate — sirve lo cacheado, actualiza en background.
           */
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
              },
            },
          },

          /**
           * Google Fonts (si se añaden en el futuro): StaleWhileRevalidate
           */
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts" },
          },
        ],
      },
    }),
  ],
});
