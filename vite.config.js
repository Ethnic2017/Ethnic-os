import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Group heavy, rarely-changing vendors into their own cacheable chunks.
        // Page-level chunks are created automatically by the React.lazy() imports
        // in pages.config.js.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'motion': ['framer-motion'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
})
