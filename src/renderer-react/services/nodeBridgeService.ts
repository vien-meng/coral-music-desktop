import type * as Fs from 'node:fs';
import type * as FsPromises from 'node:fs/promises';
import type * as Path from 'node:path';
import type * as Zlib from 'node:zlib';

interface NodeRequire {
  (moduleName: 'node:fs'): typeof Fs;
  (moduleName: 'node:fs/promises'): typeof FsPromises;
  (moduleName: 'node:path'): typeof Path;
  (moduleName: 'node:zlib'): typeof Zlib;
}

interface NodeGlobal {
  require?: NodeRequire;
}

const getNodeRequire = (): NodeRequire => {
  const nodeRequire = (globalThis as typeof globalThis & NodeGlobal).require;
  if (!nodeRequire) throw new Error('Node require is unavailable in the current renderer context.');
  return nodeRequire;
};

const getFs = () => getNodeRequire()('node:fs');
const getFsPromises = () => getNodeRequire()('node:fs/promises');
const getPath = () => getNodeRequire()('node:path');
const getZlib = () => getNodeRequire()('node:zlib');

export const joinPath = (...paths: string[]): string => getPath().join(...paths);
export const basename = (filePath: string, ext?: string): string =>
  getPath().basename(filePath, ext);
export const dirname = (filePath: string): string => getPath().dirname(filePath);
export const extname = (filePath: string): string => getPath().extname(filePath);

export interface DirectoryEntry {
  filePath: string;
  isDirectory: boolean;
  isFile: boolean;
  name: string;
}

export const checkPath = async (filePath: string): Promise<boolean> => {
  if (!filePath) return false;
  return await getFsPromises()
    .access(filePath, getFs().constants.F_OK)
    .then(() => true)
    .catch(() => false);
};

export const readFile = async (filePath: string): Promise<Buffer> =>
  await getFsPromises().readFile(filePath);

export const isDirectory = async (filePath: string): Promise<boolean> =>
  await getFsPromises()
    .stat(filePath)
    .then((stats) => stats.isDirectory())
    .catch(() => false);

export const readDirectory = async (dirPath: string): Promise<DirectoryEntry[]> => {
  const entries = await getFsPromises().readdir(dirPath, { withFileTypes: true });
  return entries.map((entry) => ({
    filePath: joinPath(dirPath, entry.name),
    isDirectory: entry.isDirectory(),
    isFile: entry.isFile(),
    name: entry.name,
  }));
};

export const copyFile = async (source: string, target: string): Promise<void> => {
  await getFsPromises().mkdir(getPath().dirname(target), { recursive: true });
  await getFsPromises().copyFile(source, target);
};

export const moveFile = async (source: string, target: string): Promise<void> => {
  await getFsPromises().mkdir(getPath().dirname(target), { recursive: true });
  await getFsPromises().rename(source, target);
};

export const removeFile = async (filePath: string): Promise<void> => {
  await getFsPromises()
    .unlink(filePath)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
};

export const saveStrToFile = async (filePath: string, content: string | Buffer): Promise<void> => {
  await getFsPromises().writeFile(filePath, content);
};

export const saveLxConfigFile = async (filePath: string, data: unknown): Promise<void> => {
  const targetPath = filePath.endsWith('.lxmc') ? filePath : `${filePath}.lxmc`;
  const content = await new Promise<Buffer>((resolve, reject) => {
    getZlib().gzip(JSON.stringify(data), (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
  await getFsPromises().writeFile(targetPath, content);
};

export const readLxConfigFile = async (filePath: string): Promise<unknown> => {
  const isJSON = filePath.endsWith('.json');
  const rawContent = await getFsPromises().readFile(filePath, isJSON ? 'utf8' : undefined);
  if (!rawContent) return rawContent;

  const content = isJSON
    ? String(rawContent)
    : await new Promise<string>((resolve, reject) => {
        const binaryContent = Buffer.isBuffer(rawContent) ? rawContent : Buffer.from(rawContent);
        getZlib().gunzip(binaryContent, (error, result) => {
          if (error) reject(error);
          else resolve(result.toString());
        });
      });

  const parsed = JSON.parse(content);
  if (typeof parsed !== 'object') {
    try {
      return JSON.parse(parsed);
    } catch {
      return parsed;
    }
  }
  return parsed;
};
