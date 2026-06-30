import { encodePath } from '@common/utils/common';
import {
  isExternalDecoderExtension,
  isNativeLocalAudioExtension,
  normalizeAudioExtension,
} from '@shared/playbackCapabilities';
import { cacheService } from '../cacheService';
import { externalDecoderService } from '../externalDecoderService';
import { musicSdkRuntime } from '../musicSdkRuntime';
import { getPreferredOnlineMusicQuality } from '../musicQualityService';
import { checkPath } from '../nodeBridgeService';
import { settingService } from '../settingService';
import { createWebDavStreamUrl } from '../webDavService';
import {
  canDecodeLocalAudioExtension,
  decodeLocalAudioToObjectUrl,
  type DecodedAudioData,
} from './localAudioDecodeService';
import type { PlayerRuntimeMusicInfo } from './types';

const TOO_MANY_REQUESTS_MESSAGE = 'too many requests';

const pendingOtherSourcePromises = new Map<string, Promise<Coral.Music.MusicInfoOnline[]>>();
const otherSourceCache = new Map<string, Coral.Music.MusicInfoOnline[]>();
const nativeAudioSupportCache = new Map<string, boolean>();

const localAudioMimeTypes: Record<string, string[]> = {
  aac: ['audio/aac', 'audio/mp4'],
  flac: ['audio/flac', 'audio/x-flac'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  mp3: ['audio/mpeg'],
  ogg: ['audio/ogg; codecs="vorbis"', 'audio/ogg'],
  opus: ['audio/ogg; codecs="opus"', 'audio/opus'],
  wav: ['audio/wav', 'audio/wave', 'audio/x-wav'],
};

interface MusicUrlResult {
  type: Coral.Quality;
  url: string;
}

interface MusicUrlRequest {
  promise: Promise<MusicUrlResult>;
}

interface MusicSdkSource {
  getMusicUrl?: (musicInfo: unknown, quality: Coral.Quality) => MusicUrlRequest;
}

interface MusicSdk {
  findMusic?: (musicInfo: {
    albumName: string;
    interval: string;
    name: string;
    singer: string;
    source: string;
  }) => Promise<unknown[]>;
  [source: string]: unknown;
}

const loadMusicSdk = async (): Promise<MusicSdk> => {
  await musicSdkRuntime.sync();
  const module = await import('../musicSdk/sdk');
  return module.default as MusicSdk;
};

const isDownloadMusicInfo = (
  musicInfo: PlayerRuntimeMusicInfo,
): musicInfo is Coral.Download.ListItem => 'progress' in musicInfo && 'metadata' in musicInfo;

const getFileExtension = (filePath: string): string => {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return normalizeAudioExtension(fileName.slice(dotIndex + 1));
};

const canNativeAudioPlayExtension = (extension: string): boolean => {
  const normalized = normalizeAudioExtension(extension);
  const cached = nativeAudioSupportCache.get(normalized);
  if (cached != null) return cached;

  if (!isNativeLocalAudioExtension(normalized)) {
    nativeAudioSupportCache.set(normalized, false);
    return false;
  }

  const AudioConstructor = globalThis.window?.Audio;
  if (!AudioConstructor) {
    nativeAudioSupportCache.set(normalized, false);
    return false;
  }

  const audio = new AudioConstructor();
  const mimeTypes = localAudioMimeTypes[normalized] ?? [`audio/${normalized}`];
  const canPlay = mimeTypes.some((type) => audio.canPlayType(type) !== '');
  nativeAudioSupportCache.set(normalized, canPlay);
  return canPlay;
};

const toOldPlayableMusicInfo = (
  musicInfo: Coral.Music.MusicInfoOnline,
): Record<string, unknown> => {
  const oldMusicInfo: Record<string, unknown> = {
    albumName: musicInfo.meta.albumName,
    img: musicInfo.meta.picUrl ?? '',
    interval: musicInfo.interval,
    name: musicInfo.name,
    singer: musicInfo.singer,
    songmid: musicInfo.meta.songId,
    source: musicInfo.source,
    typeUrl: {},
    types: musicInfo.meta.qualitys,
    _types: musicInfo.meta._qualitys,
  };

  switch (musicInfo.source) {
    case 'kg':
      oldMusicInfo.hash = musicInfo.meta.hash;
      break;
    case 'tx':
      oldMusicInfo.albumMid = musicInfo.meta.albumMid;
      oldMusicInfo.songId = musicInfo.meta.id;
      oldMusicInfo.strMediaMid = musicInfo.meta.strMediaMid;
      break;
    case 'mg':
      oldMusicInfo.copyrightId = musicInfo.meta.copyrightId;
      oldMusicInfo.lrcUrl = musicInfo.meta.lrcUrl;
      oldMusicInfo.mrcUrl = musicInfo.meta.mrcUrl;
      oldMusicInfo.trcUrl = musicInfo.meta.trcUrl;
      break;
  }

  if ('albumId' in musicInfo.meta) oldMusicInfo.albumId = musicInfo.meta.albumId;

  return oldMusicInfo;
};

const toOnlineMusicInfo = (musicInfo: unknown): Coral.Music.MusicInfoOnline | null => {
  if (typeof musicInfo !== 'object' || musicInfo == null) return null;

  const oldMusicInfo = musicInfo as Record<string, any>;
  const source = oldMusicInfo.source;
  const songId = oldMusicInfo.songmid;
  if (typeof source !== 'string' || !songId) return null;

  const meta: Record<string, unknown> = {
    _qualitys: oldMusicInfo._types ?? {},
    albumId: oldMusicInfo.albumId,
    albumName: oldMusicInfo.albumName ?? '',
    picUrl: oldMusicInfo.img ?? '',
    qualitys: oldMusicInfo.types ?? [],
    songId,
  };
  const newMusicInfo = {
    id: `${source}_${songId}`,
    interval: oldMusicInfo.interval ?? '',
    meta,
    name: oldMusicInfo.name ?? '',
    singer: oldMusicInfo.singer ?? '',
    source: source as Coral.OnlineSource,
  };

  switch (source) {
    case 'kg':
      meta.hash = oldMusicInfo.hash;
      newMusicInfo.id = `${songId}_${oldMusicInfo.hash}`;
      break;
    case 'tx':
      meta.albumMid = oldMusicInfo.albumMid;
      meta.id = oldMusicInfo.songId;
      meta.strMediaMid = oldMusicInfo.strMediaMid;
      break;
    case 'mg':
      meta.copyrightId = oldMusicInfo.copyrightId;
      meta.lrcUrl = oldMusicInfo.lrcUrl;
      meta.mrcUrl = oldMusicInfo.mrcUrl;
      meta.trcUrl = oldMusicInfo.trcUrl;
      break;
  }

  return newMusicInfo as unknown as Coral.Music.MusicInfoOnline;
};

export interface ResolvedPlaybackUrl {
  decodedAudio?: DecodedAudioData;
  decodedFilePath?: string;
  objectUrl?: string;
  musicInfo: PlayerRuntimeMusicInfo;
  quality: Coral.Quality;
  source: 'cache' | 'download' | 'fresh' | 'local' | 'webdav';
  url: string;
}

export interface ResolvePlayableMusicUrlOptions {
  allowFresh?: boolean;
  allowToggleSource?: boolean;
  isRefresh?: boolean;
  onToggleSource?: (musicInfo?: Coral.Music.MusicInfoOnline) => void;
  preferredQuality?: Coral.Quality;
}

export const resolveLocalMusicUrl = (musicInfo?: PlayerRuntimeMusicInfo): string | null => {
  if (!musicInfo || isDownloadMusicInfo(musicInfo) || musicInfo.source !== 'local') return null;

  const filePath = musicInfo.meta.filePath.trim();
  if (!filePath) return null;
  const extension = getFileExtension(filePath);
  if (canDecodeLocalAudioExtension(extension)) return null;
  if (!canNativeAudioPlayExtension(extension)) return null;

  return encodePath(filePath);
};

export const canPlayWithLocalRuntime = (musicInfo?: PlayerRuntimeMusicInfo): boolean => {
  if (!musicInfo || isDownloadMusicInfo(musicInfo) || musicInfo.source !== 'local') return false;

  const extension = getFileExtension(musicInfo.meta.filePath);
  return (
    canNativeAudioPlayExtension(extension) ||
    canDecodeLocalAudioExtension(extension) ||
    isExternalDecoderExtension(extension)
  );
};

const resolveInternalDecodedPath = async (
  filePath: string,
): Promise<{ decodedAudio: DecodedAudioData; objectUrl: string; url: string } | null> => {
  const normalizedFilePath = filePath.trim();
  if (!normalizedFilePath) return null;

  const extension = getFileExtension(normalizedFilePath);
  if (!canDecodeLocalAudioExtension(extension)) return null;

  const decoded = await decodeLocalAudioToObjectUrl(normalizedFilePath, extension);
  if (!decoded) return null;

  return {
    decodedAudio: decoded.audioData,
    objectUrl: decoded.objectUrl,
    url: decoded.url,
  };
};

const resolveExternalDecodedPath = async (
  filePath: string,
): Promise<{ decodedFilePath: string; url: string } | null> => {
  const normalizedFilePath = filePath.trim();
  if (!normalizedFilePath) return null;

  const extension = getFileExtension(normalizedFilePath);
  if (!isExternalDecoderExtension(extension)) return null;

  const setting = await settingService.getAppSetting();
  if (
    !setting?.['player.externalDecoder.enabled'] ||
    setting['player.externalDecoder.provider'] === 'none'
  ) {
    throw new Error(
      `本地 ${extension.toUpperCase()} 文件需要外部解码器，请在“设置 > 本地解码”启用 FFmpeg。`,
    );
  }

  if (
    !setting['player.externalDecoder.extensions'].map(normalizeAudioExtension).includes(extension)
  ) {
    throw new Error(
      `当前外部解码器未启用 ${extension.toUpperCase()} 扩展，请在“设置 > 本地解码”加入该扩展。`,
    );
  }

  const result = await externalDecoderService.transcodeExternalDecoder({
    executablePath:
      setting['player.externalDecoder.executablePath'] ||
      (setting['player.externalDecoder.provider'] === 'ffmpeg' ? 'ffmpeg' : ''),
    inputPath: normalizedFilePath,
    output: setting['player.externalDecoder.preferredOutput'],
    provider: setting['player.externalDecoder.provider'],
    timeoutMs: setting['player.externalDecoder.timeoutMs'],
  });

  return {
    decodedFilePath: result.outputPath,
    url: encodePath(result.outputPath),
  };
};

const resolveExternalDecodedLocalMusicUrl = async (
  musicInfo: PlayerRuntimeMusicInfo,
): Promise<{ decodedFilePath: string; url: string } | null> => {
  if (isDownloadMusicInfo(musicInfo) || musicInfo.source !== 'local') return null;
  return resolveExternalDecodedPath(musicInfo.meta.filePath);
};

export const resolveDownloadMusicUrl = async (
  musicInfo: Coral.Download.ListItem,
  isRefresh = false,
): Promise<{
  decodedAudio?: DecodedAudioData;
  decodedFilePath?: string;
  objectUrl?: string;
  url: string;
} | null> => {
  if (isRefresh || !musicInfo.isComplate || /\.ape$/i.test(musicInfo.metadata.fileName))
    return null;
  if (musicInfo.metadata.filePath && (await checkPath(musicInfo.metadata.filePath))) {
    const extension = getFileExtension(musicInfo.metadata.filePath);
    const internalDecoded = await resolveInternalDecodedPath(musicInfo.metadata.filePath);
    if (internalDecoded) return internalDecoded;

    if (canNativeAudioPlayExtension(extension)) {
      return { url: encodePath(musicInfo.metadata.filePath) };
    }

    const decoded = await resolveExternalDecodedPath(musicInfo.metadata.filePath);
    if (decoded) return decoded;
  }

  return null;
};

export const getPreferredPlayQuality = (
  preferredQuality: Coral.Quality,
  musicInfo: Coral.Music.MusicInfoOnline,
): Coral.Quality => getPreferredOnlineMusicQuality(preferredQuality, musicInfo);

const getSourceSdk = (sdk: MusicSdk, source: Coral.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source];
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null;
  return sourceSdk as MusicSdkSource;
};

