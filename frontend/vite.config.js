import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': path.resolve('./src'),
        },
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'],
    },

    server: {
        port: 5173,
        host: true
    },

    // ─── Preview Server (vite preview) ───────────────────────────────────────
    // Sets Cache-Control headers for hashed assets when using `vite preview`.
    // For production (Nginx / Netlify / Vercel), configure headers at the CDN layer:
    //
    //  Nginx:
    //   location /assets/ {
    //     add_header Cache-Control "public, max-age=31536000, immutable";
    //   }
    //
    //  Netlify (_headers file in /public/):
    //   /assets/*
    //     Cache-Control: public, max-age=31536000, immutable
    //
    //  Vercel (vercel.json):
    //   { "headers": [{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }] }
    //
    preview: {
        headers: {
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    },

    build: {
        // Target modern browsers (good for PWA / Capacitor)
        target: 'es2020',

        // Increase the warning limit to reduce noise; chunks above 600 KB are flagged
        chunkSizeWarningLimit: 600,

        rollupOptions: {
            output: {
                /**
                 * Manual chunk splitting:
                 * Each heavy vendor library gets its own cached chunk so the browser
                 * only re-downloads the chunk that changed after an update.
                 */
                manualChunks: {
                    // React core — rarely changes
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],

                    // Firebase — large SDK, load separately
                    'vendor-firebase': ['firebase/app', 'firebase/auth'],

                    // Supabase — large SDK, load separately
                    'vendor-supabase': ['@supabase/supabase-js'],

                    // Recharts — heavy chart library, only needed on Reports pages
                    'vendor-recharts': ['recharts'],
                }
            }
        }
    }
})

