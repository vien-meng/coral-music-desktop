import { similar } from '@common/utils/common';
import { toNewMusicInfo } from '@common/utils/tools';

export type OnlineSourceWithAll = Coral.OnlineSource | 'all';

export interface OnlineMusicSearchResult {
  limit: number;
  list: Coral.Music.MusicInfo[];
  maxPage: number;
  source: OnlineSourceWithAll;
  total: number;
}

export interface OnlineSongListItem {
  author: string;
  desc: string | null;
  id: string;
  img: string;
  name: string;
  play_count: string;
  source: Coral.OnlineSource;
  time?: string;
  total?: string;
}

export interface OnlineSongListResult {
  limit: number;
  list: OnlineSongListItem[];
  source: OnlineSourceWithAll;
  total: number;
}

export interface OnlineSongListDetailResult {
  id?: string;
  info: {
    author?: string;
    desc?: string;
    img?: string;
    name?: string;
    play_count?: string;
  };
  limit: number;
  list: Coral.Music.MusicInfoOnline[];
  source: Coral.OnlineSource;
  total: number;
}

export interface OnlineLeaderboardBoardItem {
  bangid: string;
  id: string;
  name: string;
}

export interface OnlineLeaderboardBoard {
  list: OnlineLeaderboardBoardItem[];
  source: Coral.OnlineSource;
}

export interface OnlineLeaderboardDetailResult {
  limit: number;
  list: Coral.Music.MusicInfoOnline[];
  source: Coral.OnlineSource;
  total: number;
}

interface MusicSdkSourceInfo {
  id: Coral.OnlineSource;
  name: string;
}

interface RawMusicSearchResult {
  allPage: number;
  limit: number;
  list: Coral.Music.MusicInfo[];
  source: Coral.OnlineSource;
  total: number;
}

interface RawSongListSearchResult {
  limit: number;
  list: OnlineSongListItem[];
  source: Coral.OnlineSource;
  total: number;
}

interface MusicSearchApi {
  search: (text: string, page: number, limit: number) => Promise<RawMusicSearchResult>;
}

interface SongListApi {
  getList: (sortId: string, tagId: string, page: number) => Promise<OnlineSongListResult>;
  getListDetail: (id: string, page: number) => Promise<OnlineSongListDetailResult>;
  getTags: () => Promise<unknown>;
  search: (text: string, page: number, limit: number) => Promise<RawSongListSearchResult>;
  sortList?: Array<{ id: string; name: string }>;
}

interface LeaderboardApi {
  getBoards: () => Promise<OnlineLeaderboardBoard>;
  getList: (id: string, page: number) => Promise<OnlineLeaderboardDetailResult>;
}

interface MusicSdkSource {
  leaderboard?: LeaderboardApi;
  musicSearch?: MusicSearchApi;
  songList?: SongListApi;
}

type MusicSdk = Record<string, unknown> & {
  sources: MusicSdkSourceInfo[];
};

let musicSdkPromise: Promise<MusicSdk> | null = null;

const loadMusicSdk = async (): Promise<MusicSdk> => {
  musicSdkPromise ??= import('./musicSdk/sdk').then((module) => module.default as MusicSdk);
  return await musicSdkPromise;
};

const getSourceSdk = async (source: Coral.OnlineSource): Promise<MusicSdkSource | null> => {
  const sdk = await loadMusicSdk();
  const sourceSdk = sdk[source];
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null;
  return sourceSdk as MusicSdkSource;
};

