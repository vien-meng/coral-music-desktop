import { makeAutoObservable } from 'mobx'
import type { CoralThemeMode } from '@shared/theme/antdTheme'
import { settingService } from '../../services/settingService'
import { themeService } from '../../services/themeService'
import type { SettingsStore } from './settingsStore'

export class ThemeStore {
  hydrateError: string | null = null
  isHydrated = false
  isHydrating = false
  themeInfo: LX.ThemeInfo | null = null
  themeSetting: LX.ThemeSetting | null = themeService.getInitialThemeSetting()

  private readonly disposers: Array<() => void> = []

  constructor(private readonly settings: SettingsStore) {
    makeAutoObservable<this, 'disposers' | 'settings'>(
      this,
      {
        disposers: false,
        settings: false,
      },
      { autoBind: true },
    )
  }

  get allThemes(): LX.Theme[] {
    if (!this.themeInfo) return []
    return [...this.themeInfo.themes, ...this.themeInfo.userThemes]
  }

  get lightThemes(): LX.Theme[] {
    return this.allThemes.filter(theme => !theme.isDark)
  }

  get darkThemes(): LX.Theme[] {
    return this.allThemes.filter(theme => theme.isDark)
  }

  get themeMode(): CoralThemeMode {
    if (this.themeSetting) return themeService.resolveThemeMode(this.themeSetting)

    const appSetting = this.settings.appSetting
    if (!appSetting) return themeService.getInitialThemeMode()

    return appSetting['theme.id'] === appSetting['theme.darkId'] ? 'dark' : 'light'
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return

    this.isHydrating = true
    this.hydrateError = null

    try {
      this.themeInfo = await themeService.getThemes()
      this.startRealtimeSync()
      this.isHydrated = true
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isHydrating = false
    }
  }

  async setLightThemeId(id: string): Promise<void> {
    const appSetting = this.settings.appSetting
    if (!appSetting || appSetting['theme.lightId'] === id) return

    const nextSetting: Partial<LX.AppSetting> = { 'theme.lightId': id }
    this.settings.mergeAppSetting(nextSetting)
    await settingService.updateAppSetting(nextSetting)
  }

  async setDarkThemeId(id: string): Promise<void> {
    const appSetting = this.settings.appSetting
    if (!appSetting || appSetting['theme.darkId'] === id) return

    const nextSetting: Partial<LX.AppSetting> = { 'theme.darkId': id }
    this.settings.mergeAppSetting(nextSetting)
    await settingService.updateAppSetting(nextSetting)
  }

  async setThemeMode(mode: CoralThemeMode): Promise<void> {
    const appSetting = this.settings.appSetting
    if (!appSetting) return

    const themeId = mode === 'dark'
      ? appSetting['theme.darkId']
      : appSetting['theme.lightId']

    const nextSetting: Partial<LX.AppSetting> = {
      'theme.id': themeId,
    }

    this.settings.mergeAppSetting(nextSetting)
    await settingService.updateAppSetting(nextSetting)
  }

  async removeUserTheme(id: string): Promise<void> {
    await themeService.removeTheme(id)
    if (this.themeInfo) {
      this.themeInfo = {
        ...this.themeInfo,
        userThemes: this.themeInfo.userThemes.filter(theme => theme.id !== id),
      }
    }
  }

  async saveUserTheme(theme: LX.Theme): Promise<void> {
    await themeService.saveTheme(theme)
    if (this.themeInfo) {
      const existingIndex = this.themeInfo.userThemes.findIndex(item => item.id === theme.id)
      const userThemes = [...this.themeInfo.userThemes]
      if (existingIndex >= 0) {
        userThemes[existingIndex] = theme
      } else {
        userThemes.push(theme)
      }
      this.themeInfo = {
        ...this.themeInfo,
        userThemes,
      }
    }
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose()
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return

    this.disposers.push(
      themeService.onThemeChange(setting => {
        this.themeSetting = setting
      }),
    )
  }
}
