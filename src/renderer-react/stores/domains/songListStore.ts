import { makeAutoObservable, observable } from 'mobx';
import { loadOnlineMusicService } from '../../services/onlineMusicServiceLoader';

const defaultSongListSources: LX.OnlineSource[] = ['kw', 'kg', 'tx', 'wy', 'mg'];

export interface SongListSortInfo {
  id: string;
  name: string;
}

export interface SongListTagItem<T extends LX.OnlineSource = LX.OnlineSource> {
  id: string;
  name: string;
  parent_id: string;
  parent_name: string;
  source: T;
}

export interface SongListTagGroup<Source extends LX.OnlineSource = LX.OnlineSource> {
  list: Array<SongListTagItem<Source>>;
  name: string;
}

export interface SongListTagInfo<Source extends LX.OnlineSource = LX.OnlineSource> {
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
  source: LX.OnlineSource;
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
  source?: LX.OnlineSource;
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
  list: LX.Music.MusicInfoOnline[];
  noItemLabel: string;
  page: number;
  source: LX.OnlineSource;
  total: number;
}

export interface OpenSongListInputInfo {
  source: string;
  text: string;
}

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

export class SongListStore {
  detailError: string | null = null;

  isLoadingDetail = false;

  isLoadingList = false;

  isLoadingTags = false;

  isVisibleListDetail = false;

  listError: string | null = null;

  listDetailInfo: SongListDetailInfo = createListDetailInfo();

  listInfo: SongListInfo = createListInfo();

  openSongListInputInfo: OpenSongListInputInfo = {
    source: '',
    text: '',
  };

  selectListInfo: SongListItem | null = null;

  sortList: Partial<Record<LX.OnlineSource, SongListSortInfo[]>> = {};

  sources: LX.OnlineSource[] = defaultSongListSources;

  tagError: string | null = null;

  tags: Partial<Record<LX.OnlineSource, SongListTagInfo>> = {};

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

  get activeSource(): LX.OnlineSource {
    return this.listInfo.source ?? 'kw';
  }

  get hasListDetail(): boolean {
    return this.isVisibleListDetail && this.listDetailInfo.id.length > 0;
  }

  setListDetailVisible(isVisible: boolean): void {
    this.isVisibleListDetail = isVisible;
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
