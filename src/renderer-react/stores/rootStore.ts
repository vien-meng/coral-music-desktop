import { makeAutoObservable, reaction } from 'mobx';
import { DislikeStore } from './domains/dislikeStore';
import { DownloadStore } from './domains/downloadStore';
import { LeaderboardStore } from './domains/leaderboardStore';
import { LibraryStore } from './domains/libraryStore';
import { ListStore } from './domains/listStore';
import { OpenApiStore } from './domains/openApiStore';
import { PlayerStore } from './domains/playerStore';
import { SearchStore } from './domains/searchStore';
import { SettingsStore } from './domains/settingsStore';
import { SongListStore } from './domains/songListStore';
import { SyncStore } from './domains/syncStore';
import { ThemeStore } from './domains/themeStore';
import { UiStore } from './domains/uiStore';
import { UserApiStore } from './domains/userApiStore';
import { WebDavStore } from './domains/webDavStore';

export class RootStore {
  settings = new SettingsStore();

  theme = new ThemeStore(this.settings);

  ui = new UiStore();

  dislike = new DislikeStore();

  library = new LibraryStore();

  list = new ListStore();

  player = new PlayerStore(this.settings, this.dislike, this.library, this.list);

  search = new SearchStore();

  songList = new SongListStore();

  leaderboard = new LeaderboardStore();

  download = new DownloadStore(this.settings);

  sync = new SyncStore();

  openApi = new OpenApiStore();

  userApi = new UserApiStore();

  webDav = new WebDavStore();

  migrationStage = 'Main renderer MobX domain foundations';

  private initializePromise: Promise<void> | null = null;

  constructor() {
    makeAutoObservable<this, 'initializePromise'>(
      this,
      { initializePromise: false },
      { autoBind: true },
    );
    reaction(
      () => this.ui.activeRoute,
      (route, previousRoute) => {
        if (previousRoute !== 'search' || route === 'search') return;
        const setting = this.settings.appSetting;
        if (!setting) return;
        this.search.clearSearch(
          setting['odc.isAutoClearSearchInput'],
          setting['odc.isAutoClearSearchList'],
        );
      },
    );
    reaction(
      () => this.sync.clientStatus?.status,
      (connected) => {
        if (connected) this.list.refresh().catch(() => {});
      },
    );
  }

  async initialize(): Promise<void> {
    if (!this.initializePromise) {
      this.initializePromise = this.initializeStores();
    }

    await this.initializePromise;
  }

  dispose(): void {
    this.player.dispose();
    this.download.disposeRuntime();
    this.settings.dispose();
    this.theme.dispose();
    this.dislike.dispose();
    this.sync.dispose();
  }

  private async initializeStores(): Promise<void> {
    await this.settings.hydrate();
    this.player.hydrate();
    await Promise.all([
      this.theme.hydrate(),
      this.list.hydrate(),
      this.library.hydrate(),
      this.download.hydrate(),
      this.dislike.hydrate(),
      this.sync.hydrate(),
      this.openApi.refreshStatus(),
      this.userApi.hydrate(),
      this.webDav.hydrate(),
      this.search.hydrate(),
    ]);
  }
}

export const rootStore = new RootStore();
