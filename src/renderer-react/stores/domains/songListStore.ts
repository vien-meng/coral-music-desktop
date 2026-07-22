import { makeAutoObservable, observable } from 'mobx';
import { loadOnlineMusicService } from '../../services/onlineMusicServiceLoader';
import type { LibraryStore } from './libraryStore';

const defaultSongListSources: Coral.OnlineSource[] = ['kw', 'kg', 'tx', 'wy', 'mg'];

export interface SongListSortInfo {
  id: string;
  name: string;
}

export interface SongListTagItem<T extends Coral.OnlineSource = Coral.OnlineSource> {
  id: string;
  name: string;
  parent_id: string;
  parent_name: string;
  source: T;
}

export interface SongListTagGroup<Source extends Coral.OnlineSource = Coral.OnlineSource> {
  list: Array<SongListTagItem<Source>>;
  name: string;
}

export interface SongListTagInfo<Source extends Coral.OnlineSource = Coral.OnlineSource> {
  hotTag: Array<SongListTagItem<Source>>;
  source: Source;
  tags: Array<SongListTagGroup<Source>>;
}

export interface SongListItem {
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

export interface SongListInfo {
  key: string | null;
  limit: number;
  list: SongListItem[];
  noItemLabel: string;
  page: number;
  sortId: string;
  source?: Coral.OnlineSource;
  tagId: string;
  total: number;
}

export interface SongListDetailInfo {
  desc: string | null;
  id: string;
  info: {
    author?: string;
    desc?: string;
    img?: string;
    name?: string;
    play_count?: string;
  };
  key: string | null;
  limit: number;
  list: Coral.Music.MusicInfoOnline[];
  noItemLabel: string;
  page: number;
  source: Coral.OnlineSource;
  total: number;
}

export interface OpenSongListInputInfo {
  source: Coral.OnlineSource;
  text: string;
}

export type SongListDetailBackTarget = 'square' | 'favorites';

const createListInfo = (): SongListInfo => ({
  key: null,
  limit: 30,
  list: [],
  noItemLabel: '',
  page: 1,
  sortId: '',
  source: 'kw',
  tagId: '',
  total: 0,
});

const createListDetailInfo = (): SongListDetailInfo => ({
  desc: null,
  id: '',
  info: {},
  key: null,
  limit: 30,
  list: [],
  noItemLabel: '',
  page: 1,
  source: 'kw',
  total: 0,
});

const urlParamNames = ['id', 'playlistId', 'disstid', 'specialid', 'sid', 'pid'];

const normalizeSongListInput = (input: string): string => {
  const text = input.trim();
  if (!text) return '';

  try {
    const url = new URL(text);
    for (const name of urlParamNames) {
      const value = url.searchParams.get(name);
      if (value) return value;
    }
  } catch {}

  const match = text.match(
    /(?:playlistId|disstid|specialid|playlist|songlist|playsquare|id)[=/](?:id_)?([A-Za-z0-9_-]+)/i,
  );
  return match?.[1] ?? text;
};

export class SongListStore {
  detailError: string | null = null;

  detailBackTarget: SongListDetailBackTarget = 'square';

  isLoadingDetail = false;

  isLoadingList = false;

  isImportingSongList = false;

  isLoadingTags = false;

  isVisibleListDetail = false;

  listError: string | null = null;

  listDetailInfo: SongListDetailInfo = createListDetailInfo();

  listInfo: SongListInfo = createListInfo();

  openSongListInputInfo: OpenSongListInputInfo = {
    source: 'kw',
    text: '',
  };

  selectListInfo: SongListItem | null = null;

  sortList: Partial<Record<Coral.OnlineSource, SongListSortInfo[]>> = {};

  sources: Coral.OnlineSource[] = defaultSongListSources;

  tagError: string | null = null;

  tags: Partial<Record<Coral.OnlineSource, SongListTagInfo>> = {};

