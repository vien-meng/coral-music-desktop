import { getDB } from '../../db';
import { getAllUserList, getListMusics } from '../list';
import {
  createFavoriteAlbumDeleteStatement,
  createFavoriteAlbumInsertStatement,
  createFavoriteAlbumQueryStatement,
  createFavoriteSongListDeleteStatement,
  createFavoriteSongListInsertStatement,
  createFavoriteSongListQueryStatement,
  createPlayHistoryClearStatement,
  createPlayHistoryDeleteStatement,
  createPlayHistoryInsertStatement,
  createPlayHistoryQueryStatement,
  createPlayHistoryTrimStatement,
} from './statements';

const HISTORY_LIMIT = 1000;
const UNKNOWN_ALBUM = '未知专辑';
const UNKNOWN_ARTIST = '未知歌手';
const UNKNOWN_GENRE = '未知类型';
const UNKNOWN_YEAR = '未知年代';

const toPlayRecord = (record: Coral.DBService.PlayHistoryInfo): Coral.Library.PlayRecord => ({
  id: record.id,
  lastDuration: record.lastDuration,
  musicInfo: JSON.parse(record.musicInfo),
  playedAt: record.playedAt,
  playCount: record.playCount,
  sourceContext: record.sourceContext,
});

const toPlayHistoryInfo = (
  input: Coral.Library.PlayRecordInput,
): Coral.DBService.PlayHistoryInfo => ({
  id: input.musicInfo.id,
  lastDuration: input.lastDuration ?? 0,
  musicInfo: JSON.stringify(input.musicInfo),
  playedAt: Date.now(),
  playCount: 1,
  source: input.musicInfo.source,
  sourceContext: input.sourceContext ?? null,
});

export const getPlayHistory = (): Coral.Library.PlayRecord[] =>
  (createPlayHistoryQueryStatement().all() as Coral.DBService.PlayHistoryInfo[]).map(toPlayRecord);

export const addPlayHistory = (
  input: Coral.Library.PlayRecordInput,
): Coral.Library.PlayRecord[] => {
  const db = getDB();
  const insert = createPlayHistoryInsertStatement();
  const trim = createPlayHistoryTrimStatement();
  db.transaction((record: Coral.DBService.PlayHistoryInfo) => {
    insert.run(record);
    trim.run(HISTORY_LIMIT);
  })(toPlayHistoryInfo(input));
  return getPlayHistory();
};

export const removePlayHistory = (ids: string[]): Coral.Library.PlayRecord[] => {
  const remove = createPlayHistoryDeleteStatement();
  const records = getPlayHistory().filter((record) => ids.includes(record.id));
  getDB().transaction((recordsToRemove: Coral.Library.PlayRecord[]) => {
    for (const record of recordsToRemove) {
      remove.run({
        id: record.musicInfo.id,
        lastDuration: record.lastDuration,
        musicInfo: JSON.stringify(record.musicInfo),
        playedAt: record.playedAt,
        playCount: record.playCount,
        source: record.musicInfo.source,
        sourceContext: record.sourceContext,
      });
    }
  })(records);
  return getPlayHistory();
};

export const clearPlayHistory = (): Coral.Library.PlayRecord[] => {
  createPlayHistoryClearStatement().run();
  return [];
};

export const getFavoriteSongLists = (): Coral.Library.FavoriteSongList[] =>
  createFavoriteSongListQueryStatement().all() as Coral.Library.FavoriteSongList[];

export const saveFavoriteSongList = (
  item: Coral.Library.FavoriteSongList,
): Coral.Library.FavoriteSongList[] => {
  createFavoriteSongListInsertStatement().run({
    ...item,
    createdAt: item.createdAt || Date.now(),
  });
  return getFavoriteSongLists();
};

export const toggleFavoriteSongList = (
  item: Coral.Library.FavoriteSongList,
): Coral.Library.FavoriteSongList[] => {
  const current = getFavoriteSongLists();
  const exists = current.some(
    (favorite) => favorite.id === item.id && favorite.source === item.source,
  );
  if (exists) {
    createFavoriteSongListDeleteStatement().run(item);
  } else {
    saveFavoriteSongList(item);
  }
  return getFavoriteSongLists();
};

export const removeFavoriteSongLists = (ids: string[]): Coral.Library.FavoriteSongList[] => {
  const remove = createFavoriteSongListDeleteStatement();
  for (const item of getFavoriteSongLists()) {
    if (ids.includes(item.id)) remove.run(item);
  }
  return getFavoriteSongLists();
};

