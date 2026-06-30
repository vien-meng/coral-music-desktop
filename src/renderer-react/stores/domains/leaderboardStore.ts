import { makeAutoObservable, observable } from 'mobx';
import { loadOnlineMusicService } from '../../services/onlineMusicServiceLoader';

const defaultLeaderboardSources: Coral.OnlineSource[] = ['kw', 'kg', 'tx', 'wy', 'mg'];

export interface LeaderboardBoardItem {
  bangid: string;
  id: string;
  name: string;
}

export interface LeaderboardBoard {
  list: LeaderboardBoardItem[];
  source: Coral.OnlineSource;
}

export interface LeaderboardListDetailInfo {
  id: string;
  key: string | null;
  limit: number;
  list: Coral.Music.MusicInfoOnline[];
  noItemLabel: string;
  page: number;
  source: Coral.OnlineSource | null;
  total: number;
}

const createListDetailInfo = (): LeaderboardListDetailInfo => ({
  id: '',
  key: null,
  limit: 30,
  list: [],
  noItemLabel: '',
  page: 1,
  source: null,
  total: 0,
});

export class LeaderboardStore {
  boardId: string | null = null;

  boards: Partial<Record<Coral.OnlineSource, LeaderboardBoard>> = {};

  detailError: string | null = null;

  isLoadingBoards = false;

  isLoadingDetail = false;

  listDetailInfo: LeaderboardListDetailInfo = createListDetailInfo();

  source: Coral.OnlineSource = 'kw';

  sources: Coral.OnlineSource[] = defaultLeaderboardSources;

  viewMode: 'board' | 'music' = 'board';

  constructor() {
    makeAutoObservable(
      this,
      {
        boards: observable.shallow,
        listDetailInfo: observable.ref,
        sources: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get activeBoardList(): LeaderboardBoardItem[] {
    return this.boards[this.source]?.list ?? [];
  }

  setBoard(board: LeaderboardBoard): void {
    this.boards = {
      ...this.boards,
      [board.source]: board,
    };
  }

  setListDetailInfo(info: Partial<LeaderboardListDetailInfo>): void {
    this.listDetailInfo = {
      ...this.listDetailInfo,
      ...info,
    };
  }

  setRouteState(source: Coral.OnlineSource, boardId: string | null): void {
    this.source = source;
    this.boardId = boardId;
  }

  setViewMode(viewMode: 'board' | 'music'): void {
    this.viewMode = viewMode;
  }

  async loadBoards(source = this.source): Promise<void> {
    this.isLoadingBoards = true;
    this.detailError = null;

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = await onlineMusicService.getLeaderboardSources();
      const board = await onlineMusicService.getLeaderboardBoards(source);
      this.setBoard(board);
      if (!this.boardId) this.boardId = board.list[0]?.id ?? null;
      if (this.boardId) this.viewMode = 'music';
    } catch (error) {
      this.detailError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isLoadingBoards = false;
    }
  }

  async loadListDetail(id: string, page = 1): Promise<void> {
    if (this.isLoadingDetail) return;
    const [source, boardId] = id.split('__') as [Coral.OnlineSource, string];
    const key = `${id}__${page}`;
    this.isLoadingDetail = true;
    this.detailError = null;
    this.setRouteState(source, id);
    this.setListDetailInfo({
      id,
      key,
      noItemLabel: 'list__loading',
      source,
    });

    try {
      const onlineMusicService = await loadOnlineMusicService();
      this.sources = await onlineMusicService.getLeaderboardSources();
      const result = await onlineMusicService.getLeaderboardDetail(source, boardId, page);
      if (this.listDetailInfo.key !== key) return;

      this.setListDetailInfo({
        id,
        key,
        limit: result.limit,
        list: result.list,
        noItemLabel: result.list.length ? '' : 'no_item',
        page,
        source,
        total: result.total,
      });
      this.viewMode = 'music';
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
}
