import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@interview-ai/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@interview-ai/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@interview-ai/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@interview-ai/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@interview-ai/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('superdoc') || id.includes('@superdoc')) {
              return 'superdoc-vendor';
            }
            if (id.includes('pdfjs-dist') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
              return 'monaco-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
              return 'react-core';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'state-vendor';
            }
          }
        },
      },
    },
  },
})
