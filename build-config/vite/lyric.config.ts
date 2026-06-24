import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { aliases, projectRoot } from './aliases'

const parsePort = (value: string | undefined, fallback: number): number => {
  const port = Number.parseInt(value ?? '', 10)
  return Number.isFinite(port) ? port : fallback
}

export default defineConfig({
  root: path.join(projectRoot, 'src/lyric-react'),
  base: './',
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  resolve: {
    alias: aliases,
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    host: process.env.CORAL_DEV_HOST,
    port: parsePort(process.env.CORAL_LYRIC_DEV_PORT, 9081),
    strictPort: true,
  },
  build: {
    outDir: path.join(projectRoot, 'dist'),
    emptyOutDir: false,
    sourcemap: true,
    assetsDir: 'assets',
    reportCompressedSize: false,
    rollupOptions: {
      input: path.join(projectRoot, 'src/lyric-react/lyric.html'),
    },
  },
})
