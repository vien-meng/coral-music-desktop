import path from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
import { aliases, projectRoot } from './aliases';

const external = ['electron', ...builtinModules, ...builtinModules.map((name) => `node:${name}`)];

export default defineConfig(({ mode }) => ({
  ssr: {
    target: 'node',
    noExternal: true,
    external,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
  },
  resolve: {
    alias: aliases,
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json', '.node'],
  },
  build: {
    target: 'node22',
    ssr: true,
    outDir: path.join(projectRoot, 'dist'),
    emptyOutDir: false,
    sourcemap: mode === 'development',
    minify: mode !== 'development',
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        'user-api-preload': path.join(projectRoot, 'src/main/modules/userApi/renderer/preload.js'),
      },
      external,
      output: {
        format: 'cjs',
        entryFileNames: '[name].js',
        exports: 'auto',
      },
    },
  },
}));
