import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    server: {
        port: 5173,
        host: true
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
