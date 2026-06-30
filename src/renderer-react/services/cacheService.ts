import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const getCacheSize = async (): Promise<number> => {
  if (!isElectronRenderer()) return 0;
  try {
    const result = await ipcClient.invoke(ipcChannels.winMain.getCacheSize);
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const clearCache = async (): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.clearCache);
  } catch (err) {
    console.error(err);
  }
};

export const getOtherSourceCount = async (): Promise<number> => {
  if (!isElectronRenderer()) return 0;
  try {
    const result = await ipcClient.invoke(ipcChannels.winMain.getOtherSourceCount);
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const clearOtherSource = async (): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.clearOtherSource);
  } catch (err) {
    console.error(err);
  }
};

export const getCachedOtherSource = async (id: string): Promise<Coral.Music.MusicInfoOnline[]> => {
  if (!isElectronRenderer()) return [];
  try {
    const result = await ipcClient.invoke(ipcChannels.winMain.getOtherSource, id);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const saveCachedOtherSource = async (
  id: string,
  list: Coral.Music.MusicInfoOnline[],
): Promise<void> => {
  if (!isElectronRenderer() || !list.length) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.saveOtherSource, {
      id,
      list,
    });
  } catch (err) {
    console.error(err);
  }
};

export const getMusicUrlCount = async (): Promise<number> => {
  if (!isElectronRenderer()) return 0;
  try {
    const result = await ipcClient.invoke(ipcChannels.winMain.getMusicUrlCount);
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const clearMusicUrl = async (): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.clearMusicUrl);
  } catch (err) {
    console.error(err);
  }
};

export const createMusicUrlCacheKey = (
  musicInfo: Coral.Music.MusicInfo,
  quality: Coral.Quality,
): string => `${musicInfo.id}_${quality}`;

export const getCachedMusicUrl = async (
  musicInfo: Coral.Music.MusicInfo,
  quality: Coral.Quality,
): Promise<string> => {
  if (!isElectronRenderer()) return '';
  try {
    const result = await ipcClient.invoke(
      ipcChannels.winMain.getMusicUrl,
      createMusicUrlCacheKey(musicInfo, quality),
    );
    return typeof result === 'string' ? result : '';
  } catch (err) {
    console.error(err);
    return '';
  }
};

export const saveCachedMusicUrl = async (
  musicInfo: Coral.Music.MusicInfo,
  quality: Coral.Quality,
  url: string,
): Promise<void> => {
  if (!isElectronRenderer() || !url) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.saveMusicUrl, {
      id: createMusicUrlCacheKey(musicInfo, quality),
      url,
    });
  } catch (err) {
    console.error(err);
  }
};

export const getLyricRawCount = async (): Promise<number> => {
  if (!isElectronRenderer()) return 0;
  try {
    const result = await ipcClient.invoke(ipcChannels.winMain.getLyricRawCount);
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const clearLyricRaw = async (): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.clearLyricRaw);
  } catch (err) {
    console.error(err);
  }
};

export const getLyricEditedCount = async (): Promise<number> => {
  if (!isElectronRenderer()) return 0;
  try {
    const result = await ipcClient.invoke(ipcChannels.winMain.getLyricEditedCount);
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const clearLyricEdited = async (): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    await ipcClient.invoke(ipcChannels.winMain.clearLyricEdited);
  } catch (err) {
    console.error(err);
  }
};

export const showSaveDialog = async (
  options: Electron.SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => {
  if (!isElectronRenderer()) return { canceled: true, filePath: '' };
  try {
    return await ipcClient.invoke(ipcChannels.winMain.showSaveDialog, options);
  } catch (err) {
    console.error(err);
    return { canceled: true, filePath: '' };
  }
};

export const cacheService = {
  clearCache,
  clearLyricEdited,
  clearLyricRaw,
  clearMusicUrl,
  clearOtherSource,
  createMusicUrlCacheKey,
  getCacheSize,
  getCachedOtherSource,
  getCachedMusicUrl,
  getLyricEditedCount,
  getLyricRawCount,
  getMusicUrlCount,
  getOtherSourceCount,
  saveCachedMusicUrl,
  saveCachedOtherSource,
  showSaveDialog,
};
