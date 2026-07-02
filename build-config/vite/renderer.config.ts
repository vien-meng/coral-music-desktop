import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aliases, projectRoot } from './aliases';

const parsePort = (value: string | undefined, fallback: number): number => {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isFinite(port) ? port : fallback;
};

const getManualChunk = (id: string): string | undefined => {
  if (!id.includes('node_modules')) return undefined;
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
  if (/[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/.test(id)) return 'vendor-icons';
  if (
    /[\\/]node_modules[\\/]@ant-design[\\/](cssinjs|cssinjs-utils|colors|fast-color)[\\/]/.test(id)
  )
    return 'vendor-antd-runtime';
  const antdComponent = id.match(/[\\/]node_modules[\\/]antd[\\/](?:es|lib)[\\/]([^\\/]+)/)?.[1];
  if (antdComponent) return `vendor-antd-${antdComponent}`;
  if (/[\\/]node_modules[\\/]antd[\\/]/.test(id)) return 'vendor-antd-core';
  if (/[\\/]node_modules[\\/](rc-|@rc-component)[\\/]/.test(id)) return 'vendor-rc';
  if (/[\\/]node_modules[\\/](mobx|mobx-react-lite)[\\/]/.test(id)) return 'vendor-state';
  return 'vendor';
};

// 移除 Vite 生成的 crossorigin 属性，避免 file:// 协议下模块脚本加载失败
const removeCrossoriginPlugin = () => ({
  name: 'remove-crossorigin',
  enforce: 'post',
  transformIndexHtml(html: string) {
    return html.replace(/\s+crossorigin(=["'][^"']*["'])?/gi, '');
  },
});

export default defineConfig({
  root: path.join(projectRoot, 'src/renderer-react'),
  base: './',
  plugins: [react(), removeCrossoriginPlugin()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  resolve: {
    alias: {
      ...aliases,
      '@eshaz/web-worker': path.join(projectRoot, 'src/renderer-react/shims/web-worker.ts'),
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
    port: parsePort(process.env.CORAL_RENDERER_DEV_PORT, 9080),
    strictPort: true,
  },
  optimizeDeps: {
    include: ['crypto-js'],
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
      input: path.join(projectRoot, 'src/renderer-react/index.html'),
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
});
