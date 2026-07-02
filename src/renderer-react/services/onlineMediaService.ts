import { toOldMusicInfo } from '@common/utils/tools';
import { lyricService } from './lyricService';
import { musicSdkRuntime } from './musicSdkRuntime';

interface MusicSdkSource {
  getLyric?: (
    musicInfo: unknown,
    isGetLyricx?: boolean,
  ) => { promise: Promise<Coral.Music.LyricInfo> };
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

const emptyLyricInfo: Coral.Music.LyricInfo = {
  lyric: '',
  lxlyric: '',
  rlyric: '',
  tlyric: '',
};

const hasLyricContent = (lyricInfo: Coral.Music.LyricInfo): boolean =>
  [lyricInfo.lyric, lyricInfo.lxlyric, lyricInfo.tlyric, lyricInfo.rlyric].some(Boolean);

const normalizeLyricInfo = (
  lyricInfo?: Partial<Coral.Music.LyricInfo> | null,
): Coral.Music.LyricInfo => ({
  lyric: lyricInfo?.lyric ?? '',
  lxlyric: lyricInfo?.lxlyric ?? '',
  rlyric: lyricInfo?.rlyric ?? '',
  tlyric: lyricInfo?.tlyric ?? '',
});

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

const loadMusicSdk = async (): Promise<MusicSdk> => {
  await musicSdkRuntime.sync();
  const module = await import('./musicSdk/sdk');
  return module.default as MusicSdk;
};

const getSourceSdk = (sdk: MusicSdk, source: Coral.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source];
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null;
  return sourceSdk as MusicSdkSource;
};

export const getOnlineLyricInfo = async (
  musicInfo: Coral.Music.MusicInfoOnline,
): Promise<Coral.Music.LyricInfo> => {
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

const parseIntervalToSeconds = (interval: string): number => {
  // 兼容 "3:34"、"03:34"、"3:34:56" 等格式
  const parts = interval.split(':').map((part) => parseInt(part, 10));
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((acc, part) => acc * 60 + part, 0);
};

export const getOnlineLyricInfoByKeyword = async (musicInfo: {
  interval: string;
  name: string;
  singer: string;
}): Promise<Coral.Music.LyricInfo> => {
  const sdk = await loadMusicSdk();

  // 第一轮：用原始歌手名 + 歌名搜索
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

  let candidates = rawList
    .map(toOnlineMusicInfo)
    .filter((item): item is Coral.Music.MusicInfoOnline => item != null);

  // 第二轮：歌手名搜不到时（如英文歌手名 "Leehom Wang" 与平台 "王力宏" 不匹配），
  // 仅用歌名搜索，按时长最接近排序后取前 5 个候选
  if (candidates.length === 0 && musicInfo.name) {
    const fallbackRawList =
      (await sdk
        .findMusic?.({
          albumName: '',
          interval: musicInfo.interval,
          name: musicInfo.name,
          singer: '',
          source: 'local',
        })
        .catch(() => [])) ?? [];
    const fallbackCandidates = fallbackRawList
      .map(toOnlineMusicInfo)
      .filter((item): item is Coral.Music.MusicInfoOnline => item != null);

    const targetSeconds = parseIntervalToSeconds(musicInfo.interval);
    if (targetSeconds > 0) {
      fallbackCandidates.sort(
        (a, b) =>
          Math.abs(parseIntervalToSeconds(a.interval ?? '') - targetSeconds) -
          Math.abs(parseIntervalToSeconds(b.interval ?? '') - targetSeconds),
      );
    }
    candidates = fallbackCandidates;
  }

  for (const candidate of candidates.slice(0, 5)) {
    const lyricInfo = await getOnlineLyricInfo(candidate).catch(() => emptyLyricInfo);
    if (hasLyricContent(lyricInfo)) return lyricInfo;
  }

  return emptyLyricInfo;
};

export const getOnlinePicUrl = async (musicInfo: Coral.Music.MusicInfoOnline): Promise<string> => {
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
