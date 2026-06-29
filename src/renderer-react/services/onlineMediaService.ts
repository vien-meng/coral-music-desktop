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

type MusicSdk = Record<string, unknown> & {
  findMusic?: (musicInfo: {
    albumName: string;
    interval: string;
    name: string;
    singer: string;
    source: string;
  }) => Promise<unknown[]>;
};

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

const toOnlineMusicInfo = (musicInfo: unknown): LX.Music.MusicInfoOnline | null => {
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
    source: source as LX.OnlineSource,
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

  return newMusicInfo as unknown as LX.Music.MusicInfoOnline;
};

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

export const getOnlineLyricInfoByKeyword = async (musicInfo: {
  interval: string;
  name: string;
  singer: string;
}): Promise<LX.Music.LyricInfo> => {
  const sdk = await loadMusicSdk();
  const rawList =
    (await sdk
      .findMusic?.({
        albumName: '',
        interval: musicInfo.interval,
        name: musicInfo.name,
        singer: musicInfo.singer,
        source: 'local',
      })
      .catch(() => [])) ?? [];

  const candidates = rawList
    .map(toOnlineMusicInfo)
    .filter((item): item is LX.Music.MusicInfoOnline => item != null);

  for (const candidate of candidates.slice(0, 5)) {
    const lyricInfo = await getOnlineLyricInfo(candidate).catch(() => emptyLyricInfo);
    if (hasLyricContent(lyricInfo)) return lyricInfo;
  }

  return emptyLyricInfo;
};

export const getOnlinePicUrl = async (musicInfo: LX.Music.MusicInfoOnline): Promise<string> => {
  if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl;

  const sdk = await loadMusicSdk();
  const picUrl = await getSourceSdk(sdk, musicInfo.source)?.getPic?.(toOldMusicInfo(musicInfo));
  return typeof picUrl === 'string' ? picUrl : '';
};

export const onlineMediaService = {
  getOnlineLyricInfoByKeyword,
  getOnlineLyricInfo,
  getOnlinePicUrl,
};
