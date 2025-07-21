import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      process: 'process/browser'
    }
  },
  optimizeDeps: {
    include: [
      'algosdk',
      '@perawallet/connect',
      'buffer',
      'crypto-browserify',
      'stream-browserify',
      'util',
      'process'
    ]
  }
})