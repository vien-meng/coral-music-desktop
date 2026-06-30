import { makeAutoObservable, observable } from 'mobx';
import {
  createEmptyWebDavAccount,
  isWebDavAudioFile,
  listWebDavAccounts,
  listWebDavDir,
  removeWebDavAccount,
  saveWebDavAccount,
  testWebDavAccount,
  toWebDavMusicInfo,
} from '../../services/webDavService';

export class WebDavStore {
  accounts: Coral.WebDav.SafeAccount[] = [];

  activeAccountId = '';

  currentPath = '/';

  error: string | null = null;

  filterText = '';

  isLoadingAccounts = false;

  isLoadingDir = false;

  isSaving = false;

  items: Coral.WebDav.FileItem[] = [];

  constructor() {
    makeAutoObservable(
      this,
      {
        accounts: observable.shallow,
        items: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get activeAccount(): Coral.WebDav.SafeAccount | null {
    return this.accounts.find((account) => account.id === this.activeAccountId) ?? null;
  }

  get filteredItems(): Coral.WebDav.FileItem[] {
    const text = this.filterText.trim().toLowerCase();
    if (!text) return this.items;
    return this.items.filter((item) => item.name.toLowerCase().includes(text));
  }

  get audioItems(): Coral.WebDav.FileItem[] {
    return this.filteredItems.filter(isWebDavAudioFile);
  }

  get breadcrumbItems(): Array<{ path: string; title: string }> {
    const parts = this.currentPath.split('/').filter(Boolean);
    const items = [{ path: '/', title: '根目录' }];
    let path = '';
    for (const part of parts) {
      path += `/${part}`;
      items.push({ path, title: part });
    }
    return items;
  }

  createAccountDraft(account?: Coral.WebDav.SafeAccount | null): Coral.WebDav.Account {
    if (!account) return createEmptyWebDavAccount();
    return {
      ...account,
      password: '',
    };
  }

  setFilterText(text: string): void {
    this.filterText = text;
  }

  setActiveAccount(accountId: string): void {
    this.activeAccountId = accountId;
    this.currentPath = '/';
    this.items = [];
  }

  async hydrate(): Promise<void> {
    await this.loadAccounts();
  }

  async loadAccounts(): Promise<void> {
    this.isLoadingAccounts = true;
    this.error = null;
    try {
      this.accounts = await listWebDavAccounts();
      if (
        !this.activeAccountId ||
        !this.accounts.some((account) => account.id === this.activeAccountId)
      ) {
        this.activeAccountId = this.accounts[0]?.id ?? '';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.isLoadingAccounts = false;
    }
  }

  async saveAccount(account: Coral.WebDav.Account): Promise<void> {
    this.isSaving = true;
    this.error = null;
    try {
      this.accounts = await saveWebDavAccount(account);
      this.activeAccountId = account.id || this.accounts[0]?.id || this.activeAccountId;
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.isSaving = false;
    }
  }

  async removeAccount(accountId: string): Promise<void> {
    this.error = null;
    this.accounts = await removeWebDavAccount(accountId);
    if (this.activeAccountId === accountId) {
      this.activeAccountId = this.accounts[0]?.id ?? '';
      this.items = [];
      this.currentPath = '/';
    }
  }

  async testAccount(account: Coral.WebDav.Account): Promise<Coral.WebDav.TestResult> {
    return testWebDavAccount(account);
  }

  async loadDir(path = this.currentPath): Promise<void> {
    if (!this.activeAccountId) return;
    this.isLoadingDir = true;
    this.error = null;
    try {
      const result = await listWebDavDir({
        accountId: this.activeAccountId,
        path,
      });
      this.currentPath = result.path;
      this.items = result.items;
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.isLoadingDir = false;
    }
  }

  toMusicInfo(item: Coral.WebDav.FileItem): Coral.Music.MusicInfoWebDav {
    return toWebDavMusicInfo(item, this.activeAccount);
  }
}
