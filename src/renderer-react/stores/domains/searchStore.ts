import { makeAutoObservable, observable } from 'mobx';
import type { OnlineSourceWithAll } from '../../services/onlineMusicService';
import { loadOnlineMusicService } from '../../services/onlineMusicServiceLoader';

export type SearchRouteType = 'music' | 'songlist';
export type SearchSource = OnlineSourceWithAll;

const defaultSearchSources: SearchSource[] = ['kw', 'kg', 'tx', 'wy', 'mg', 'all'];

export interface SearchMusicListState {
  key: string | null;
  limit: number;
  list: LX.Music.MusicInfo[];
  maxPage: number;
  noItemLabel: string;
  page: number;
  total: number;
}

export interface SearchSongListItem {
  author: string;
  desc: string | null;
  id: string;
  img: string;
  name: string;
  play_count: string;
  source: LX.OnlineSource;
  time?: string;
  total?: string;
}

export interface SearchSongListState {
  key: string | null;
  limit: number;
  list: SearchSongListItem[];
  maxPage: number;
  noItemLabel: string;
  page: number;
  total: number;
}

const createMusicListState = (): SearchMusicListState => ({
  key: null,
  limit: 30,
  list: [],
  maxPage: 0,
  noItemLabel: '',
  page: 1,
  total: 0,
});

const createSongListState = (): SearchSongListState => ({
  key: null,
  limit: 30,
  list: [],
  maxPage: 0,
  noItemLabel: '',
  page: 1,
  total: 0,
});

export class SearchStore {
  historyList: string[] = [];

  isSearching = false;

  musicLists: Partial<Record<SearchSource, SearchMusicListState>> = {
    all: createMusicListState(),
  };

  page = 1;

  searchError: string | null = null;

  searchText = '';

  searchType: SearchRouteType = 'music';

  songLists: Partial<Record<SearchSource, SearchSongListState>> = {
    all: createSongListState(),
  };

  source: SearchSource = 'kw';

  sources: SearchSource[] = defaultSearchSources;

  constructor() {
    makeAutoObservable(
      this,
      {
        historyList: observable.shallow,
        musicLists: observable.shallow,
        songLists: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get hasQuery(): boolean {
    return this.searchText.trim().length > 0;
  }

  get activeMusicList(): SearchMusicListState {
    return this.musicLists[this.source] ?? this.musicLists.all ?? createMusicListState();
  }

  get activeSongList(): SearchSongListState {
    return this.songLists[this.source] ?? this.songLists.all ?? createSongListState();
  }

  addHistoryWord(text: string): void {
    const word = text.trim();
    if (!word) return;

    this.historyList = [word, ...this.historyList.filter((item) => item !== word)].slice(0, 20);
  }

  clearHistoryList(): void {
    this.historyList = [];
  }

  setPage(page: number): void {
    this.page = Math.max(page, 1);
  }

  setSearchText(text: string): void {
    this.searchText = text;
    this.page = 1;
  }

  setSearchType(type: SearchRouteType): void {
    this.searchType = type;
    this.page = 1;
  }

  setSource(source: SearchSource): void {
    this.source = source;
    this.page = 1;
  }

  async submitSearch(): Promise<void> {
    const text = this.searchText.trim();
    if (!text) {
      this.resetActiveResult();
      return;
    }

    const key = `${this.searchType}__${this.source}__${this.page}__${text}`;
    this.isSearching = true;
    this.searchError = null;
    this.setActiveResultKey(key);

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = [...(await onlineMusicService.getMusicSearchSources()), 'all'];

      if (this.searchType === 'music') {
        const result = await onlineMusicService.searchMusic(
          text,
          this.page,
          this.source,
          this.activeMusicList.limit,
        );
        if (this.activeMusicList.key !== key) return;

        this.musicLists = {
          ...this.musicLists,
          [this.source]: {
            key,
            limit: result.limit,
            list: result.list,
            maxPage: result.maxPage,
            noItemLabel: text && !result.list.length && this.page === 1 ? 'no_item' : '',
            page: this.page,
            total: result.total,
          },
        };
      } else {
        const result = await onlineMusicService.searchSongLists(
          text,
          this.page,
          this.source,
          this.activeSongList.limit,
        );
        if (this.activeSongList.key !== key) return;

        this.songLists = {
          ...this.songLists,
          [this.source]: {
            key,
            limit: result.limit,
            list: result.list,
            maxPage: Math.ceil(result.total / result.limit),
            noItemLabel: text && !result.list.length && this.page === 1 ? 'no_item' : '',
            page: this.page,
            total: result.total,
          },
        };
      }

      this.addHistoryWord(text);
    } catch (error) {
      this.searchError = error instanceof Error ? error.message : String(error);
      this.setActiveNoItemLabel('list__load_failed');
    } finally {
      this.isSearching = false;
    }
  }

  private resetActiveResult(): void {
    if (this.searchType === 'music') {
      this.musicLists = {
        ...this.musicLists,
        [this.source]: createMusicListState(),
      };
      return;
    }

    this.songLists = {
      ...this.songLists,
      [this.source]: createSongListState(),
    };
  }

  private setActiveNoItemLabel(noItemLabel: string): void {
    if (this.searchType === 'music') {
      this.musicLists = {
        ...this.musicLists,
        [this.source]: {
          ...this.activeMusicList,
          noItemLabel,
        },
      };
      return;
    }

    this.songLists = {
      ...this.songLists,
      [this.source]: {
        ...this.activeSongList,
        noItemLabel,
      },
    };
  }

  private setActiveResultKey(key: string): void {
    if (this.searchType === 'music') {
      this.musicLists = {
        ...this.musicLists,
        [this.source]: {
          ...this.activeMusicList,
          key,
          noItemLabel: 'list__loading',
        },
      };
      return;
    }

    this.songLists = {
      ...this.songLists,
      [this.source]: {
        ...this.activeSongList,
        key,
        noItemLabel: 'list__loading',
      },
    };
  }
}
