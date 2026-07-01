import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { bassDecoderExtensions } from '@shared/playbackCapabilities';

export interface BassBundleInfo {
  addonFiles: string[];
  coreFiles: string[];
  helperPath: string;
  platformDir: string;
  rootDir: string;
}

const getPlatformDirName = (): string => {
  const arch = process.arch === 'ia32' ? 'x86' : process.arch;
  return `${process.platform}-${arch}`;
};

const getBassRootDir = (): string => {
  const resourcesRoot = process.resourcesPath || app.getAppPath();
  const packagedRoot = path.join(resourcesRoot, 'native', 'bass');
  const devRoot = path.join(app.getAppPath(), 'resources', 'native', 'bass');
  return app.isPackaged ? packagedRoot : devRoot;
};

const getHelperFileName = (): string =>
  process.platform === 'win32' ? 'coral-bass-decoder.exe' : 'coral-bass-decoder';

const fileExists = async (filePath: string): Promise<boolean> => {
  const stats = await fs.stat(filePath).catch(() => null);
  return Boolean(stats?.isFile());
};

const listExistingFiles = async (directory: string, fileNames: string[]): Promise<string[]> => {
  const files = await Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(directory, fileName);
      return (await fileExists(filePath)) ? filePath : null;
    }),
  );
  return files.filter(Boolean) as string[];
};

const getBassCoreFileNames = (): string[] => {
  switch (process.platform) {
    case 'win32':
      return ['bass.dll'];
    case 'darwin':
      return ['libbass.dylib'];
    default:
      return ['libbass.so'];
  }
};

const getBassAddonFileNames = (): string[] => {
  switch (process.platform) {
    case 'win32':
      return [
        'bass_aac.dll',
        'bassape.dll',
        'bassdsd.dll',
        'bassflac.dll',
        'bass_mpc.dll',
        'bassopus.dll',
        'basstta.dll',
        'basswebm.dll',
        'basswv.dll',
      ];
    case 'darwin':
      return [
        'libbass_aac.dylib',
        'libbassape.dylib',
        'libbassdsd.dylib',
        'libbassflac.dylib',
        'libbass_mpc.dylib',
        'libbassopus.dylib',
        'libbasstta.dylib',
        'libbasswebm.dylib',
        'libbasswv.dylib',
      ];
    default:
      return [
        'libbass_aac.so',
        'libbassape.so',
        'libbassdsd.so',
        'libbassflac.so',
        'libbass_mpc.so',
        'libbassopus.so',
        'libbasstta.so',
        'libbasswebm.so',
        'libbasswv.so',
      ];
  }
};

export const getBassDecoderExtensions = (): string[] => [...bassDecoderExtensions];

export const resolveBassBundle = async (): Promise<BassBundleInfo> => {
  const rootDir = getBassRootDir();
  const platformDir = path.join(rootDir, getPlatformDirName());
  const helperPath = path.join(platformDir, getHelperFileName());
  const [coreFiles, addonFiles] = await Promise.all([
    listExistingFiles(platformDir, getBassCoreFileNames()),
    listExistingFiles(platformDir, getBassAddonFileNames()),
  ]);

  return {
    addonFiles,
    coreFiles,
    helperPath,
    platformDir,
    rootDir,
  };
};

export const assertBassBundleReady = async (): Promise<BassBundleInfo> => {
  const bundle = await resolveBassBundle();
  const missing: string[] = [];

  if (!(await fileExists(bundle.helperPath))) missing.push(path.basename(bundle.helperPath));
  if (!bundle.coreFiles.length) missing.push(getBassCoreFileNames().join(' / '));
  if (!bundle.addonFiles.length) missing.push('BASS add-ons');

  if (missing.length) {
    throw new Error(
      `内置 BASS 解码器资源不完整：${missing.join('、')}。请确认打包资源目录包含 BASS native 与 add-ons。`,
    );
  }

  return bundle;
};
