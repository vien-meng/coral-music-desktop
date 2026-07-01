import { makeAutoObservable } from 'mobx';
import type { CoralThemeMode, CoralThemePreference } from '@shared/theme/antdTheme';
import { settingService } from '../../services/settingService';
import { themeService } from '../../services/themeService';
import type { SettingsStore } from './settingsStore';

export class ThemeStore {
  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  themeInfo: Coral.ThemeInfo | null = null;

  themeSetting: Coral.ThemeSetting | null = themeService.getInitialThemeSetting();

  private readonly disposers: Array<() => void> = [];

  constructor(private readonly settings: SettingsStore) {
    makeAutoObservable<this, 'disposers' | 'settings'>(
      this,
      {
        disposers: false,
        settings: false,
      },
      { autoBind: true },
    );
  }

  get allThemes(): Coral.Theme[] {
    if (!this.themeInfo) return [];
    return [...this.themeInfo.themes, ...this.themeInfo.userThemes];
  }

  get lightThemes(): Coral.Theme[] {
    return this.allThemes.filter((theme) => !theme.isDark);
  }

  get darkThemes(): Coral.Theme[] {
    return this.allThemes.filter((theme) => theme.isDark);
  }

  get themeMode(): CoralThemeMode {
    if (this.themeSetting) return themeService.resolveThemeMode(this.themeSetting);

    const appSetting = this.settings.appSetting;
    if (!appSetting) return themeService.getInitialThemeMode();

    return appSetting['theme.id'] === appSetting['theme.darkId'] ? 'dark' : 'light';
  }

  get themePreference(): CoralThemePreference {
    const appSetting = this.settings.appSetting;
    if (!appSetting) return 'system';
    if (appSetting['theme.id'] === 'auto') return 'system';
    return appSetting['theme.id'] === appSetting['theme.darkId'] ? 'dark' : 'light';
  }

  get activeThemeColors(): Record<string, string> {
    return this.themeSetting?.theme.colors ?? {};
  }

  get activeThemePrimaryColor(): string {
    return (
      this.activeThemeColors['--color-theme'] ??
      this.activeThemeColors['--color-primary'] ??
      '#f0645a'
    );
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;

    this.isHydrating = true;
    this.hydrateError = null;

    try {
      this.themeInfo = await themeService.getThemes();
      this.startRealtimeSync();
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  async setLightThemeId(id: string): Promise<void> {
    const appSetting = this.settings.appSetting;
    if (!appSetting || (appSetting['theme.lightId'] === id && appSetting['theme.id'] === id)) {
      return;
    }

    const nextSetting: Partial<Coral.AppSetting> = { 'theme.id': id, 'theme.lightId': id };
    this.settings.mergeAppSetting(nextSetting);
    await settingService.updateAppSetting(nextSetting);
  }

  async setDarkThemeId(id: string): Promise<void> {
    const appSetting = this.settings.appSetting;
    if (!appSetting || (appSetting['theme.darkId'] === id && appSetting['theme.id'] === id)) {
      return;
    }

    const nextSetting: Partial<Coral.AppSetting> = { 'theme.id': id, 'theme.darkId': id };
    this.settings.mergeAppSetting(nextSetting);
    await settingService.updateAppSetting(nextSetting);
  }

  async setThemeMode(mode: CoralThemePreference): Promise<void> {
    const appSetting = this.settings.appSetting;
    if (!appSetting) return;

    let themeId = 'auto';
    if (mode === 'dark') {
      themeId = appSetting['theme.darkId'];
    } else if (mode === 'light') {
      themeId = appSetting['theme.lightId'];
    }

    const nextSetting: Partial<Coral.AppSetting> = {
      'theme.id': themeId,
    };

    this.settings.mergeAppSetting(nextSetting);
    await settingService.updateAppSetting(nextSetting);
  }

  async removeUserTheme(id: string): Promise<void> {
    await themeService.removeTheme(id);
    await this.refreshThemes();
    if (this.themeInfo) {
      this.themeInfo = {
        ...this.themeInfo,
        userThemes: this.themeInfo.userThemes.filter((theme) => theme.id !== id),
      };
    }
  }

  async saveUserTheme(theme: Coral.Theme): Promise<void> {
    await themeService.saveTheme(theme);
    await this.refreshThemes();
    if (this.themeInfo) {
      const existingIndex = this.themeInfo.userThemes.findIndex((item) => item.id === theme.id);
      const userThemes = [...this.themeInfo.userThemes];
      if (existingIndex >= 0) {
        userThemes[existingIndex] = theme;
      } else {
        userThemes.push(theme);
      }
      this.themeInfo = {
        ...this.themeInfo,
        userThemes,
      };
    }
  }

  async applyTheme(theme: Coral.Theme): Promise<void> {
    if (theme.isDark) {
      await this.setDarkThemeId(theme.id);
    } else {
      await this.setLightThemeId(theme.id);
    }
  }

  async refreshThemes(): Promise<void> {
    this.themeInfo = await themeService.getThemes();
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return;

    this.disposers.push(
      themeService.onThemeChange((setting) => {
        this.themeSetting = setting;
      }),
    );
  }
}
