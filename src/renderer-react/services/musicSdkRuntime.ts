import { settingService } from './settingService';
import { userApiService } from './userApiService';

type LegacyRuntimeState = typeof import('./musicSdk/sdk/runtimeState.js');

interface LegacyMusicUrlResult {
  source: Coral.Source;
  action: 'musicUrl';
  data: {
    type: Coral.Quality;
    url: string;
  };
}

interface LegacyUserApiMusicSource {
  getLyric: (
    musicInfo: unknown,
    isGetLyricx?: boolean,
  ) => {
    promise: Promise<Coral.Music.LyricInfo>;
  };
  getMusicUrl: (
    musicInfo: unknown,
    quality: Coral.Quality,
  ) => {
    promise: Promise<{
      type: Coral.Quality;
      url: string;
    }>;
  };
  getPic: (musicInfo: unknown) => Promise<string>;
}

let runtimeStatePromise: Promise<LegacyRuntimeState> | null = null;
let syncedApiSource: string | null = null;
let syncPromise: Promise<string> | null = null;

const normalizeUserApiMusicUrlResult = (
  result: unknown,
  fallbackQuality: Coral.Quality,
): { type: Coral.Quality; url: string } => {
  if (typeof result === 'string') {
    return {
      type: fallbackQuality,
      url: result,
    };
  }

  if (typeof result !== 'object' || result == null) {
    throw new Error('User API did not return a playable URL.');
  }

  const rawResult = result as Partial<LegacyMusicUrlResult> & {
    type?: Coral.Quality;
    url?: string;
  };
  const data =
    typeof rawResult.data === 'object' && rawResult.data != null ? rawResult.data : rawResult;
  const url = data.url;
  if (typeof url !== 'string' || !url) throw new Error('User API did not return a playable URL.');

  return {
    type: data.type ?? fallbackQuality,
    url,
  };
};

const loadRuntimeState = async (): Promise<LegacyRuntimeState> => {
  runtimeStatePromise ??= import('./musicSdk/sdk/runtimeState.js');
  return await runtimeStatePromise;
};

const createUserApiMusicSource = (source: Coral.Source): LegacyUserApiMusicSource => ({
  getLyric(musicInfo, isGetLyricx) {
    return {
      promise: userApiService
        .requestUserApi({
          action: 'lyric',
          info: {
            isGetLyricx,
            musicInfo,
          },
          source,
        })
        .then((result) => {
          const lyricResult = result as Partial<Coral.Music.LyricInfo> & {
            data?: Partial<Coral.Music.LyricInfo>;
          };
          const lyricInfo = lyricResult.data ?? lyricResult;
          return {
            lyric: lyricInfo.lyric ?? '',
            lxlyric: lyricInfo.lxlyric ?? '',
            rlyric: lyricInfo.rlyric ?? '',
            tlyric: lyricInfo.tlyric ?? '',
          };
        }),
    };
  },
  getMusicUrl(musicInfo, quality) {
    return {
      promise: userApiService
        .requestUserApi({
          action: 'musicUrl',
          info: {
            musicInfo,
            type: quality,
          },
          source,
        })
        .then((result) => normalizeUserApiMusicUrlResult(result, quality)),
    };
  },
  getPic(musicInfo) {
    return userApiService
      .requestUserApi({
        action: 'pic',
        info: {
          musicInfo,
        },
        source,
      })
      .then((result) => {
        if (typeof result === 'string') return result;
        if (typeof result !== 'object' || result == null) return '';

        const rawResult = result as { data?: string; url?: string };
        return rawResult.data ?? rawResult.url ?? '';
      });
  },
});

const applyUserApiRuntime = async (
  runtimeState: LegacyRuntimeState,
  apiInfo: Coral.UserApi.UserApiInfo,
): Promise<void> => {
  const apis: Record<string, LegacyUserApiMusicSource> = {};
  for (const [source, sourceInfo] of Object.entries(apiInfo.sources ?? {})) {
    if (sourceInfo.type !== 'music' || !sourceInfo.actions.includes('musicUrl')) continue;
    apis[source] = createUserApiMusicSource(source as Coral.Source);
  }

  runtimeState.userApi.list = [apiInfo];
  runtimeState.userApi.status = true;
  runtimeState.userApi.message = '';
  runtimeState.userApi.apis = apis;
};

export interface MusicSdkRuntimeSyncOptions {
  force?: boolean;
}

const syncMusicSdkRuntimeInternal = async ({
  force = false,
}: MusicSdkRuntimeSyncOptions = {}): Promise<string> => {
  const runtimeState = await loadRuntimeState();
  const setting = await settingService.getAppSetting();
  const apiSource = setting?.['common.apiSource'] || 'temp';

  runtimeState.apiSource.value = apiSource;
  if (!apiSource.startsWith('user_api')) {
    syncedApiSource = apiSource;
    return apiSource;
  }

  if (force || syncedApiSource !== apiSource) {
    await userApiService.setUserApi(apiSource, { force });
    syncedApiSource = apiSource;
  }

  const status = await userApiService.getUserApiStatus();
  if (!status.status || !status.apiInfo) {
    throw new Error(status.message || '当前音源未就绪，请刷新或重新启用 User API 音源。');
  }

  await applyUserApiRuntime(runtimeState, status.apiInfo);
  return apiSource;
};

export const syncMusicSdkRuntime = async (
  options: MusicSdkRuntimeSyncOptions = {},
): Promise<string> => {
  if (options.force) return syncMusicSdkRuntimeInternal(options);

  syncPromise ??= syncMusicSdkRuntimeInternal().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
};

export const musicSdkRuntime = {
  sync: syncMusicSdkRuntime,
};