export const fetchFreshOnlineMusicUrl = async (
  musicInfo: Coral.Music.MusicInfoOnline,
  quality: Coral.Quality,
): Promise<MusicUrlResult> => {
  const sdk = await loadMusicSdk();
  const request = getSourceSdk(sdk, musicInfo.source)?.getMusicUrl?.(
    toOldPlayableMusicInfo(musicInfo),
    quality,
  );
  if (!request) throw new Error(`music url source not found: ${musicInfo.source}`);

  const result = await request.promise;
  if (!result.url) throw new Error('music url is empty');
  return result;
};

const createOtherSourceCacheKey = (musicInfo: Coral.Music.MusicInfoOnline): string =>
  `${musicInfo.source}_${musicInfo.id}`;

const fetchOtherSourceMusicList = async (
  musicInfo: Coral.Music.MusicInfoOnline,
): Promise<Coral.Music.MusicInfoOnline[]> => {
  const cacheKey = createOtherSourceCacheKey(musicInfo);
  const cachedList = otherSourceCache.get(cacheKey);
  if (cachedList) return cachedList;

  const pendingPromise = pendingOtherSourcePromises.get(cacheKey);
  if (pendingPromise) return pendingPromise;

  const promise = loadMusicSdk()
    .then(async (sdk) => {
      const dbCachedList = await cacheService.getCachedOtherSource(musicInfo.id);
      if (dbCachedList.length) {
        otherSourceCache.set(cacheKey, dbCachedList);
        return dbCachedList;
      }

      const rawList = await sdk.findMusic?.({
        albumName: musicInfo.meta.albumName,
        interval: musicInfo.interval ?? '',
        name: musicInfo.name,
        singer: musicInfo.singer,
        source: musicInfo.source,
      });
      const list =
        rawList
          ?.map(toOnlineMusicInfo)
          .filter((item): item is Coral.Music.MusicInfoOnline => item != null) ?? [];

      if (otherSourceCache.size > 10) otherSourceCache.clear();
      otherSourceCache.set(cacheKey, list);
      if (list.length) cacheService.saveCachedOtherSource(musicInfo.id, list);
      return list;
    })
    .finally(() => {
      pendingOtherSourcePromises.delete(cacheKey);
    });

  pendingOtherSourcePromises.set(cacheKey, promise);
  return promise;
};