const dedupeById = <Item extends { id: string }>(list: Item[]): Item[] => {
  const ids = new Set<string>();
  return list.filter((item) => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
};

const getSourcesByFeature = async (
  feature: keyof MusicSdkSource,
): Promise<Coral.OnlineSource[]> => {
  const sdk = await loadMusicSdk();
  const result: Coral.OnlineSource[] = [];
  for (const source of sdk.sources.map((source) => source.id)) {
    if (await getSourceSdk(source).then((sourceSdk) => Boolean(sourceSdk?.[feature])))
      result.push(source);
  }
  return sdk.sources.map((source) => source.id).filter((source) => result.includes(source));
};

const sortMusicByKeyword = (
  list: Coral.Music.MusicInfo[],
  keyword: string,
): Coral.Music.MusicInfo[] =>
  [...list].sort((left, right) => {
    const leftScore = similar(keyword, `${left.name} ${left.singer}`);
    const rightScore = similar(keyword, `${right.name} ${right.singer}`);
    return rightScore - leftScore;
  });

const sortSongListsByKeyword = (
  list: OnlineSongListItem[],
  keyword: string,
): OnlineSongListItem[] =>
  [...list].sort((left, right) => similar(keyword, right.name) - similar(keyword, left.name));

const normalizeMusicSearchResult = (
  result: RawMusicSearchResult,
  source: Coral.OnlineSource,
): OnlineMusicSearchResult => ({
  limit: result.limit,
  list: dedupeById(result.list.map((musicInfo) => toNewMusicInfo(musicInfo))),
  maxPage: result.allPage,
  source,
  total: result.total,
});

export const getMusicSearchSources = async (): Promise<Coral.OnlineSource[]> =>
  await getSourcesByFeature('musicSearch');

export const getSongListSources = async (): Promise<Coral.OnlineSource[]> =>
  await getSourcesByFeature('songList');

export const getSongListSorts = async (
  source: Coral.OnlineSource,
): Promise<Array<{ id: string; name: string }>> =>
  (await getSourceSdk(source))?.songList?.sortList ?? [];

export const getLeaderboardSources = async (): Promise<Coral.OnlineSource[]> =>
  await getSourcesByFeature('leaderboard');

export const searchMusic = async (
  text: string,
  page: number,
  source: OnlineSourceWithAll,
  limit = 30,
): Promise<OnlineMusicSearchResult> => {
  if (source === 'all') {
    const results = await Promise.all(
      (await getMusicSearchSources()).map(async (currentSource) => {
        try {
          const result = await searchMusic(text, page, currentSource, limit);
          return result;
        } catch {
          return {
            limit,
            list: [],
            maxPage: 0,
            source: currentSource,
            total: 0,
          };
        }
      }),
    );
    const maxPage = Math.max(0, ...results.map((result) => result.maxPage));
    const total = Math.max(0, ...results.map((result) => result.total));
    const resultLimit = Math.max(limit, ...results.map((result) => result.limit));
    const list = sortMusicByKeyword(dedupeById(results.flatMap((result) => result.list)), text);

    return {
      limit: resultLimit,
      list,
      maxPage,
      source,
      total,
    };
  }

  const searchApi = (await getSourceSdk(source))?.musicSearch;
  if (!searchApi) throw new Error(`music search source not found: ${source}`);

  const result = await searchApi.search(text, page, limit);
  return normalizeMusicSearchResult(result, source);
};

export const searchSongLists = async (
  text: string,
  page: number,
  source: OnlineSourceWithAll,
  limit = 20,
): Promise<OnlineSongListResult> => {
  if (source === 'all') {
    const results = await Promise.all(
      (await getSongListSources()).map(async (currentSource) => {
        try {
          return await searchSongLists(text, page, currentSource, limit);
        } catch {
          return {
            limit,
            list: [],
            source: currentSource,
            total: 0,
          };
        }
      }),
    );
    const total = Math.max(0, ...results.map((result) => result.total));
    const resultLimit = Math.max(limit, ...results.map((result) => result.limit));
    const list = sortSongListsByKeyword(
      results.flatMap((result) => result.list),
      text,
    );

    return {
      limit: resultLimit,
      list,
      source,
      total,
    };
  }

  const songListApi = (await getSourceSdk(source))?.songList;
  if (!songListApi) throw new Error(`song list search source not found: ${source}`);

  const result = await songListApi.search(text, page, limit);
  return {
    limit: result.limit,
    list: result.list,
    source,
    total: result.total,
  };
};

export const getSongListTags = async (source: Coral.OnlineSource): Promise<unknown> => {
  const songListApi = (await getSourceSdk(source))?.songList;
  if (!songListApi) throw new Error(`song list source not found: ${source}`);

  return await songListApi.getTags();
};

export const getSongLists = async (
  source: Coral.OnlineSource,
  tagId: string,
  sortId: string,
  page: number,
): Promise<OnlineSongListResult> => {
  const songListApi = (await getSourceSdk(source))?.songList;
  if (!songListApi) throw new Error(`song list source not found: ${source}`);

  return await songListApi.getList(sortId, tagId, page);
};

export const getSongListDetail = async (
  source: Coral.OnlineSource,
  id: string,
  page: number,
): Promise<OnlineSongListDetailResult> => {
  const songListApi = (await getSourceSdk(source))?.songList;
  if (!songListApi) throw new Error(`song list source not found: ${source}`);

  const result = await songListApi.getListDetail(id, page);
  return {
    ...result,
    list: dedupeById(
      result.list.map((musicInfo) => toNewMusicInfo(musicInfo) as Coral.Music.MusicInfoOnline),
    ),
    source,
  };
};

export const getLeaderboardBoards = async (
  source: Coral.OnlineSource,
): Promise<OnlineLeaderboardBoard> => {
  const leaderboardApi = (await getSourceSdk(source))?.leaderboard;
  if (!leaderboardApi) throw new Error(`leaderboard source not found: ${source}`);

  return await leaderboardApi.getBoards();
};

export const getLeaderboardDetail = async (
  source: Coral.OnlineSource,
  id: string,
  page: number,
): Promise<OnlineLeaderboardDetailResult> => {
  const leaderboardApi = (await getSourceSdk(source))?.leaderboard;
  if (!leaderboardApi) throw new Error(`leaderboard source not found: ${source}`);

  const result = await leaderboardApi.getList(id, page);
  return {
    ...result,
    list: dedupeById(
      result.list.map((musicInfo) => toNewMusicInfo(musicInfo) as Coral.Music.MusicInfoOnline),
    ),
    source,
  };
};

export const onlineMusicService = {
  getLeaderboardBoards,
  getLeaderboardDetail,
  getLeaderboardSources,
  getMusicSearchSources,
  getSongListDetail,
  getSongListSources,
  getSongListSorts,
  getSongListTags,
  getSongLists,
  searchMusic,
  searchSongLists,
};
