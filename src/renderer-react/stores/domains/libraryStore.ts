import { makeAutoObservable, observable } from 'mobx';
import { libraryService } from '../../services/libraryService';
import type { OnlineSongListItem } from '../../services/onlineMusicService';

export class LibraryStore {
  actionError: string | null = null;

  categoryGroups: Coral.Library.MusicCategoryGroup[] = [];

  categoryItems: Coral.Music.MusicInfo[] = [];

  favoriteAlbums: Coral.Library.FavoriteAlbum[] = [];

  favoriteSongs: Coral.Library.FavoriteSong[] = [];

  favoriteSongLists: Coral.Library.FavoriteSongList[] = [];

  history: Coral.Library.PlayRecord[] = [];

  isHydrated = false;

  isHydrating = false;

  isLoadingCategory = false;

  isMutating = false;

  selectedCategoryKey = '';

  selectedCategoryType: Coral.Library.CategoryType = 'album';

  constructor() {
    makeAutoObservable(
      this,
      {
        categoryGroups: observable.shallow,
        categoryItems: observable.shallow,
        favoriteAlbums: observable.shallow,
        favoriteSongs: observable.shallow,
        favoriteSongLists: observable.shallow,
        history: observable.shallow,
      },
      { autoBind: true },
    );
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;
    this.isHydrating = true;
    this.actionError = null;
    try {
      await Promise.all([
        this.loadHistory(),
        this.loadFavorites(),
        this.loadCategoryGroups(this.selectedCategoryType),
      ]);
      this.isHydrated = true;
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  async loadHistory(): Promise<void> {
    this.history = await libraryService.getPlayHistory();
  }

  async addPlayHistory(
    musicInfo: Coral.Music.MusicInfo,
    sourceContext?: string | null,
  ): Promise<void> {
    this.history = await libraryService.addPlayHistory({
      musicInfo,
      sourceContext,
    });
  }

  async removeHistory(ids: string[]): Promise<void> {
    this.history = await libraryService.removePlayHistory(ids);
  }

  async clearHistory(): Promise<void> {
    this.history = await libraryService.clearPlayHistory();
  }

  async loadFavorites(): Promise<void> {
    const [favoriteSongs, favoriteSongLists, favoriteAlbums] = await Promise.all([
      libraryService.getFavoriteSongs(),
      libraryService.getFavoriteSongLists(),
      libraryService.getFavoriteAlbums(),
    ]);
    this.favoriteSongs = favoriteSongs;
    this.favoriteSongLists = favoriteSongLists;
    this.favoriteAlbums = favoriteAlbums;
  }

  isFavoriteSong(musicId: string): boolean {
    return this.favoriteSongs.some((item) => item.musicInfo.id === musicId);
  }

  async toggleFavoriteSong(musicInfo: Coral.Music.MusicInfo): Promise<void> {
    this.isMutating = true;
    try {
      this.favoriteSongs = await libraryService.toggleFavoriteSong(musicInfo);
    } finally {
      this.isMutating = false;
    }
  }

  isFavoriteSongList(id: string, source: Coral.OnlineSource): boolean {
    return this.favoriteSongLists.some((item) => item.id === id && item.source === source);
  }

  async toggleFavoriteSongList(item: Coral.Library.FavoriteSongList): Promise<void> {
    this.favoriteSongLists = await libraryService.toggleFavoriteSongList(item);
  }

  async saveFavoriteSongList(item: Coral.Library.FavoriteSongList): Promise<void> {
    this.favoriteSongLists = await libraryService.saveFavoriteSongList(item);
    this.isHydrated = true;
  }

  async toggleFavoriteSongListItem(item: OnlineSongListItem): Promise<void> {
    await this.toggleFavoriteSongList({
      author: item.author,
      createdAt: Date.now(),
      desc: item.desc,
      id: item.id,
      img: item.img,
      name: item.name,
      playCount: item.play_count,
      source: item.source,
    });
  }

  async removeFavoriteSongLists(ids: string[]): Promise<void> {
    this.favoriteSongLists = await libraryService.removeFavoriteSongLists(ids);
  }

  isFavoriteAlbum(id: string, source: Coral.Music.MusicInfo['source']): boolean {
    return this.favoriteAlbums.some((item) => item.id === id && item.source === source);
  }

  async toggleFavoriteAlbum(item: Coral.Library.FavoriteAlbum): Promise<void> {
    this.favoriteAlbums = await libraryService.toggleFavoriteAlbum(item);
  }

  async toggleFavoriteAlbumFromMusic(musicInfo: Coral.Music.MusicInfo): Promise<void> {
    const album = libraryService.createAlbumFavoriteFromMusic(musicInfo);
    if (!album) return;
    await this.toggleFavoriteAlbum(album);
  }

  async removeFavoriteAlbums(ids: string[]): Promise<void> {
    this.favoriteAlbums = await libraryService.removeFavoriteAlbums(ids);
  }

  async loadCategoryGroups(type: Coral.Library.CategoryType): Promise<void> {
    this.isLoadingCategory = true;
    this.selectedCategoryType = type;
    try {
      this.categoryGroups = await libraryService.getCategoryGroups(type);
      const nextKey = this.categoryGroups[0]?.key ?? '';
      this.selectedCategoryKey = nextKey;
      this.categoryItems = nextKey
        ? (await libraryService.getCategoryItems({ key: nextKey, type })).items
        : [];
    } finally {
      this.isLoadingCategory = false;
    }
  }

  async loadCategoryItems(key: string): Promise<void> {
    if (!key) return;
    this.isLoadingCategory = true;
    this.selectedCategoryKey = key;
    try {
      this.categoryItems = (
        await libraryService.getCategoryItems({
          key,
          type: this.selectedCategoryType,
        })
      ).items;
    } finally {
      this.isLoadingCategory = false;
    }
  }
}
