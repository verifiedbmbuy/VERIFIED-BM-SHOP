import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.png", "favicon.ico", "pwa-192x192.png", "pwa-512x512.png", "offline.html"],
      manifest: {
        name: "Verified BM Shop",
        short_name: "Verified BM",
        description: "Secure, high-limit Verified Business Managers and WhatsApp Business API solutions. Instant delivery at Verified BM Shop.",
        start_url: "/",
        display: "standalone",
        theme_color: "#2563EB",
        background_color: "#ffffff",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/admin(?:\/|$)/],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/xukkejkvcgixogvbllmf\.supabase\.co/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|svg|gif|ico)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(woff2?|ttf|otf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "esbuild",
    esbuild:
      mode === "production"
        ? {
            drop: ["console", "debugger"],
          }
        : undefined,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("@tanstack")) {
            return "tanstack";
          }

          if (id.includes("@radix-ui")) {
            return "radix";
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("recharts") || id.includes("victory-vendor") || id.includes("d3-")) {
            return "charts";
          }

          if (id.includes("jspdf") || id.includes("html2canvas")) {
            return "pdf";
          }

          if (id.includes("react-markdown") || id.includes("remark-") || id.includes("rehype-") || id.includes("micromark")) {
            return "markdown";
          }
        },
      },
    },
    sourcemap: false,
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    cssMinify: true,
  },
}));