export const getFavoriteAlbums = (): Coral.Library.FavoriteAlbum[] =>
  createFavoriteAlbumQueryStatement().all() as Coral.Library.FavoriteAlbum[];

export const toggleFavoriteAlbum = (
  item: Coral.Library.FavoriteAlbum,
): Coral.Library.FavoriteAlbum[] => {
  const current = getFavoriteAlbums();
  const exists = current.some(
    (favorite) => favorite.id === item.id && favorite.source === item.source,
  );
  if (exists) {
    createFavoriteAlbumDeleteStatement().run(item);
  } else {
    createFavoriteAlbumInsertStatement().run({
      ...item,
      createdAt: item.createdAt || Date.now(),
    });
  }
  return getFavoriteAlbums();
};

export const removeFavoriteAlbums = (ids: string[]): Coral.Library.FavoriteAlbum[] => {
  const remove = createFavoriteAlbumDeleteStatement();
  for (const item of getFavoriteAlbums()) {
    if (ids.includes(item.id)) remove.run(item);
  }
  return getFavoriteAlbums();
};

const getAllLibraryMusics = (): Coral.Music.MusicInfo[] => {
  const musicMap = new Map<string, Coral.Music.MusicInfo>();
  for (const record of getPlayHistory())
    musicMap.set(`${record.musicInfo.source}:${record.id}`, record.musicInfo);
  for (const list of getAllUserList()) {
    for (const musicInfo of getListMusics(list.id)) {
      musicMap.set(`${musicInfo.source}:${musicInfo.id}`, musicInfo);
    }
  }
  for (const musicInfo of getListMusics('love')) {
    musicMap.set(`${musicInfo.source}:${musicInfo.id}`, musicInfo);
  }
  return Array.from(musicMap.values());
};

const splitArtist = (singer: string): string =>
  singer
    .split(/、|&|;|；|\/|,|，|\|/)
    .map((item) => item.trim())
    .find(Boolean) || UNKNOWN_ARTIST;

const getMusicYear = (musicInfo: Coral.Music.MusicInfo): string => {
  const meta = musicInfo.meta as unknown as Record<string, unknown>;
  const rawYear =
    meta.year ?? meta.publishTime ?? meta.publishDate ?? meta.date ?? meta.releaseDate ?? null;
  const match = String(rawYear ?? '').match(/\d{4}/);
  return match?.[0] ?? UNKNOWN_YEAR;
};

const getMusicGenre = (musicInfo: Coral.Music.MusicInfo): string => {
  const meta = musicInfo.meta as unknown as Record<string, unknown>;
  const genre = [meta.genre, meta.tag, meta.type]
    .map((item) => String(item ?? '').trim())
    .find(Boolean);
  if (genre) return genre;
  if (musicInfo.source === 'local') return musicInfo.meta.ext?.toUpperCase() || UNKNOWN_GENRE;
  if (musicInfo.source === 'webdav') return musicInfo.meta.ext?.toUpperCase() || 'WebDAV';
  return musicInfo.source.toUpperCase();
};

const getCategoryName = (
  musicInfo: Coral.Music.MusicInfo,
  type: Coral.Library.CategoryType,
): string => {
  switch (type) {
    case 'album':
      return musicInfo.meta.albumName?.trim() || UNKNOWN_ALBUM;
    case 'artist':
      return splitArtist(musicInfo.singer);
    case 'genre':
      return getMusicGenre(musicInfo);
    case 'year':
      return getMusicYear(musicInfo);
    default:
      return UNKNOWN_GENRE;
  }
};

export const getLibraryCategoryGroups = (
  type: Coral.Library.CategoryType,
): Coral.Library.MusicCategoryGroup[] => {
  const groupMap = new Map<string, Coral.Library.MusicCategoryGroup>();
  for (const musicInfo of getAllLibraryMusics()) {
    const name = getCategoryName(musicInfo, type);
    const key = name.toLocaleLowerCase();
    const group = groupMap.get(key) ?? {
      count: 0,
      key,
      name,
      type,
    };
    group.count += 1;
    groupMap.set(key, group);
  }
  return Array.from(groupMap.values()).sort((left, right) => right.count - left.count);
};

export const getLibraryCategoryItems = ({
  key,
  type,
}: Coral.Library.CategoryItemsQuery): Coral.Library.MusicCategory => {
  const items = getAllLibraryMusics().filter(
    (musicInfo) => getCategoryName(musicInfo, type).toLocaleLowerCase() === key,
  );
  const group = getLibraryCategoryGroups(type).find((item) => item.key === key);
  return {
    count: items.length,
    items,
    key,
    name: group?.name ?? key,
    type,
  };
};
