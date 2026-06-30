import { LIST_IDS } from '@common/constants';
import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';
import { listService } from './listService';

export const getPlayHistory = async (): Promise<Coral.Library.PlayRecord[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryHistoryList);
};

export const addPlayHistory = async (
  input: Coral.Library.PlayRecordInput,
): Promise<Coral.Library.PlayRecord[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryHistoryAdd, input);
};

export const removePlayHistory = async (ids: string[]): Promise<Coral.Library.PlayRecord[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryHistoryRemove, ids);
};

export const clearPlayHistory = async (): Promise<Coral.Library.PlayRecord[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryHistoryClear);
};

export const getFavoriteSongs = async (): Promise<Coral.Library.FavoriteSong[]> => {
  const musics = await listService.getListMusics(LIST_IDS.LOVE);
  return musics.map((musicInfo) => ({
    createdAt: 0,
    musicInfo,
  }));
};

export const toggleFavoriteSong = async (
  musicInfo: Coral.Music.MusicInfo,
): Promise<Coral.Library.FavoriteSong[]> => {
  const songs = await getFavoriteSongs();
  const exists = songs.some((song) => song.musicInfo.id === musicInfo.id);
  if (exists) await listService.removeListMusics(LIST_IDS.LOVE, [musicInfo.id]);
  else await listService.addListMusics(LIST_IDS.LOVE, [musicInfo], 'top');
  return await getFavoriteSongs();
};

export const getFavoriteSongLists = async (): Promise<Coral.Library.FavoriteSongList[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryFavoriteSongListList);
};

export const toggleFavoriteSongList = async (
  item: Coral.Library.FavoriteSongList,
): Promise<Coral.Library.FavoriteSongList[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryFavoriteSongListToggle, item);
};

export const removeFavoriteSongLists = async (
  ids: string[],
): Promise<Coral.Library.FavoriteSongList[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryFavoriteSongListRemove, ids);
};

export const getFavoriteAlbums = async (): Promise<Coral.Library.FavoriteAlbum[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryFavoriteAlbumList);
};

export const toggleFavoriteAlbum = async (
  item: Coral.Library.FavoriteAlbum,
): Promise<Coral.Library.FavoriteAlbum[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryFavoriteAlbumToggle, item);
};

export const removeFavoriteAlbums = async (
  ids: string[],
): Promise<Coral.Library.FavoriteAlbum[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryFavoriteAlbumRemove, ids);
};

export const getCategoryGroups = async (
  type: Coral.Library.CategoryType,
): Promise<Coral.Library.MusicCategoryGroup[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.libraryCategoryGroups, type);
};

export const getCategoryItems = async (
  query: Coral.Library.CategoryItemsQuery,
): Promise<Coral.Library.MusicCategory> => {
  if (!isElectronRenderer()) {
    return { count: 0, items: [], key: query.key, name: query.key, type: query.type };
  }
  return await ipcClient.invoke(ipcChannels.winMain.libraryCategoryItems, query);
};

export const createAlbumFavoriteFromMusic = (
  musicInfo: Coral.Music.MusicInfo,
): Coral.Library.FavoriteAlbum | null => {
  const name = musicInfo.meta.albumName?.trim();
  if (!name) return null;
  const meta = musicInfo.meta as unknown as Record<string, unknown>;
  const albumId = meta.albumId ?? meta.albumMid ?? `${musicInfo.source}:${name}:${musicInfo.singer}`;
  return {
    artist: musicInfo.singer,
    createdAt: Date.now(),
    id: String(albumId),
    img: musicInfo.meta.picUrl ?? '',
    name,
    source: musicInfo.source,
  };
};

export const libraryService = {
  addPlayHistory,
  clearPlayHistory,
  createAlbumFavoriteFromMusic,
  getCategoryGroups,
  getCategoryItems,
  getFavoriteAlbums,
  getFavoriteSongs,
  getFavoriteSongLists,
  getPlayHistory,
  removeFavoriteAlbums,
  removeFavoriteSongLists,
  removePlayHistory,
  toggleFavoriteAlbum,
  toggleFavoriteSong,
  toggleFavoriteSongList,
};
