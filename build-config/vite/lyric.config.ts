import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aliases, projectRoot } from './aliases';

const parsePort = (value: string | undefined, fallback: number): number => {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isFinite(port) ? port : fallback;
};

const getManualChunk = (id: string): string | undefined => {
  if (!id.includes('node_modules')) {
    if (/[\\/]src[\\/]common[\\/]utils[\\/]lyric-font-player[\\/]/.test(id))
      return 'lyric-font-player';
    return undefined;
  }
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
    return 'lyric-vendor-react';
  if (/[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/.test(id)) return 'lyric-vendor-icons';
  if (
    /[\\/]node_modules[\\/]@ant-design[\\/](cssinjs|cssinjs-utils|colors|fast-color)[\\/]/.test(id)
  )
    return 'lyric-vendor-antd-runtime';
  const antdComponent = id.match(/[\\/]node_modules[\\/]antd[\\/](?:es|lib)[\\/]([^\\/]+)/)?.[1];
  if (antdComponent) return `lyric-vendor-antd-${antdComponent}`;
  if (/[\\/]node_modules[\\/]antd[\\/]/.test(id)) return 'lyric-vendor-antd-core';
  if (/[\\/]node_modules[\\/](rc-|@rc-component)[\\/]/.test(id)) return 'lyric-vendor-rc';
  if (/[\\/]node_modules[\\/](mobx|mobx-react-lite)[\\/]/.test(id)) return 'lyric-vendor-state';
  return 'lyric-vendor';
};

const removeCrossoriginPlugin = () => ({
  name: 'remove-crossorigin',
  enforce: 'post',
  transformIndexHtml(html: string) {
    return html.replace(/\s+crossorigin(=["'][^"']*["'])?/gi, '');
  },
});

export default defineConfig({
  root: path.join(projectRoot, 'src/lyric-react'),
  base: './',
  plugins: [react(), removeCrossoriginPlugin()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  resolve: {
    alias: {
      ...aliases,
      react: path.join(projectRoot, 'node_modules/react'),
      'react-dom': path.join(projectRoot, 'node_modules/react-dom'),
      'mobx-react-lite': path.join(projectRoot, 'node_modules/mobx-react-lite'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      'mobx-react-lite',
    ],
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    host: process.env.CORAL_DEV_HOST,
    port: parsePort(process.env.CORAL_LYRIC_DEV_PORT, 9081),
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'mobx-react-lite', 'mobx'],
    force: true,
  },
  legacy: {
    inconsistentCjsInterop: true,
  },
  build: {
    outDir: path.join(projectRoot, 'dist'),
    emptyOutDir: false,
    sourcemap: true,
    assetsDir: 'assets',
    reportCompressedSize: false,
    rollupOptions: {
      input: path.join(projectRoot, 'src/lyric-react/lyric.html'),
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
});
