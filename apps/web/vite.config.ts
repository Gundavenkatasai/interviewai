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
})
