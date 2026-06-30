import { makeAutoObservable } from 'mobx';
import { DislikeStore } from './domains/dislikeStore';
import { DownloadStore } from './domains/downloadStore';
import { LeaderboardStore } from './domains/leaderboardStore';
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

  player = new PlayerStore(this.settings, this.dislike);

  list = new ListStore();

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
      this.download.hydrate(),
      this.dislike.hydrate(),
      this.sync.hydrate(),
      this.userApi.hydrate(),
      this.webDav.hydrate(),
    ]);
  }
}

export const rootStore = new RootStore();
