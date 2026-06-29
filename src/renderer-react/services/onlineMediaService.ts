import { toOldMusicInfo } from '@common/utils/tools';
import { lyricService } from './lyricService';
import { musicSdkRuntime } from './musicSdkRuntime';

interface MusicSdkSource {
  getLyric?: (
    musicInfo: unknown,
    isGetLyricx?: boolean,
  ) => { promise: Promise<LX.Music.LyricInfo> };
  getPic?: (musicInfo: unknown) => Promise<string>;
}

type MusicSdk = Record<string, unknown>;

const emptyLyricInfo: LX.Music.LyricInfo = {
  lyric: '',
  lxlyric: '',
  rlyric: '',
  tlyric: '',
};

const hasLyricContent = (lyricInfo: LX.Music.LyricInfo): boolean =>
  [lyricInfo.lyric, lyricInfo.lxlyric, lyricInfo.tlyric, lyricInfo.rlyric].some(Boolean);

const normalizeLyricInfo = (
  lyricInfo?: Partial<LX.Music.LyricInfo> | null,
): LX.Music.LyricInfo => ({
  lyric: lyricInfo?.lyric ?? '',
  lxlyric: lyricInfo?.lxlyric ?? '',
  rlyric: lyricInfo?.rlyric ?? '',
  tlyric: lyricInfo?.tlyric ?? '',
});

const loadMusicSdk = async (): Promise<MusicSdk> => {
  await musicSdkRuntime.sync();
  const module = await import('./musicSdk/sdk');
  return module.default as MusicSdk;
};

const getSourceSdk = (sdk: MusicSdk, source: LX.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source];
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null;
  return sourceSdk as MusicSdkSource;
};

export const getOnlineLyricInfo = async (
  musicInfo: LX.Music.MusicInfoOnline,
): Promise<LX.Music.LyricInfo> => {
  const [editedLyric, rawLyric] = await Promise.all([
    lyricService.getLyricEdited(musicInfo),
    lyricService.getLyricRaw(musicInfo),
  ]);

  if (hasLyricContent(editedLyric)) return editedLyric;
  if (hasLyricContent(rawLyric)) return rawLyric;

  const sdk = await loadMusicSdk();
  const lyricRequest = getSourceSdk(sdk, musicInfo.source)?.getLyric?.(
    toOldMusicInfo(musicInfo),
    true,
  );
  if (!lyricRequest) return emptyLyricInfo;

  const lyricInfo = normalizeLyricInfo(await lyricRequest.promise);
  if (hasLyricContent(lyricInfo)) {
    await lyricService.saveLyricRaw(musicInfo, lyricInfo);
  }
  return lyricInfo;
};

export const getOnlinePicUrl = async (musicInfo: LX.Music.MusicInfoOnline): Promise<string> => {
  if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl;

  const sdk = await loadMusicSdk();
  const picUrl = await getSourceSdk(sdk, musicInfo.source)?.getPic?.(toOldMusicInfo(musicInfo));
  return typeof picUrl === 'string' ? picUrl : '';
};

export const onlineMediaService = {
  getOnlineLyricInfo,
  getOnlinePicUrl,
};
