import { ipcChannels, type IpcDownloadTaskAction } from '@shared/ipc/contracts';
import { toOldMusicInfo } from '@common/utils/tools';
import { createDownloadTaskList } from './downloadTaskFactory';
import { ipcClient } from './ipc/client';
import { lyricService } from './lyricService';
import { resolvePlayableMusicUrl } from './playerRuntime/musicUrlResolver';
import { createWebDavStreamUrl } from './webDavService';

type ElectronShellGlobal = typeof globalThis & {
  require?: (moduleName: 'electron') => {
    shell: {
      showItemInFolder: (fullPath: string) => void;
    };
  };
};

export const getDownloadTasks = async (): Promise<Coral.Download.ListItem[]> => {
  if (!ipcClient.canUseIpc()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.downloadListGet);
};

export const createDownloadTasks = async (
  list: Coral.Music.MusicInfoOnline[],
  quality: Coral.Quality,
  fileNameFormat: string,
  qualityList: Coral.QualityList,
  listId?: string,
): Promise<Coral.Download.ListItem[]> => {
  if (!ipcClient.canUseIpc()) return [];

  const tasks = createDownloadTaskList(list, quality, fileNameFormat, qualityList, listId);

  if (tasks.length) {
    const action: Coral.Download.saveDownloadMusicInfo = {
      list: tasks,
      addMusicLocationType: 'top',
    };
    await ipcClient.invoke(ipcChannels.winMain.downloadListAdd, action);
  }

  return tasks;
};

export const addDownloadTasks = async (tasks: Coral.Download.ListItem[]): Promise<void> => {
  if (!ipcClient.canUseIpc() || !tasks.length) return;
  await ipcClient.invoke(ipcChannels.winMain.downloadListAdd, {
    addMusicLocationType: 'top',
    list: tasks,
  });
};

export const removeDownloadTasks = async (ids: string[]): Promise<void> => {
  if (!ipcClient.canUseIpc()) return;

  await ipcClient.invoke(ipcChannels.winMain.downloadListRemove, ids);
};

export const clearDownloadTasks = async (): Promise<void> => {
  if (!ipcClient.canUseIpc()) return;
  await ipcClient.invoke(ipcChannels.winMain.downloadListClear);
};

export const updateDownloadTasks = async (tasks: Coral.Download.ListItem[]): Promise<void> => {
  if (!ipcClient.canUseIpc()) return;
  await ipcClient.invoke(ipcChannels.winMain.downloadListUpdate, tasks);
};

export const openDownloadTaskFile = (filePath: string): void => {
  const electronRequire = (globalThis as ElectronShellGlobal).require;
  electronRequire?.('electron').shell.showItemInFolder(filePath);
};

interface StartDownloadTaskOptions {
  ensureLyric?: boolean;
  isRefresh?: boolean;
  isRetry?: boolean;
}

interface MusicSdkSource {
  getLyric?: (
    musicInfo: unknown,
    isGetLyricx?: boolean,
  ) => { promise: Promise<Coral.Music.LyricInfo> };
}

type MusicSdk = Record<string, unknown>;

const loadMusicSdk = async (): Promise<MusicSdk> => {
  const module = await import('./musicSdk/sdk');
  return module.default as MusicSdk;
};

const getSourceSdk = (sdk: MusicSdk, source: Coral.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source];
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null;
  return sourceSdk as MusicSdkSource;
};

const hasLyricContent = (lyricInfo: Coral.Music.LyricInfo): boolean =>
  [lyricInfo.lyric, lyricInfo.lxlyric, lyricInfo.tlyric, lyricInfo.rlyric].some(Boolean);

const isOnlineMusicInfo = (
  musicInfo: Coral.Music.MusicInfo,
): musicInfo is Coral.Music.MusicInfoOnline =>
  musicInfo.source !== 'local' && musicInfo.source !== 'webdav';

export const ensureDownloadLyricCached = async (task: Coral.Download.ListItem): Promise<void> => {
  const musicInfo = task.metadata.musicInfo;
  if (!isOnlineMusicInfo(musicInfo)) return;
  const cachedLyric = await lyricService.getLyricRaw(musicInfo);
  if (hasLyricContent(cachedLyric)) return;

  const sdk = await loadMusicSdk();
  const request = getSourceSdk(sdk, musicInfo.source)?.getLyric?.(toOldMusicInfo(musicInfo), true);
  if (!request) return;

  const lyricInfo = await request.promise;
  if (!hasLyricContent(lyricInfo)) return;
  await lyricService.saveLyricRaw(musicInfo, lyricInfo);
};

export const startDownloadTask = async (
  task: Coral.Download.ListItem,
  options: StartDownloadTaskOptions = {},
): Promise<Coral.Download.ListItem> => {
  if (!ipcClient.canUseIpc()) return task;

  if (options.ensureLyric) {
    await ensureDownloadLyricCached(task).catch(() => {});
  }

  const musicInfo = task.metadata.musicInfo;
  const resolved =
    musicInfo.source === 'webdav'
      ? {
          quality: task.metadata.quality,
          url: (
            await createWebDavStreamUrl({
              accountId: musicInfo.meta.accountId,
              href: musicInfo.meta.href,
            })
          ).url,
        }
      : await resolvePlayableMusicUrl(task, {
          isRefresh: options.isRefresh ?? options.isRetry,
          preferredQuality: task.metadata.quality,
        });
  if (!resolved?.url) throw new Error('无法获取下载地址');

  const params = {
    isRetry: options.isRetry,
    task: {
      ...task,
      metadata: {
        ...task.metadata,
        quality: resolved.quality,
        url: resolved.url,
      },
    },
    url: resolved.url,
  };

  return await ipcClient.invoke(
    options.isRetry ? ipcChannels.winMain.downloadTaskRetry : ipcChannels.winMain.downloadTaskStart,
    params,
  );
};

export const pauseDownloadTask = async (
  taskId: string,
): Promise<Coral.Download.ListItem | null> => {
  if (!ipcClient.canUseIpc()) return null;
  return await ipcClient.invoke(ipcChannels.winMain.downloadTaskPause, taskId);
};

export const onDownloadTaskAction = (
  listener: (action: IpcDownloadTaskAction) => void,
): (() => void) => {
  if (!ipcClient.canUseIpc()) return () => {};
  return ipcClient.on(ipcChannels.winMain.downloadTaskAction, listener);
};
