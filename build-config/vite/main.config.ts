import fs from 'node:fs/promises';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig, type Plugin } from 'vite';
import { aliases, projectRoot } from './aliases';

const external = [
  'electron',
  'better-sqlite3',
  'font-list',
  'electron-font-manager',
  'bufferutil',
  'utf-8-validate',
  'qrc_decode.node',
  // These 3 codecs use createRequire(import.meta.url)('./src/xxx.wasm.cjs') to load WASM.
  // When bundled to CJS, import.meta.url is rewritten to __filename, breaking the relative
  // path to the .wasm.cjs file. Keeping them external preserves ESM import.meta.url resolution.
  '@audio/decode-aac',
  '@audio/decode-amr',
  '@audio/decode-wma',
  // ffmpeg-static's index.js resolves its binary via path.join(__dirname, 'ffmpeg').
  // Bundling it inlines __dirname as dist/, which breaks the path. Keep it external so
  // Node's require resolves it from node_modules at runtime (works in dev and asar:false builds).
  'ffmpeg-static',
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
];

const copyDir = async (from: string, to: string) => {
  await fs.rm(to, { recursive: true, force: true });
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.cp(from, to, { recursive: true });
};

const copyFile = async (from: string, to: string) => {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
};

const copyRuntimeAssets = (): Plugin => ({
  name: 'copy-coral-runtime-assets',
  apply: 'build',
  async closeBundle() {
    const dist = path.join(projectRoot, 'dist');
    await Promise.all([
      copyDir(path.join(projectRoot, 'src/static'), path.join(dist, 'static')),
      copyDir(path.join(projectRoot, 'src/common/theme/images'), path.join(dist, 'theme_images')),
      copyFile(
        path.join(projectRoot, 'src/main/modules/userApi/renderer/user-api.html'),
        path.join(dist, 'userApi/renderer/user-api.html'),
      ),
    ]);
  },
});

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [copyRuntimeAssets()],
    ssr: {
      target: 'node',
      noExternal: true,
      external,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      appStaticPath: JSON.stringify(path.join(projectRoot, 'src/static')),
      userApiRootPath: JSON.stringify(path.join(projectRoot, 'src/main/modules/userApi')),
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
      sourcemap: isDev,
      minify: false,
      reportCompressedSize: false,
      rollupOptions: {
        input: {
          main: path.join(projectRoot, isDev ? 'src/main/index-dev.ts' : 'src/main/index.ts'),
          'dbService.worker': path.join(projectRoot, 'src/main/worker/dbService/index.ts'),
        },
        external,
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          exports: 'auto',
        },
      },
    },
  };
});
