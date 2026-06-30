import type { CoralThemeMode } from '@shared/theme/antdTheme';
import { ipcChannels, type IpcThemeCollection } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null;

const parseThemePayload = (value: unknown): Coral.ThemeSetting['theme'] | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (typeof value.name !== 'string') return null;
  if (typeof value.isDark !== 'boolean') return null;
  if (!isRecord(value.colors)) return null;

  return {
    id: value.id,
    name: value.name,
    isDark: value.isDark,
    colors: value.colors as Record<string, string>,
  };
};

const parseEncodedTheme = (rawTheme: string): Coral.ThemeSetting['theme'] | null => {
  try {
    return parseThemePayload(JSON.parse(rawTheme));
  } catch {
    try {
      return parseThemePayload(JSON.parse(decodeURIComponent(rawTheme)));
    } catch {
      return null;
    }
  }
};

export const getInitialThemeSetting = (): Coral.ThemeSetting | null => {
  const search = globalThis.location?.search;
  if (!search) return null;

  const query = new URLSearchParams(search);
  const shouldUseDarkColors = query.get('dark') === 'true';
  const rawTheme = query.get('theme');
  const theme = rawTheme
    ? parseEncodedTheme(rawTheme)
    : {
        id: shouldUseDarkColors ? 'black' : 'green',
        name: shouldUseDarkColors ? 'Black' : 'Green',
        isDark: shouldUseDarkColors,
        colors: {},
      };

  if (!theme) return null;

  return {
    shouldUseDarkColors,
    theme,
  };
};

export const resolveThemeMode = (themeSetting: Coral.ThemeSetting | null): CoralThemeMode => {
  if (!themeSetting) return 'light';
  return themeSetting.theme.isDark ? 'dark' : 'light';
};

export const getInitialThemeMode = (): CoralThemeMode => resolveThemeMode(getInitialThemeSetting());

export const getThemes = async (): Promise<IpcThemeCollection | null> => {
  if (!isElectronRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.winMain.getThemes);
};

export const saveTheme = async (theme: Coral.Theme): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.saveTheme, theme);
};

export const removeTheme = async (id: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.removeTheme, id);
};

export const onThemeChange = (listener: (setting: Coral.ThemeSetting) => void): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.common.themeChange, listener);
};

export const themeService = {
  getInitialThemeMode,
  getInitialThemeSetting,
  getThemes,
  onThemeChange,
  removeTheme,
  resolveThemeMode,
  saveTheme,
};
