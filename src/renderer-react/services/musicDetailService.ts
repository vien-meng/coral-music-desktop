import { appService } from './appService';

interface MusicDetailSdkSource {
  getMusicDetailPageUrl?: (musicInfo: Coral.Music.MusicInfo) => string | undefined;
}

type MusicSdk = Record<string, unknown>;

let musicSdkPromise: Promise<MusicSdk> | null = null;

const loadMusicSdk = async (): Promise<MusicSdk> => {
  musicSdkPromise ??= import('./musicSdk/sdk').then((module) => module.default as MusicSdk);
  return await musicSdkPromise;
};

const getDetailPageUrl = async (musicInfo: Coral.Music.MusicInfo): Promise<string | null> => {
  if (
    typeof musicInfo.source !== 'string' ||
    musicInfo.source === 'local' ||
    musicInfo.source === 'webdav'
  )
    return null;

  const musicSdk = await loadMusicSdk();
  const sdk = musicSdk[musicInfo.source];
  if (typeof sdk !== 'object' || sdk == null || Array.isArray(sdk)) return null;

  const sourceSdk = sdk as MusicDetailSdkSource;
  if (typeof sourceSdk.getMusicDetailPageUrl !== 'function') return null;

  const url = sourceSdk.getMusicDetailPageUrl(musicInfo);
  return url ?? null;
};

export const openMusicDetail = async (musicInfo: Coral.Music.MusicInfo): Promise<void> => {
  const url = await getDetailPageUrl(musicInfo);
  if (!url) return;

  await appService.openUrl(url);
};

export const musicDetailService = {
  getDetailPageUrl,
  openMusicDetail,
};