const resolveOnlineMusicUrl = async (
  musicInfo: Coral.Music.MusicInfoOnline,
  options: ResolvePlayableMusicUrlOptions,
): Promise<ResolvedPlaybackUrl | null> => {
  const quality = getPreferredPlayQuality(options.preferredQuality ?? '128k', musicInfo);
  const cachedUrl = options.isRefresh
    ? ''
    : await cacheService.getCachedMusicUrl(musicInfo, quality);
  if (cachedUrl) {
    return {
      musicInfo,
      quality,
      source: 'cache',
      url: cachedUrl,
    };
  }

  if (options.allowFresh === false) return null;

  try {
    const freshUrl = await fetchFreshOnlineMusicUrl(musicInfo, quality);
    await cacheService.saveCachedMusicUrl(musicInfo, freshUrl.type, freshUrl.url);

    return {
      musicInfo,
      quality: freshUrl.type,
      source: 'fresh',
      url: freshUrl.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'Api is not found' || /^music url source not found:/.test(message)) {
      throw new Error('当前没有可用音源，请先通过“添加音源”导入并启用 User API。');
    }
    if (options.allowToggleSource === false || message === TOO_MANY_REQUESTS_MESSAGE) throw err;

    options.onToggleSource?.();
    const otherSourceList = await fetchOtherSourceMusicList(musicInfo);
    for (const otherMusicInfo of otherSourceList) {
      if (otherMusicInfo.source === musicInfo.source) continue;
      const targetQuality = getPreferredPlayQuality(
        options.preferredQuality ?? quality,
        otherMusicInfo,
      );
      if (!otherMusicInfo.meta._qualitys[targetQuality]) continue;

      options.onToggleSource?.(otherMusicInfo);
      const resolved = await resolveOnlineMusicUrl(otherMusicInfo, {
        ...options,
        allowToggleSource: false,
        preferredQuality: targetQuality,
      }).catch(() => null);
      if (resolved) return resolved;
    }

    throw err;
  }
};

