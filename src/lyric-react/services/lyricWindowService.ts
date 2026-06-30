import type { IpcRendererEvent } from 'electron';
import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';

let previousResizable: boolean | null = null;

export const isElectronLyricRenderer = (): boolean => ipcClient.canUseIpc();

export const getConfig = async (): Promise<Coral.DesktopLyric.Config | null> => {
  if (!isElectronLyricRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.winLyric.getConfig);
};

export const updateConfig = async (config: Partial<Coral.DesktopLyric.Config>): Promise<void> => {
  if (!isElectronLyricRenderer()) return;
  await ipcClient.invoke(ipcChannels.winLyric.setConfig, config);
};

export const onConfigChanged = (
  listener: (config: Partial<Coral.DesktopLyric.Config>) => void,
): (() => void) => {
  if (!isElectronLyricRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winLyric.onConfigChange, listener);
};

export const setWindowBounds = (bounds: Coral.DesktopLyric.NewBounds): void => {
  if (!isElectronLyricRenderer()) return;
  ipcClient.send(ipcChannels.winLyric.setWinBounds, bounds);
};

export const setWindowResizeable = (resizable: boolean): void => {
  if (!isElectronLyricRenderer()) return;
  if (previousResizable === resizable) return;
  previousResizable = resizable;
  ipcClient.send(ipcChannels.winLyric.setWinResizeable, resizable);
};

export const requestMainWindowChannel = (): void => {
  if (!isElectronLyricRenderer()) return;
  ipcClient.send(ipcChannels.winLyric.requestMainWindowChannel);
};

export const onProvideMainWindowChannel = (
  listener: (event: IpcRendererEvent) => void,
): (() => void) => {
  if (!isElectronLyricRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winLyric.provideMainWindowChannel, (_payload, event) => {
    listener(event);
  });
};

export const onMainWindowInited = (listener: () => void): (() => void) => {
  if (!isElectronLyricRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winLyric.mainWindowInited, listener);
};

export const sendMouseEnterLeave = (isEnter: boolean): void => {
  if (!isElectronLyricRenderer()) return;
  ipcClient.send(ipcChannels.winLyric.mouseEnterLeave, isEnter);
};

export const onMouseEnterLeave = (listener: (isEnter: boolean) => void): (() => void) => {
  if (!isElectronLyricRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winLyric.mouseEnterLeave, listener);
};

export const onThemeChange = (listener: (setting: Coral.ThemeSetting) => void): (() => void) => {
  if (!isElectronLyricRenderer()) return () => {};
  return ipcClient.on(ipcChannels.common.themeChange, listener);
};

export const lyricWindowService = {
  getConfig,
  isElectronLyricRenderer,
  onConfigChanged,
  onMainWindowInited,
  onMouseEnterLeave,
  onProvideMainWindowChannel,
  onThemeChange,
  requestMainWindowChannel,
  sendMouseEnterLeave,
  setWindowBounds,
  setWindowResizeable,
  updateConfig,
};