  constructor() {
    makeAutoObservable(
      this,
      {
        listDetailInfo: observable.ref,
        listInfo: observable.ref,
        sortList: observable.shallow,
        sources: observable.shallow,
        tags: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get activeSource(): Coral.OnlineSource {
    return this.listInfo.source ?? 'kw';
  }

  get hasListDetail(): boolean {
    return this.isVisibleListDetail && this.listDetailInfo.id.length > 0;
  }

  setListDetailVisible(isVisible: boolean): void {
    this.isVisibleListDetail = isVisible;
  }

  setDetailBackTarget(target: SongListDetailBackTarget): void {
    this.detailBackTarget = target;
  }

  setListInfo(info: Partial<SongListInfo>): void {
    this.listInfo = {
      ...this.listInfo,
      ...info,
    };
  }

  setListDetailInfo(info: Partial<SongListDetailInfo>): void {
    this.listDetailInfo = {
      ...this.listDetailInfo,
      ...info,
    };
  }

  setOpenSongListInputInfo(info: Partial<OpenSongListInputInfo>): void {
    this.openSongListInputInfo = {
      ...this.openSongListInputInfo,
      ...info,
    };
  }

  async importSongListToFavorites(
    source: Coral.OnlineSource,
    input: string,
    library: LibraryStore,
  ): Promise<Coral.Library.FavoriteSongList> {
    if (this.isImportingSongList) throw new Error('正在导入歌单，请稍候');

    const id = normalizeSongListInput(input);
    if (!id) throw new Error('请输入歌单链接或 ID');

    this.isImportingSongList = true;
    this.detailError = null;
    this.setOpenSongListInputInfo({ source, text: input.trim() });

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = await onlineMusicService.getSongListSources();
      const result = await onlineMusicService.getSongListDetail(source, id, 1);
      const favorite: Coral.Library.FavoriteSongList = {
        author: result.info.author ?? '',
        createdAt: Date.now(),
        desc: result.info.desc ?? null,
        id: result.id ?? id,
        img: result.info.img ?? '',
        name: result.info.name?.trim() || `歌单 ${result.id ?? id}`,
        playCount: result.info.play_count ?? String(result.total || result.list.length || ''),
        source,
      };

      await library.saveFavoriteSongList(favorite);
      return favorite;
    } catch (error) {
      this.detailError = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.isImportingSongList = false;
    }
  }

  async loadList(
    source = this.activeSource,
    tagId = this.listInfo.tagId,
    sortId = this.listInfo.sortId,
    page = 1,
  ): Promise<void> {
    const key = `slist__${source}__${sortId}__${tagId}__${page}`;
    this.isLoadingList = true;
    this.listError = null;
    this.setListInfo({
      key,
      noItemLabel: 'list__loading',
    });

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = await onlineMusicService.getSongListSources();
      this.sortList = {
        ...this.sortList,
        [source]: await onlineMusicService.getSongListSorts(source),
      };
      const result = await onlineMusicService.getSongLists(source, tagId, sortId, page);
      if (this.listInfo.key !== key) return;

      this.setListInfo({
        key,
        limit: result.limit,
        list: result.list,
        noItemLabel: result.list.length ? '' : 'no_item',
        page,
        source,
        sortId,
        tagId,
        total: result.total,
      });
    } catch (error) {
      this.listError = error instanceof Error ? error.message : String(error);
      this.setListInfo({
        list: [],
        noItemLabel: 'list__load_failed',
        total: 0,
      });
    } finally {
      this.isLoadingList = false;
    }
  }

  async loadListDetail(id: string, source = this.activeSource, page = 1): Promise<void> {
    if (this.isLoadingDetail) return;
    const key = `sdetail__${source}__${id}__${page}`;
    this.isLoadingDetail = true;
    this.detailError = null;
    this.setListDetailInfo({
      id,
      key,
      noItemLabel: 'list__loading',
      source,
    });

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = await onlineMusicService.getSongListSources();
      const result = await onlineMusicService.getSongListDetail(source, id, page);
      if (this.listDetailInfo.key !== key) return;

      this.setListDetailInfo({
        desc: result.info.desc ?? null,
        id,
        info: result.info,
        key,
        limit: result.limit,
        list: result.list,
        noItemLabel: result.list.length ? '' : 'no_item',
        page,
        source,
        total: result.total,
      });
      this.setListDetailVisible(true);
    } catch (error) {
      this.detailError = error instanceof Error ? error.message : String(error);
      this.setListDetailInfo({
        list: [],
        noItemLabel: 'list__load_failed',
        total: 0,
      });
    } finally {
      this.isLoadingDetail = false;
    }
  }

  async getAllListDetailMusics(): Promise<Coral.Music.MusicInfoOnline[]> {
    const { id, limit, list, source, total } = this.listDetailInfo;
    // ponytail: a source without a total cannot expose pages we cannot discover; add source cursors if needed.
    if (!id || !list.length || total <= limit) return list;

    const onlineMusicService = await loadOnlineMusicService();
    const musicMap = new Map<string | number, Coral.Music.MusicInfoOnline>();
    for (let page = 1; page <= Math.ceil(total / limit); page++) {
      const result = await onlineMusicService.getSongListDetail(source, id, page);
      for (const musicInfo of result.list) musicMap.set(musicInfo.id, musicInfo);
    }
    return [...musicMap.values()];
  }

  async loadTags(source = this.activeSource): Promise<void> {
    this.isLoadingTags = true;
    this.tagError = null;

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = await onlineMusicService.getSongListSources();
      this.sortList = {
        ...this.sortList,
        [source]: await onlineMusicService.getSongListSorts(source),
      };
      const tagInfo = await onlineMusicService.getSongListTags(source);
      this.tags = {
        ...this.tags,
        [source]: tagInfo as SongListTagInfo,
      };
    } catch (error) {
      this.tagError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isLoadingTags = false;
    }
  }
}