const resolveWebDavMusicUrl = async (
  musicInfo: Coral.Music.MusicInfoWebDav,
): Promise<ResolvedPlaybackUrl> => {
  const result = await createWebDavStreamUrl({
    accountId: musicInfo.meta.accountId,
    href: musicInfo.meta.href,
  });

  return {
    musicInfo,
    quality: musicInfo.meta.ext === 'flac' ? 'flac' : musicInfo.meta.ext === 'wav' ? 'wav' : '320k',
    source: 'webdav',
    url: result.url,
  };
};

export const resolvePlayableMusicUrl = async (
  musicInfo: PlayerRuntimeMusicInfo,
  options: ResolvePlayableMusicUrlOptions = {},
): Promise<ResolvedPlaybackUrl | null> => {
  if (isDownloadMusicInfo(musicInfo)) {
    const downloadUrl = await resolveDownloadMusicUrl(musicInfo, options.isRefresh);
    if (downloadUrl) {
      return {
        decodedFilePath: downloadUrl.decodedFilePath,
        objectUrl: downloadUrl.objectUrl,
        decodedAudio: downloadUrl.decodedAudio,
        musicInfo,
        quality: musicInfo.metadata.quality,
        source: 'download',
        url: downloadUrl.url,
      };
    }

    if (musicInfo.metadata.musicInfo.source === 'webdav') {
      return resolveWebDavMusicUrl(musicInfo.metadata.musicInfo);
    }

    if (musicInfo.metadata.musicInfo.source === 'local') return null;

    return resolveOnlineMusicUrl(musicInfo.metadata.musicInfo, {
      ...options,
      preferredQuality: options.preferredQuality ?? musicInfo.metadata.quality,
    });
  }

  const localUrl = resolveLocalMusicUrl(musicInfo);
  if (localUrl) {
    return {
      musicInfo,
      quality: '128k',
      source: 'local',
      url: localUrl,
    };
  }

  if (musicInfo.source === 'local') {
    try {
      const internalDecodedLocal = await resolveInternalDecodedPath(musicInfo.meta.filePath);
      if (internalDecodedLocal) {
        return {
          objectUrl: internalDecodedLocal.objectUrl,
          decodedAudio: internalDecodedLocal.decodedAudio,
          musicInfo,
          quality: '128k',
          source: 'local',
          url: internalDecodedLocal.url,
        };
      }

      const decodedLocal = await resolveExternalDecodedLocalMusicUrl(musicInfo);
      if (decodedLocal) {
        return {
          decodedFilePath: decodedLocal.decodedFilePath,
          musicInfo,
          quality: '128k',
          source: 'local',
          url: decodedLocal.url,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/外部解码|FFmpeg/.test(message)) throw error;
      throw new Error(`本地音频解码失败：${message}`);
    }
    return null;
  }

  if (musicInfo.source === 'webdav') {
    return resolveWebDavMusicUrl(musicInfo);
  }

  return resolveOnlineMusicUrl(musicInfo, options);
};
