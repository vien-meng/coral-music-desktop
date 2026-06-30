import { makeAutoObservable } from 'mobx';
import { appService } from '../../services/appService';
import { settingService } from '../../services/settingService';

export class SettingsStore {
  appSetting: Coral.AppSetting | null = null;

  envParams: Coral.EnvParams | null = null;

  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  isSaving = false;

  saveError: string | null = null;

  private readonly disposers: Array<() => void> = [];

  constructor() {
    makeAutoObservable<this, 'disposers'>(this, { disposers: false }, { autoBind: true });
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;

    this.isHydrating = true;
    this.hydrateError = null;

    try {
      if (!appService.isElectronRenderer()) {
        this.isHydrated = true;
        return;
      }

      const [appSetting, envParams] = await Promise.all([
        settingService.getAppSetting(),
        appService.getEnvParams(),
      ]);

      if (appSetting) this.applyAppSetting(appSetting);
      this.envParams = envParams;
      this.startRealtimeSync();
      appService.sendInited();
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }

  mergeAppSetting(setting: Partial<Coral.AppSetting>): void {
    this.appSetting = this.appSetting
      ? { ...this.appSetting, ...setting }
      : (setting as Coral.AppSetting);
  }

  async updateAppSetting(setting: Partial<Coral.AppSetting>): Promise<void> {
    this.isSaving = true;
    this.saveError = null;

    try {
      await settingService.updateAppSetting(setting);
      this.mergeAppSetting(setting);
    } catch (error) {
      this.saveError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isSaving = false;
    }
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return;

    this.disposers.push(
      settingService.onSettingChanged((setting) => {
        this.mergeAppSetting(setting);
      }),
    );
  }

  private applyAppSetting(setting: Coral.AppSetting): void {
    this.appSetting = setting;
  }
}
